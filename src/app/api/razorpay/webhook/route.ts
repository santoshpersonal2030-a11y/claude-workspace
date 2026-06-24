import { NextResponse } from "next/server";

import {
  razorpayWebhookConfigured,
  verifyWebhookSignature,
} from "@/lib/razorpay";
import { capturePaymentByRazorpayOrder } from "@/lib/payments";

// Razorpay webhook backstop. Razorpay calls this server-to-server when a
// payment is captured, so orders/bookings still get marked paid even if the
// customer's browser closed before the client-side verify call ran.
//
// Configure in: Razorpay Dashboard → Settings → Webhooks. Subscribe to the
// `payment.captured` and `order.paid` events and set RAZORPAY_WEBHOOK_SECRET.
type RazorpayEntity = { id?: string; order_id?: string };
type WebhookBody = {
  event: string;
  payload?: {
    payment?: { entity?: RazorpayEntity };
    order?: { entity?: RazorpayEntity };
  };
};

export async function POST(request: Request) {
  if (!razorpayWebhookConfigured()) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  }

  // Signature is computed over the RAW body, so read text (not json) first.
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // We only act on capture-type events; everything else is acknowledged.
  if (body.event !== "payment.captured" && body.event !== "order.paid") {
    return NextResponse.json({ ok: true, ignored: body.event });
  }

  const payment = body.payload?.payment?.entity;
  const razorpayOrderId =
    payment?.order_id ?? body.payload?.order?.entity?.id ?? null;

  if (!razorpayOrderId) {
    return NextResponse.json({ ok: true, ignored: "no order id" });
  }

  const result = await capturePaymentByRazorpayOrder({
    razorpayOrderId,
    razorpayPaymentId: payment?.id,
  });

  // Always 200 on a valid signature so Razorpay doesn't keep retrying; an
  // unmatched payment just means it isn't ours.
  return NextResponse.json({ ok: true, status: result.status });
}
