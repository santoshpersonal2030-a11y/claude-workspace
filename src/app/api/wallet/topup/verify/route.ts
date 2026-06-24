import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  verifyRazorpaySignature,
  fetchRazorpayOrder,
} from "@/lib/razorpay";
import { addReferencedTxn, getWalletBalance } from "@/lib/wallet";

type VerifyBody = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

// Confirms a wallet top-up: checks the Checkout signature, then credits the
// wallet by the amount RAZORPAY says was paid (never a client value). Idempotent
// via the (reference, reason) unique index, so a refresh/replay won't double-credit.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as VerifyBody;
  if (
    !body.razorpayOrderId ||
    !body.razorpayPaymentId ||
    !body.razorpaySignature
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const valid = verifyRazorpaySignature({
    razorpayOrderId: body.razorpayOrderId,
    razorpayPaymentId: body.razorpayPaymentId,
    signature: body.razorpaySignature,
  });
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Authoritative amount + ownership come from Razorpay's record of the order.
  const order = await fetchRazorpayOrder(body.razorpayOrderId);
  if (order.status !== "paid" || order.amount_paid <= 0) {
    return NextResponse.json({ error: "Payment not captured" }, { status: 402 });
  }

  const rupees = Math.round(order.amount_paid / 100);
  await addReferencedTxn(
    user.id,
    rupees,
    "topup",
    body.razorpayOrderId, // reference — dedupes replays
    "Wallet top-up",
  );

  const balance = await getWalletBalance(user.id);
  return NextResponse.json({ ok: true, credited: rupees, balance });
}
