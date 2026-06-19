import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  createRazorpayOrder,
  razorpayConfigured,
} from "@/lib/razorpay";

const DEFAULT_KIT_PRICE = 751;

type BookingBody = {
  poojaSlug: string;
  bookingDate: string;
  timeSlot: string;
  language?: string;
  address: string;
  city: string;
  pincode?: string;
  notes?: string;
  samagriKit?: boolean;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as BookingBody;
  if (!body.poojaSlug || !body.bookingDate || !body.timeSlot || !body.address) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Look up the pooja and trust the DB for pricing — never the client.
  const { data: pooja, error: poojaError } = await supabase
    .from("poojas")
    .select("id, starting_price, samagri_kit_price")
    .eq("slug", body.poojaSlug)
    .eq("active", true)
    .maybeSingle();

  if (poojaError || !pooja) {
    return NextResponse.json({ error: "Pooja not found" }, { status: 404 });
  }

  const servicePrice = pooja.starting_price;
  const samagriPrice = body.samagriKit
    ? (pooja.samagri_kit_price ?? DEFAULT_KIT_PRICE)
    : 0;
  const total = servicePrice + samagriPrice;

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      pooja_id: pooja.id,
      booking_date: body.bookingDate,
      time_slot: body.timeSlot,
      language: body.language ?? null,
      address: body.address,
      city: body.city,
      pincode: body.pincode ?? null,
      notes: body.notes ?? null,
      samagri_kit: Boolean(body.samagriKit),
      service_price: servicePrice,
      samagri_price: samagriPrice,
      total_amount: total,
      status: "pending",
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: "Could not create booking" },
      { status: 500 },
    );
  }

  // If Razorpay isn't configured yet, return the booking so the UI can show a
  // "we'll confirm shortly" state without payment.
  if (!razorpayConfigured()) {
    return NextResponse.json({ bookingId: booking.id, razorpay: null });
  }

  const order = await createRazorpayOrder({
    amountInPaise: total * 100,
    receipt: `booking_${booking.id}`,
    notes: { type: "booking", booking_id: booking.id },
  });

  await supabase.from("payments").insert({
    user_id: user.id,
    payment_for: "booking",
    booking_id: booking.id,
    amount: total,
    currency: "INR",
    razorpay_order_id: order.id,
    status: "created",
  });

  return NextResponse.json({
    bookingId: booking.id,
    razorpay: {
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    },
  });
}
