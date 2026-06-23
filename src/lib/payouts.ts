// SERVER-ONLY: drives a real bank payout for one payroll line via RazorpayX,
// caching the payee's contact/fund-account and recording the result. Idempotent
// — the unique payouts.payroll_run_item_id row plus Razorpay's idempotency key
// make a retry safe. A no-op (with a clear reason) until RazorpayX is keyed.

import { createAdminClient } from "@/lib/supabase/admin";
import {
  razorpayxConfigured,
  createContact,
  createFundAccount,
  createPayout,
} from "@/lib/razorpayx";
import { captureException } from "@/lib/observability";

export type PayoutOutcome = { ok: boolean; status?: string; error?: string };

export async function runPayout(
  payrollRunItemId: string,
): Promise<PayoutOutcome> {
  if (!razorpayxConfigured()) {
    return { ok: false, error: "RazorpayX is not configured." };
  }
  const admin = createAdminClient();

  const { data: item } = await admin
    .from("payroll_run_items")
    .select("id, pandit_id, net_pay, paid")
    .eq("id", payrollRunItemId)
    .maybeSingle();
  if (!item) return { ok: false, error: "Payslip line not found." };
  if (item.net_pay <= 0) return { ok: false, error: "Nothing to pay." };

  // Don't re-pay a line that already settled successfully.
  const { data: existing } = await admin
    .from("payouts")
    .select("status")
    .eq("payroll_run_item_id", payrollRunItemId)
    .maybeSingle();
  if (existing && existing.status !== "failed") {
    return { ok: false, error: `Payout already ${existing.status}.` };
  }

  const { data: account } = await admin
    .from("priest_payout_accounts")
    .select("*")
    .eq("pandit_id", item.pandit_id)
    .maybeSingle();
  if (!account?.account_number || !account.ifsc || !account.account_name) {
    return { ok: false, error: "No verified bank account on file." };
  }

  const { data: pandit } = await admin
    .from("pandits")
    .select("full_name, phone, login_email")
    .eq("id", item.pandit_id)
    .maybeSingle();

  try {
    // Create + cache the RazorpayX contact and fund account once per priest.
    let contactId = account.razorpayx_contact_id;
    if (!contactId) {
      contactId = await createContact({
        name: pandit?.full_name ?? account.account_name,
        phone: pandit?.phone,
        email: pandit?.login_email,
        referenceId: item.pandit_id,
      });
      await admin
        .from("priest_payout_accounts")
        .update({ razorpayx_contact_id: contactId })
        .eq("pandit_id", item.pandit_id);
    }

    let fundAccountId = account.razorpayx_fund_account_id;
    if (!fundAccountId) {
      fundAccountId = await createFundAccount({
        contactId,
        accountName: account.account_name,
        ifsc: account.ifsc,
        accountNumber: account.account_number,
      });
      await admin
        .from("priest_payout_accounts")
        .update({ razorpayx_fund_account_id: fundAccountId })
        .eq("pandit_id", item.pandit_id);
    }

    const result = await createPayout({
      fundAccountId,
      amountInPaise: item.net_pay * 100,
      referenceId: payrollRunItemId,
      narration: "BookMyPoojari payout",
      idempotencyKey: payrollRunItemId,
    });

    await admin.from("payouts").upsert(
      {
        payroll_run_item_id: payrollRunItemId,
        pandit_id: item.pandit_id,
        amount: item.net_pay,
        status: result.status,
        razorpayx_payout_id: result.id,
        utr: result.utr,
        failure_reason: null,
      },
      { onConflict: "payroll_run_item_id" },
    );

    // Anything other than an outright failure counts as initiated — mark the
    // line paid and stamp the UTR (or payout id until the UTR is assigned).
    if (result.status !== "failed" && result.status !== "cancelled") {
      await admin
        .from("payroll_run_items")
        .update({
          paid: true,
          paid_at: new Date().toISOString(),
          payment_ref: result.utr || result.id,
        })
        .eq("id", payrollRunItemId);
    }

    return { ok: true, status: result.status };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Payout failed";
    await captureException(err, {
      tags: { area: "payouts" },
      extra: { payrollRunItemId, panditId: item.pandit_id },
    });
    await admin.from("payouts").upsert(
      {
        payroll_run_item_id: payrollRunItemId,
        pandit_id: item.pandit_id,
        amount: item.net_pay,
        status: "failed",
        failure_reason: reason.slice(0, 300),
      },
      { onConflict: "payroll_run_item_id" },
    );
    return { ok: false, error: reason };
  }
}
