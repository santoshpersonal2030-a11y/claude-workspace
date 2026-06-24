// Pure per-minute billing math for live consultations. No I/O, no Supabase —
// just the arithmetic that decides how many minutes to charge for an in-progress
// session, so it can be unit-tested in isolation. The server route
// (/api/live/tick) feeds it the wall clock + the wallet balance and persists the
// result; this module never touches state.

export const MS_PER_MINUTE = 60_000;

// Whole minutes a session has run, charged per STARTED minute (so a 10-second
// chat already costs one minute, like AstroTalk/Astroyogi). Always at least 1
// once started; clock skew (now < start) is floored to 1.
export function billableMinutes(startedAtMs: number, nowMs: number): number {
  const elapsed = nowMs - startedAtMs;
  if (elapsed <= 0) return 1;
  return Math.max(1, Math.ceil(elapsed / MS_PER_MINUTE));
}

// How many whole minutes `spendable` INR buys at this rate.
export function affordableMinutes(spendable: number, ratePerMin: number): number {
  if (ratePerMin <= 0) return 0;
  return Math.max(0, Math.floor(spendable / ratePerMin));
}

// Can a user start a session at all? They need at least one minute's balance.
export function canAfford(balance: number, ratePerMin: number): boolean {
  return ratePerMin > 0 && balance >= ratePerMin;
}

export type BillingState = {
  startedAtMs: number;
  nowMs: number;
  ratePerMin: number;
  /** Minutes already charged to the wallet for this session. */
  minutesAlreadyBilled: number;
  /** INR already charged for this session (= minutesAlreadyBilled * rate). */
  amountAlreadyBilled: number;
  /** Spendable wallet balance right now (after prior charges). */
  availableBalance: number;
};

export type BillingResult = {
  /** Minutes the session should be billed for in total, after this tick. */
  targetMinutes: number;
  /** New minutes to charge on THIS tick (>= 0). */
  deltaMinutes: number;
  /** INR to debit on this tick (deltaMinutes * rate). */
  deltaCharge: number;
  /** Total INR billed after this tick. */
  newAmountBilled: number;
  /** True when elapsed time exceeds what the wallet can cover — session must end. */
  exhausted: boolean;
};

// Decide the incremental charge for a tick. The customer can spend, in total on
// this session, what they have left PLUS what we already took — so we cap target
// minutes at that ceiling and flag `exhausted` when wall-clock outruns it.
export function computeBilling(state: BillingState): BillingResult {
  const {
    startedAtMs,
    nowMs,
    ratePerMin,
    minutesAlreadyBilled,
    amountAlreadyBilled,
    availableBalance,
  } = state;

  const spendableTotal = availableBalance + amountAlreadyBilled;
  const maxMinutes = affordableMinutes(spendableTotal, ratePerMin);
  const elapsed = billableMinutes(startedAtMs, nowMs);

  // Never bill fewer minutes than already charged, never more than affordable.
  const targetMinutes = Math.max(
    minutesAlreadyBilled,
    Math.min(elapsed, maxMinutes),
  );
  const deltaMinutes = Math.max(0, targetMinutes - minutesAlreadyBilled);
  const deltaCharge = deltaMinutes * ratePerMin;

  return {
    targetMinutes,
    deltaMinutes,
    deltaCharge,
    newAmountBilled: amountAlreadyBilled + deltaCharge,
    exhausted: elapsed > maxMinutes,
  };
}
