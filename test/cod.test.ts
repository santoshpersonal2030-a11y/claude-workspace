import { test } from "node:test";
import assert from "node:assert/strict";

import {
  codEligibility,
  codAmountDue,
  isValidPincode,
  DEFAULT_COD_POLICY,
  type CodPolicy,
} from "../src/lib/cod.ts";

// A policy that actually allows something, for the positive cases. The shipped default is
// deliberately disabled with no serviceable pincodes.
const LIVE: CodPolicy = {
  minOrderValue: 199,
  maxOrderValue: 5000,
  fee: 49,
  servicePincodes: ["560001", "110001"],
  enabled: true,
};

test("the shipped default refuses COD everywhere", () => {
  // Failing closed is the point: there is no serviceability data in this project, so the safe
  // default is to offer cash on delivery nowhere until someone says where.
  assert.equal(DEFAULT_COD_POLICY.enabled, false);
  assert.deepEqual(DEFAULT_COD_POLICY.servicePincodes, []);
  const d = codEligibility(1000, "560001");
  assert.equal(d.allowed, false);
  assert.equal(d.allowed === false && d.reason, "disabled");
});

test("COD is allowed for a served pincode inside the value band", () => {
  const d = codEligibility(1000, "560001", LIVE);
  assert.equal(d.allowed, true);
  assert.equal(d.fee, 49);
});

test("an unserved pincode is refused even when everything else is fine", () => {
  const d = codEligibility(1000, "400001", LIVE);
  assert.equal(d.allowed, false);
  assert.equal(d.allowed === false && d.reason, "pincode_not_served");
});

test("the value band is inclusive at both ends", () => {
  // Boundaries, because an off-by-one here silently refuses or accepts real orders.
  assert.equal(codEligibility(199, "560001", LIVE).allowed, true);
  assert.equal(codEligibility(5000, "560001", LIVE).allowed, true);
  assert.equal(codEligibility(198, "560001", LIVE).allowed, false);
  assert.equal(codEligibility(5001, "560001", LIVE).allowed, false);
});

test("below and above the band give different reasons", () => {
  const low = codEligibility(50, "560001", LIVE);
  const high = codEligibility(99999, "560001", LIVE);
  assert.equal(low.allowed === false && low.reason, "below_minimum");
  assert.equal(high.allowed === false && high.reason, "above_maximum");
});

test("a refused decision never carries a fee", () => {
  for (const d of [
    codEligibility(50, "560001", LIVE),
    codEligibility(99999, "560001", LIVE),
    codEligibility(1000, "400001", LIVE),
    codEligibility(1000, "abc", LIVE),
    codEligibility(1000, "560001", { ...LIVE, enabled: false }),
  ]) {
    assert.equal(d.allowed, false);
    assert.equal(d.fee, 0, "a refusal must not charge a COD fee");
  }
});

test("pincode validation matches Indian pincodes only", () => {
  assert.equal(isValidPincode("560001"), true);
  assert.equal(isValidPincode(" 560001 "), true, "surrounding space is trimmed");
  assert.equal(isValidPincode("012345"), false, "cannot start with zero");
  assert.equal(isValidPincode("56001"), false, "five digits");
  assert.equal(isValidPincode("5600011"), false, "seven digits");
  assert.equal(isValidPincode("56000a"), false);
  assert.equal(isValidPincode(""), false);
});

test("a malformed pincode is refused as invalid, not as unserved", () => {
  const d = codEligibility(1000, "56", LIVE);
  assert.equal(d.allowed === false && d.reason, "invalid_pincode");
});

test("the amount due adds the COD fee and subtracts the discount", () => {
  assert.equal(
    codAmountDue({ subtotal: 1000, shipping: 49, discount: 100, codFee: 49 }),
    998,
  );
});

test("the amount due never goes negative", () => {
  // A 100%-off coupon must leave nothing to collect, not a refund owed to the courier.
  assert.equal(
    codAmountDue({ subtotal: 500, shipping: 0, discount: 900, codFee: 49 }),
    0,
  );
});

test("eligibility is judged on the goods total, before the COD fee is added", () => {
  // 4,980 + a 49 fee is over the 5,000 ceiling. If the fee were included in the number being
  // judged, this order would be refused for a limit the customer never chose to cross.
  assert.equal(codEligibility(4980, "560001", LIVE).allowed, true);
});
