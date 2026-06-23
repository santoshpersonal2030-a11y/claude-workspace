import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/razorpay";

// Starts payment for an EXISTING pending booking (e.g. one auto-created from a
// recurring-pooja subscription). Owner-scoped by RLS; verification reuses the
// shared /api/razorpay/verify route which captures + confirms the booking.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // RLS confines this select to the user's own bookings.
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, total_amount, status")
    .eq("id", id)
    .maybeSingle();
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "pending") {
    return NextResponse.json(
      { error: "This booking isn't awaiting payment." },
      { status: 409 },
    );
  }

  if (!razorpayConfigured()) {
    return NextResponse.json({ razorpay: null });
  }

  const order = await createRazorpayOrder({
    amountInPaise: booking.total_amount * 100,
    receipt: `booking_${booking.id}`,
    notes: { type: "booking", booking_id: booking.id },
  });

  await supabase.from("payments").insert({
    user_id: user.id,
    payment_for: "booking",
    booking_id: booking.id,
    amount: booking.total_amount,
    currency: "INR",
    razorpay_order_id: order.id,
    status: "created",
  });

  return NextResponse.json({
    razorpay: {
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    },
  });
}
