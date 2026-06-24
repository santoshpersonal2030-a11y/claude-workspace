import { NextResponse } from "next/server";

import { verifyRazorpaySignature } from "@/lib/razorpay";
import { capturePaymentByRazorpayOrder } from "@/lib/payments";

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

  const result = await capturePaymentByRazorpayOrder({
    razorpayOrderId: body.razorpayOrderId,
    razorpayPaymentId: body.razorpayPaymentId,
    signature: body.razorpaySignature,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status: result.status });
}
