import crypto from "node:crypto";

// SERVER-ONLY Razorpay helpers. We talk to the REST API directly (Basic auth)
// and verify signatures with Node crypto, so there's no SDK dependency.

const RAZORPAY_API = "https://api.razorpay.com/v1";

export function razorpayConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
  );
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
};

// Creates a Razorpay order. `amountInPaise` must be an integer (₹1 = 100 paise).
export async function createRazorpayOrder(params: {
  amountInPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amountInPaise,
      currency: "INR",
      receipt: params.receipt,
      notes: params.notes,
    }),
  });

  if (!res.ok) {
    throw new Error(`Razorpay order creation failed: ${await res.text()}`);
  }
  return (await res.json()) as RazorpayOrder;
}

// Verifies the signature Razorpay Checkout returns on success. The signature is
// HMAC-SHA256(`${orderId}|${paymentId}`) keyed with the secret. Constant-time
// comparison avoids timing leaks.
export function verifyRazorpaySignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(params.signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
