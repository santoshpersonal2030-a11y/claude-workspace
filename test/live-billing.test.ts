import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MS_PER_MINUTE,
  billableMinutes,
  affordableMinutes,
  canAfford,
  computeBilling,
} from "../src/lib/live-billing.ts";

const start = 1_000_000_000_000;

test("billableMinutes charges per started minute, min 1", () => {
  assert.equal(billableMinutes(start, start), 1); // 0s -> 1 min
  assert.equal(billableMinutes(start, start + 10_000), 1); // 10s -> 1 min
  assert.equal(billableMinutes(start, start + MS_PER_MINUTE), 1); // exactly 1 min
  assert.equal(billableMinutes(start, start + MS_PER_MINUTE + 1), 2); // 1m0.001s -> 2
  assert.equal(billableMinutes(start, start + 5 * MS_PER_MINUTE), 5);
  assert.equal(billableMinutes(start, start - 5000), 1); // clock skew -> 1
});

test("affordableMinutes / canAfford", () => {
  assert.equal(affordableMinutes(100, 25), 4);
  assert.equal(affordableMinutes(110, 25), 4); // floors
  assert.equal(affordableMinutes(0, 25), 0);
  assert.equal(affordableMinutes(100, 0), 0); // guard against /0
  assert.equal(canAfford(25, 25), true);
  assert.equal(canAfford(24, 25), false);
  assert.equal(canAfford(100, 0), false);
});

test("computeBilling charges only the new minutes since last tick", () => {
  // 2m30s elapsed, rate 20, nothing billed yet, plenty of balance.
  const r = computeBilling({
    startedAtMs: start,
    nowMs: start + 2 * MS_PER_MINUTE + 30_000,
    ratePerMin: 20,
    minutesAlreadyBilled: 0,
    amountAlreadyBilled: 0,
    availableBalance: 500,
  });
  assert.equal(r.targetMinutes, 3); // ceil(2.5) = 3 started minutes
  assert.equal(r.deltaMinutes, 3);
  assert.equal(r.deltaCharge, 60);
  assert.equal(r.newAmountBilled, 60);
  assert.equal(r.exhausted, false);
});

test("computeBilling is idempotent within the same minute", () => {
  const base = {
    startedAtMs: start,
    ratePerMin: 20,
    minutesAlreadyBilled: 3,
    amountAlreadyBilled: 60,
    availableBalance: 440,
  };
  // Same minute window -> no new charge.
  const r = computeBilling({ ...base, nowMs: start + 2 * MS_PER_MINUTE + 45_000 });
  assert.equal(r.deltaMinutes, 0);
  assert.equal(r.deltaCharge, 0);
  assert.equal(r.newAmountBilled, 60);
});

test("computeBilling flags exhaustion and never bills beyond the balance", () => {
  // Balance only covers 1 more minute (already billed 3 -> total spendable buys 4),
  // but 6 minutes have elapsed.
  const r = computeBilling({
    startedAtMs: start,
    nowMs: start + 6 * MS_PER_MINUTE,
    ratePerMin: 20,
    minutesAlreadyBilled: 3,
    amountAlreadyBilled: 60,
    availableBalance: 20, // total spendable = 80 -> 4 minutes max
  });
  assert.equal(r.targetMinutes, 4); // capped at affordable, not the 6 elapsed
  assert.equal(r.deltaMinutes, 1);
  assert.equal(r.deltaCharge, 20);
  assert.equal(r.newAmountBilled, 80);
  assert.equal(r.exhausted, true);
});

test("computeBilling never un-bills when balance reads stale-low", () => {
  const r = computeBilling({
    startedAtMs: start,
    nowMs: start + 3 * MS_PER_MINUTE,
    ratePerMin: 20,
    minutesAlreadyBilled: 3,
    amountAlreadyBilled: 60,
    availableBalance: 0,
  });
  assert.equal(r.targetMinutes, 3);
  assert.equal(r.deltaMinutes, 0);
  assert.equal(r.deltaCharge, 0);
});
