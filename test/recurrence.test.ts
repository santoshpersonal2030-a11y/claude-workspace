import { test } from "node:test";
import assert from "node:assert/strict";

import { nextRunDate, cadenceLabel } from "../src/lib/recurrence.ts";

test("weekly: next matching weekday strictly after `from`", () => {
  // 2026-06-22 is a Monday (weekday 1).
  assert.equal(nextRunDate("weekly", 3, "2026-06-22"), "2026-06-24"); // Wed
  assert.equal(nextRunDate("weekly", 1, "2026-06-22"), "2026-06-29"); // same day → +7
  assert.equal(nextRunDate("weekly", 0, "2026-06-22"), "2026-06-28"); // Sun
});

test("monthly: next occurrence of the anchor day, rolling over", () => {
  assert.equal(nextRunDate("monthly", 25, "2026-06-22"), "2026-06-25"); // later this month
  assert.equal(nextRunDate("monthly", 5, "2026-06-22"), "2026-07-05"); // already past → next month
  assert.equal(nextRunDate("monthly", 22, "2026-06-22"), "2026-07-22"); // same day → next month
  assert.equal(nextRunDate("monthly", 10, "2026-12-22"), "2027-01-10"); // year rollover
});

test("cadenceLabel reads naturally", () => {
  assert.equal(cadenceLabel("weekly", 1), "Every Monday");
  assert.equal(cadenceLabel("monthly", 1), "Monthly on the 1st");
  assert.equal(cadenceLabel("monthly", 2), "Monthly on the 2nd");
  assert.equal(cadenceLabel("monthly", 5), "Monthly on the 5th");
  assert.equal(cadenceLabel("monthly", 11), "Monthly on the 11th");
});
