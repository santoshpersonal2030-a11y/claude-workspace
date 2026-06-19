import { NextResponse } from "next/server";

import { verifyRazorpaySignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

type VerifyBody = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as VerifyBody;
  if (
    !body.razorpayOrderId ||
    !body.razorpayPaymentId ||
    !body.razorpaySignature
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // A valid signature can only be produced by Razorpay using our secret, so
  // this is what actually proves the payment happened.
  const valid = verifyRazorpaySignature({
    razorpayOrderId: body.razorpayOrderId,
    razorpayPaymentId: body.razorpayPaymentId,
    signature: body.razorpaySignature,
  });
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Use the service-role client so status transitions to "paid" can't be forged
  // by a client calling Supabase directly.
  const admin = createAdminClient();

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .select("id, payment_for, booking_id, order_id, status")
    .eq("razorpay_order_id", body.razorpayOrderId)
    .maybeSingle();

  if (paymentError || !payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Idempotent: if we've already captured this payment, just succeed.
  if (payment.status === "captured") {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  await admin
    .from("payments")
    .update({
      status: "captured",
      razorpay_payment_id: body.razorpayPaymentId,
      razorpay_signature: body.razorpaySignature,
    })
    .eq("id", payment.id);

  if (payment.payment_for === "booking" && payment.booking_id) {
    await admin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", payment.booking_id);
  } else if (payment.payment_for === "order" && payment.order_id) {
    await admin
      .from("orders")
      .update({ status: "paid" })
      .eq("id", payment.order_id);
  }

  return NextResponse.json({ ok: true });
}
