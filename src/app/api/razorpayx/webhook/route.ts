import { NextResponse } from "next/server";

import {
  razorpayxWebhookConfigured,
  verifyRazorpayxWebhook,
} from "@/lib/razorpayx";
import { createAdminClient } from "@/lib/supabase/admin";

// RazorpayX payout webhook — keeps the payouts ledger and payslip status in
// sync with asynchronous settlement (payouts start queued/processing and
// settle later). Configure in the RazorpayX dashboard with the events
// payout.processed / payout.reversed / payout.failed / payout.updated and set
// RAZORPAYX_WEBHOOK_SECRET. We match payouts by reference_id (the payroll line
// id we set when initiating) or the payout id.
type PayoutEntity = {
  id?: string;
  status?: string;
  utr?: string | null;
  reference_id?: string | null;
  failure_reason?: string | null;
  status_details?: { description?: string } | null;
};

const SETTLED = new Set(["processed"]);
const REVERSED = new Set(["reversed", "failed", "cancelled", "rejected"]);

export async function POST(request: Request) {
  if (!razorpayxWebhookConfigured()) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyRazorpayxWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: { event?: string; payload?: { payout?: { entity?: PayoutEntity } } };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const entity = body.payload?.payout?.entity;
  if (!body.event?.startsWith("payout.") || !entity) {
    return NextResponse.json({ ok: true, ignored: body.event });
  }

  const admin = createAdminClient();
  const status = entity.status ?? "";
  const failureReason =
    entity.failure_reason ?? entity.status_details?.description ?? null;

  // Locate the payout row by our reference (payroll line) or the payout id.
  const match = entity.reference_id
    ? { col: "payroll_run_item_id", val: entity.reference_id }
    : entity.id
      ? { col: "razorpayx_payout_id", val: entity.id }
      : null;
  if (!match) return NextResponse.json({ ok: true, ignored: "no reference" });

  const { data: payout } = await admin
    .from("payouts")
    .select("id, payroll_run_item_id")
    .eq(match.col, match.val)
    .maybeSingle();
  if (!payout) return NextResponse.json({ ok: true, ignored: "unmatched" });

  await admin
    .from("payouts")
    .update({
      status: status || undefined,
      utr: entity.utr ?? undefined,
      razorpayx_payout_id: entity.id ?? undefined,
      failure_reason: REVERSED.has(status) ? failureReason : null,
    })
    .eq("id", payout.id);

  // Reflect terminal outcomes on the payslip line so the admin sees the truth.
  if (SETTLED.has(status)) {
    await admin
      .from("payroll_run_items")
      .update({ paid: true, payment_ref: entity.utr || entity.id || null })
      .eq("id", payout.payroll_run_item_id);
  } else if (REVERSED.has(status)) {
    await admin
      .from("payroll_run_items")
      .update({ paid: false })
      .eq("id", payout.payroll_run_item_id);
  }

  return NextResponse.json({ ok: true, status });
}
