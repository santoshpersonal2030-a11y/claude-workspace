import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/razorpay";
import { getAvailableBalance, getRewardSettings } from "@/lib/wallet";
import { redeemableAmount } from "@/lib/rewards";

const DEFAULT_KIT_PRICE = 751;

type Item = { poojaSlug: string; bookingDate: string; timeSlot: string };
type PackageBody = {
  items: Item[];
  address: string;
  city: string;
  pincode?: string;
  language?: string;
  samagriKit?: boolean;
  redeemWallet?: boolean;
};

// Creates all the bookings of a multi-ceremony package together, grouped by a
// package_id, with ONE combined Razorpay order. Capturing that payment confirms
// every ceremony in the package (see capturePaymentByRazorpayOrder).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as PackageBody;
  const items = (body.items ?? []).filter(
    (i) => i.poojaSlug && i.bookingDate && i.timeSlot,
  );
  if (items.length === 0 || !body.address || !body.city) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const packageId = randomUUID();
  let total = 0;
  let firstBookingId: string | null = null;

  for (const item of items) {
    const { data: pooja } = await supabase
      .from("poojas")
      .select("id, starting_price, samagri_kit_price")
      .eq("slug", item.poojaSlug)
      .eq("active", true)
      .maybeSingle();
    if (!pooja) continue;

    const service = pooja.starting_price;
    const samagri = body.samagriKit
      ? (pooja.samagri_kit_price ?? DEFAULT_KIT_PRICE)
      : 0;
    const lineTotal = service + samagri;

    const { data: booking } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        pooja_id: pooja.id,
        package_id: packageId,
        booking_date: item.bookingDate,
        time_slot: item.timeSlot,
        language: body.language ?? null,
        address: body.address,
        city: body.city,
        pincode: body.pincode?.trim() || null,
        samagri_kit: Boolean(body.samagriKit),
        samagri_price: samagri,
        service_price: service,
        total_amount: lineTotal,
        status: "pending",
      })
      .select("id")
      .single();

    if (booking) {
      total += lineTotal;
      if (!firstBookingId) firstBookingId = booking.id;
    }
  }

  if (!firstBookingId) {
    return NextResponse.json(
      { error: "Could not create the package" },
      { status: 500 },
    );
  }

  if (!razorpayConfigured()) {
    return NextResponse.json({ packageId, razorpay: null });
  }

  // Store-credit redemption for the whole package, recorded on the first
  // booking (capture settles each sibling's wallet_used). Capped to leave >= ₹1
  // payable so a Razorpay payment still occurs.
  let walletUsed = 0;
  if (body.redeemWallet) {
    const settings = await getRewardSettings();
    if (settings.rewardsEnabled) {
      const available = await getAvailableBalance(user.id);
      walletUsed = Math.min(
        redeemableAmount(available, total, settings.maxRedeemPct),
        Math.max(0, total - 1),
      );
    }
  }
  if (walletUsed > 0) {
    await supabase
      .from("bookings")
      .update({ wallet_used: walletUsed })
      .eq("id", firstBookingId);
  }
  const payable = Math.max(1, total - walletUsed);

  const order = await createRazorpayOrder({
    amountInPaise: payable * 100,
    receipt: `package_${packageId.slice(0, 18)}`,
    notes: { type: "package", package_id: packageId },
  });

  await supabase.from("payments").insert({
    user_id: user.id,
    payment_for: "booking",
    booking_id: firstBookingId,
    amount: payable,
    currency: "INR",
    razorpay_order_id: order.id,
    status: "created",
  });

  return NextResponse.json({
    packageId,
    razorpay: {
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    },
  });
}
