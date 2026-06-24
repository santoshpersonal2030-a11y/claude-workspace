import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/razorpay";

export const MIN_TOPUP = 100;
export const MAX_TOPUP = 50_000;

// Creates a Razorpay order to add cash credit to the wallet. The wallet is then
// spent per-minute on live consultations. Kept self-contained (it does NOT write
// to `payments`, whose CHECK constraint requires a booking/order) — crediting
// happens in ./verify after the signature is checked.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { amount?: number };
  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
    return NextResponse.json(
      { error: `Enter an amount between ₹${MIN_TOPUP} and ₹${MAX_TOPUP}.` },
      { status: 400 },
    );
  }

  if (!razorpayConfigured()) {
    // Same dormant-until-keyed pattern as the rest of the payment surface.
    return NextResponse.json({ configured: false });
  }

  const order = await createRazorpayOrder({
    amountInPaise: amount * 100,
    receipt: `topup_${user.id.slice(0, 8)}_${Date.now()}`,
    notes: { type: "wallet_topup", user_id: user.id },
  });

  return NextResponse.json({
    configured: true,
    razorpay: {
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    },
  });
}
