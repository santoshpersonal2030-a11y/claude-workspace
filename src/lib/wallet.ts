// SERVER-ONLY: store-credit wallet ledger and reward grants. All writes go
// through the service-role admin client (wallet_transactions has no user-write
// RLS policy), so amounts can never be forged from the browser. Idempotency is
// enforced by the partial unique indexes on (order_id, reason) and
// (booking_id, reason).

import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  REWARD_DEFAULTS,
  loyaltyEarned,
  type RewardConfig,
} from "@/lib/rewards";

export type WalletReason =
  | "loyalty_earn"
  | "redeem"
  | "referral_referrer"
  | "referral_referee"
  | "refund"
  | "signup_bonus"
  | "admin_adjust"
  | "topup"
  | "live_consult";

type Source = { orderId?: string | null; bookingId?: string | null };

// Reward settings (single row). Cached per request; falls back to defaults if
// the row or DB is unavailable (e.g. during static build).
export const getRewardSettings = cache(async (): Promise<RewardConfig> => {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("reward_settings")
      .select(
        "rewards_enabled, referrer_reward, referee_reward, loyalty_earn_pct, max_redeem_pct",
      )
      .eq("id", 1)
      .maybeSingle();
    if (!data) return REWARD_DEFAULTS;
    return {
      rewardsEnabled: data.rewards_enabled,
      referrerReward: data.referrer_reward,
      refereeReward: data.referee_reward,
      loyaltyEarnPct: Number(data.loyalty_earn_pct),
      maxRedeemPct: data.max_redeem_pct,
    };
  } catch (err) {
    console.error("getRewardSettings failed, using defaults:", err);
    return REWARD_DEFAULTS;
  }
});

// Actual ledger balance (sum of all transactions) for a user.
export async function getWalletBalance(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("wallet_transactions")
    .select("amount")
    .eq("user_id", userId);
  return (data ?? []).reduce((s, r) => s + r.amount, 0);
}

// Credit already committed to still-pending orders/bookings (the customer
// chose to redeem it but hasn't paid yet). It's debited only on capture, so we
// subtract it here to stop the same credit being applied to two open carts.
async function getReservedCredit(userId: string): Promise<number> {
  const admin = createAdminClient();
  const [orders, bookings] = await Promise.all([
    admin
      .from("orders")
      .select("wallet_used")
      .eq("user_id", userId)
      .eq("status", "pending"),
    admin
      .from("bookings")
      .select("wallet_used")
      .eq("user_id", userId)
      .eq("status", "pending"),
  ]);
  const sum = (rows: { wallet_used: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + (r.wallet_used ?? 0), 0);
  return sum(orders.data) + sum(bookings.data);
}

// Spendable balance = ledger balance minus credit reserved by open carts.
export async function getAvailableBalance(userId: string): Promise<number> {
  const [balance, reserved] = await Promise.all([
    getWalletBalance(userId),
    getReservedCredit(userId),
  ]);
  return Math.max(0, balance - reserved);
}

export type WalletEntry = {
  id: string;
  amount: number;
  reason: WalletReason;
  note: string | null;
  created_at: string;
};

export async function listWalletTransactions(
  userId: string,
  limit = 50,
): Promise<WalletEntry[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("wallet_transactions")
    .select("id, amount, reason, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as WalletEntry[];
}

// Inserts a ledger row, swallowing unique-violation (23505) so repeated grants
// for the same (order/booking, reason) are no-ops. Returns true if a row was
// actually written.
async function addTxn(
  userId: string,
  amount: number,
  reason: WalletReason,
  source: Source,
  note: string,
): Promise<boolean> {
  if (amount === 0) return false;
  const admin = createAdminClient();
  const { error } = await admin.from("wallet_transactions").insert({
    user_id: userId,
    amount,
    reason,
    order_id: source.orderId ?? null,
    booking_id: source.bookingId ?? null,
    note,
  });
  if (error) {
    if (error.code === "23505") return false; // already granted
    throw error;
  }
  return true;
}

// Credit or debit with a generic idempotency reference, deduped by the partial
// unique index on (reference, reason). Used by wallet top-ups (reference = the
// razorpay order id) and per-minute consult charges (reference =
// `${sessionId}:${minute}`). Returns true only if a row was actually written;
// false on a duplicate reference+reason (so retries/double-clicks are safe).
export async function addReferencedTxn(
  userId: string,
  amount: number,
  reason: WalletReason,
  reference: string,
  note: string,
): Promise<boolean> {
  if (amount === 0) return false;
  const admin = createAdminClient();
  const { error } = await admin.from("wallet_transactions").insert({
    user_id: userId,
    amount,
    reason,
    reference,
    note,
  });
  if (error) {
    if (error.code === "23505") return false; // duplicate reference — already applied
    throw error;
  }
  return true;
}

// Generic admin credit/debit (used by the admin adjust action and refunds).
export async function adjustWallet(
  userId: string,
  amount: number,
  reason: WalletReason,
  note: string,
  source: Source = {},
): Promise<boolean> {
  return addTxn(userId, amount, reason, source, note);
}

// Loyalty earn-back on the net cash a customer paid for an order/booking.
export async function grantLoyalty(
  userId: string,
  netSpend: number,
  source: Source,
): Promise<void> {
  const settings = await getRewardSettings();
  if (!settings.rewardsEnabled) return;
  const amount = loyaltyEarned(netSpend, settings.loyaltyEarnPct);
  if (amount <= 0) return;
  await addTxn(
    userId,
    amount,
    "loyalty_earn",
    source,
    `${settings.loyaltyEarnPct}% back on your order`,
  );
}

// Referral payout, fired once when the referred customer completes their first
// paid sale. The referral_rewarded flag is flipped atomically so only one
// caller (verify vs. webhook, order vs. booking) actually pays out.
export async function grantReferralReward(
  refereeUserId: string,
  source: Source,
): Promise<void> {
  const settings = await getRewardSettings();
  if (!settings.rewardsEnabled) return;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("referred_by, referral_rewarded")
    .eq("id", refereeUserId)
    .maybeSingle();
  if (!profile?.referred_by || profile.referral_rewarded) return;

  // Atomic guard: only the first caller flips false → true.
  const { data: flipped } = await admin
    .from("profiles")
    .update({ referral_rewarded: true })
    .eq("id", refereeUserId)
    .eq("referral_rewarded", false)
    .select("id");
  if (!flipped || flipped.length === 0) return;

  await addTxn(
    refereeUserId,
    settings.refereeReward,
    "referral_referee",
    source,
    "Welcome bonus — thanks for joining via a referral",
  );
  await addTxn(
    profile.referred_by,
    settings.referrerReward,
    "referral_referrer",
    source,
    "Referral reward — a friend completed their first booking",
  );
}

// Debit the credit a customer applied at checkout, once the sale is paid.
export async function settleRedemption(
  userId: string,
  walletUsed: number,
  source: Source,
): Promise<void> {
  if (walletUsed <= 0) return;
  await addTxn(userId, -walletUsed, "redeem", source, "Store credit applied");
}

// Returns the user's referral code, generating + persisting one if missing
// (older rows are backfilled by migration, but new sign-ups may not have one
// until first needed).
export async function ensureReferralCode(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();
  if (data?.referral_code) return data.referral_code;

  const { generateReferralCode } = await import("@/lib/referral-code");
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    const { error } = await admin
      .from("profiles")
      .update({ referral_code: code })
      .eq("id", userId)
      .is("referral_code", null);
    if (!error) return code;
    if (error.code !== "23505") break; // not a uniqueness clash — give up
  }
  const { data: again } = await admin
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();
  return again?.referral_code ?? null;
}
