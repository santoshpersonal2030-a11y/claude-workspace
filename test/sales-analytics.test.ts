import { test } from "node:test";
import assert from "node:assert/strict";

import {
  monthlyRevenue,
  funnel,
  rate,
  averageValue,
  countByStatus,
} from "../src/lib/sales-analytics.ts";

test("monthlyRevenue merges store + booking by month, sorted", () => {
  const rows = monthlyRevenue(
    [
      { createdAt: "2026-01-10", amount: 100 },
      { createdAt: "2026-01-20", amount: 50 },
      { createdAt: "2026-03-01", amount: 200 },
    ],
    [{ createdAt: "2026-01-15", amount: 500 }],
  );
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    month: "2026-01",
    store: 150,
    booking: 500,
    total: 650,
  });
  assert.deepEqual(rows[1], {
    month: "2026-03",
    store: 200,
    booking: 0,
    total: 200,
  });
});

test("funnel percentages are relative to the top stage", () => {
  const f = funnel([
    { label: "Created", count: 200 },
    { label: "Paid", count: 150 },
    { label: "Completed", count: 50 },
  ]);
  assert.deepEqual(
    f.map((s) => s.pct),
    [100, 75, 25],
  );
});

test("funnel is safe when the top stage is zero", () => {
  const f = funnel([
    { label: "Created", count: 0 },
    { label: "Paid", count: 0 },
  ]);
  assert.deepEqual(
    f.map((s) => s.pct),
    [0, 0],
  );
});

test("rate and averageValue handle empty inputs", () => {
  assert.equal(rate(3, 0), null);
  assert.equal(rate(3, 12), 0.25);
  assert.equal(averageValue([]), 0);
  assert.equal(
    averageValue([
      { createdAt: "x", amount: 100 },
      { createdAt: "y", amount: 201 },
    ]),
    151, // 150.5 → 151
  );
});

test("countByStatus tallies statuses", () => {
  assert.deepEqual(
    countByStatus(["paid", "paid", "pending", "cancelled"]),
    { paid: 2, pending: 1, cancelled: 1 },
  );
});
