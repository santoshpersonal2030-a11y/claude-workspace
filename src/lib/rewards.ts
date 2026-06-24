// Pure reward economics — store-credit redemption caps and loyalty earn-back.
// Server-authoritative callers pass live balances/settings; kept dependency-free
// so it can be unit-tested.

export type RewardConfig = {
  rewardsEnabled: boolean;
  referrerReward: number; // credit to the referrer (whole rupees)
  refereeReward: number; // credit to the newly-referred customer
  loyaltyEarnPct: number; // % of net cash spend earned back as credit
  maxRedeemPct: number; // cap: max % of an order/booking payable by credit
};

export const REWARD_DEFAULTS: RewardConfig = {
  rewardsEnabled: true,
  referrerReward: 100,
  refereeReward: 100,
  loyaltyEarnPct: 2,
  maxRedeemPct: 50,
};

// Whole-rupee store credit that may be applied to a sale of `payable` (the
// amount due after coupons + shipping), given the customer's available
// `balance` and the percentage cap. Never exceeds the balance, the cap, or the
// amount due.
export function redeemableAmount(
  balance: number,
  payable: number,
  maxRedeemPct: number,
): number {
  if (balance <= 0 || payable <= 0) return 0;
  const pct = Math.max(0, Math.min(100, maxRedeemPct));
  const cap = Math.floor((payable * pct) / 100);
  return Math.max(0, Math.min(Math.floor(balance), cap, payable));
}

// Loyalty credit earned (whole rupees) on a net cash spend.
export function loyaltyEarned(netSpend: number, pct: number): number {
  if (netSpend <= 0 || pct <= 0) return 0;
  return Math.floor((netSpend * pct) / 100);
}
