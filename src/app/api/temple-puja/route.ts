import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/razorpay";
import { getTemplePuja } from "@/lib/temple-pujas";

type Body = {
  pujaSlug: string;
  devoteeName: string;
  gotra?: string;
  sankalp?: string;
  familyNames?: string;
  preferredDate?: string;
  phone: string;
  email?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  if (!body.pujaSlug || !body.devoteeName?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Pricing & metadata come from the server-side catalog, never the client.
  const puja = getTemplePuja(body.pujaSlug);
  if (!puja) {
    return NextResponse.json({ error: "Puja not found" }, { status: 404 });
  }

  const { data: booking, error } = await supabase
    .from("temple_puja_bookings")
    .insert({
      user_id: user.id,
      puja_slug: puja.slug,
      puja_name: puja.name,
      temple_name: puja.temple,
      amount: puja.price,
      devotee_name: body.devoteeName.trim(),
      gotra: body.gotra?.trim() || null,
      sankalp: body.sankalp?.trim() || null,
      family_names: body.familyNames?.trim() || null,
      preferred_date: body.preferredDate || null,
      phone: body.phone.trim(),
      email: body.email?.trim() || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !booking) {
    return NextResponse.json(
      { error: "Could not create the temple puja booking." },
      { status: 500 },
    );
  }

  if (!razorpayConfigured()) {
    return NextResponse.json({ templePujaId: booking.id, razorpay: null });
  }

  const order = await createRazorpayOrder({
    amountInPaise: puja.price * 100,
    receipt: `temple_${booking.id}`,
    notes: { type: "temple_puja", temple_puja_id: booking.id },
  });

  await supabase.from("payments").insert({
    user_id: user.id,
    payment_for: "temple_puja",
    temple_puja_id: booking.id,
    amount: puja.price,
    currency: "INR",
    razorpay_order_id: order.id,
    status: "created",
  });

  return NextResponse.json({
    templePujaId: booking.id,
    razorpay: {
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    },
  });
}
