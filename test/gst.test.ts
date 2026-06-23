import { test } from "node:test";
import assert from "node:assert/strict";

import {
  discountedInclusive,
  splitGst,
  apportionDiscount,
} from "../src/lib/gst.ts";

test("splitGst backs GST out of an inclusive price exactly", () => {
  const { taxable, tax } = splitGst(118, 18);
  assert.equal(taxable, 100);
  assert.equal(tax, 18);
  // taxable + tax always reconstructs the (rounded) inclusive value.
  for (const [inc, rate] of [
    [118, 18],
    [105, 5],
    [1299, 12],
    [4567, 18],
    [999, 0],
  ] as const) {
    const r = splitGst(inc, rate);
    assert.equal(r.taxable + r.tax, Math.round(inc));
    assert.ok(r.tax >= 0);
  }
});

test("no discount leaves line totals untouched", () => {
  assert.deepEqual(apportionDiscount([100, 200, 300], 0), [100, 200, 300]);
  assert.equal(discountedInclusive(200, 600, 0), 200);
});

test("apportionDiscount sums exactly to the discount (whole rupees)", () => {
  const lines = [100, 200, 333];
  const discounted = apportionDiscount(lines, 100);
  const totalDiscount =
    lines.reduce((s, x) => s + x, 0) -
    discounted.reduce((s, x) => s + x, 0);
  assert.equal(totalDiscount, 100);
  // Every discounted line is a whole rupee and not above the original.
  discounted.forEach((d, i) => {
    assert.ok(Number.isInteger(d));
    assert.ok(d <= lines[i] && d >= 0);
  });
});

test("apportionDiscount distributes proportionally to line value", () => {
  // 50 off a 100/300 split → roughly 12.5/37.5 → 13/37 after largest-remainder.
  const [a, b] = apportionDiscount([100, 300], 50);
  assert.equal(100 - a + (300 - b), 50);
  assert.equal(300 - b > 100 - a, true); // bigger line absorbs more discount
});

test("a coupon is capped at the goods value (never negative taxable)", () => {
  const discounted = apportionDiscount([100, 100], 500);
  assert.deepEqual(discounted, [0, 0]);
  assert.equal(discountedInclusive(100, 200, 500), 0);
});

test("discount reduces the taxable value, so tax is charged on net", () => {
  // 236 of goods @18% incl = 200 taxable + 36 tax. Apply a 36 discount.
  const discounted = apportionDiscount([236], 36); // → [200]
  const { taxable, tax } = splitGst(discounted[0], 18);
  assert.equal(taxable, 169); // 200 / 1.18
  assert.equal(tax, 31);
  // vs. the old (wrong) behaviour that taxed the full 236.
  assert.ok(taxable + tax < splitGst(236, 18).taxable + splitGst(236, 18).tax);
});
