import { test } from "node:test";
import assert from "node:assert/strict";

import { redeemableAmount, loyaltyEarned } from "../src/lib/rewards.ts";
import {
  generateReferralCode,
  normalizeReferralCode,
} from "../src/lib/referral-code.ts";

test("redeemableAmount respects balance, the % cap and the amount due", () => {
  // 50% cap on a 1000 order = 500, balance is plenty.
  assert.equal(redeemableAmount(900, 1000, 50), 500);
  // Balance is the binding constraint.
  assert.equal(redeemableAmount(120, 1000, 50), 120);
  // Amount due is the binding constraint (small order, big balance, 100% cap).
  assert.equal(redeemableAmount(900, 300, 100), 300);
  // Nothing redeemable on a zero/empty cart or empty wallet.
  assert.equal(redeemableAmount(0, 1000, 50), 0);
  assert.equal(redeemableAmount(900, 0, 50), 0);
  // A negative balance never yields a redemption.
  assert.equal(redeemableAmount(-50, 1000, 50), 0);
  // Cap is clamped to 0..100.
  assert.equal(redeemableAmount(900, 1000, 200), 900);
});

test("loyaltyEarned floors a percentage of net spend", () => {
  assert.equal(loyaltyEarned(1000, 2), 20);
  assert.equal(loyaltyEarned(999, 2), 19); // 19.98 floored
  assert.equal(loyaltyEarned(0, 2), 0);
  assert.equal(loyaltyEarned(1000, 0), 0);
});

test("referral codes are readable and stable in length", () => {
  let seed = 0.123;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const code = generateReferralCode(8, rnd);
  assert.equal(code.length, 8);
  assert.match(code, /^[A-HJ-NP-Z2-9]+$/); // no I, O, 0, 1
});

test("normalizeReferralCode strips noise and upper-cases", () => {
  assert.equal(normalizeReferralCode(" ab-cd 23 "), "ABCD23");
  assert.equal(normalizeReferralCode("io01"), ""); // all ambiguous chars dropped
});
