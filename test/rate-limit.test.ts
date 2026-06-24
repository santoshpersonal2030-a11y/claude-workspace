import { test } from "node:test";
import assert from "node:assert/strict";

import { rateLimit } from "../src/lib/rate-limit.ts";

test("fixed window: allows up to the limit, then blocks", () => {
  const key = "k1";
  const t0 = 1_000_000;
  for (let i = 0; i < 3; i++) {
    assert.equal(rateLimit(key, 3, 1000, t0 + i).ok, true, `hit ${i + 1}`);
  }
  const blocked = rateLimit(key, 3, 1000, t0 + 4);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.retryAfterSec >= 1);
});

test("window resets after it elapses", () => {
  const key = "k2";
  assert.equal(rateLimit(key, 1, 1000, 5000).ok, true);
  assert.equal(rateLimit(key, 1, 1000, 5500).ok, false); // same window
  assert.equal(rateLimit(key, 1, 1000, 6001).ok, true); // new window
});

test("separate keys have independent budgets", () => {
  assert.equal(rateLimit("a", 1, 1000, 9000).ok, true);
  assert.equal(rateLimit("b", 1, 1000, 9000).ok, true);
});
