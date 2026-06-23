import { test } from "node:test";
import assert from "node:assert/strict";

import { can, capabilitiesFor } from "../src/lib/roles.ts";

test("owner can do everything, including team and payouts", () => {
  assert.equal(can("owner", "team"), true);
  assert.equal(can("owner", "payouts"), true);
  assert.equal(can("owner", "settings"), true);
});

test("manager runs operations but not money-out / settings / team", () => {
  assert.equal(can("manager", "bookings"), true);
  assert.equal(can("manager", "payroll"), true);
  assert.equal(can("manager", "payouts"), false);
  assert.equal(can("manager", "settings"), false);
  assert.equal(can("manager", "team"), false);
});

test("support is limited to customer-facing reads", () => {
  assert.equal(can("support", "bookings"), true);
  assert.equal(can("support", "messages"), true);
  assert.equal(can("support", "products"), false);
  assert.equal(can("support", "payroll"), false);
  assert.equal(can("support", "rewards"), false);
});

test("a null role has no capabilities", () => {
  assert.equal(capabilitiesFor(null).size, 0);
  assert.equal(can(null, "analytics"), false);
});
