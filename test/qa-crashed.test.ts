import { test } from "node:test";
import assert from "node:assert/strict";

import { crashed } from "../qa/crashed.js";

/* A crash and a failure look identical in a runner that only reads the exit code — and on
   13-Aug-2026 that cost an afternoon: tsc and eslint were reported as FAILED when they had
   simply run out of memory alongside another build. These tests hold the line in both
   directions, because softening a REAL failure to "inconclusive" would be the worse bug. */

const OOM_ZONE =
  "[10700:0001] 17369 ms: Scavenge (interleaved) 589.5 -> 532.4 MB\n" +
  "FATAL ERROR: Zone Allocation failed - process out of memory";
const OOM_HEAP =
  "<--- Last few GCs --->\n" +
  "FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory";

const REAL_TS_ERROR =
  "src/lib/foo.ts(12,3): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.";
const REAL_LINT_ERROR =
  "/src/a.tsx\n  3:1  error  Unexpected console statement  no-console\n✖ 1 problem (1 error, 0 warnings)";
const REAL_TEST_FAILURE =
  "✖ a blank rate is null (1.2ms)\n  AssertionError: Expected 0 to equal null\nfail 1";

test("an out-of-memory crash is a crash, not a failure", () => {
  assert.equal(crashed(OOM_ZONE, 134), true);
  assert.equal(crashed(OOM_HEAP, 134), true);
});

test("a process that never started is a crash", () => {
  assert.equal(crashed("", 1, new Error("spawn ENOENT")), true);
  assert.equal(crashed("", null, null, "SIGKILL"), true);
});

test("CONTROL — a genuine type error stays a FAILURE", () => {
  assert.equal(crashed(REAL_TS_ERROR, 2), false);
});

test("CONTROL — a genuine lint error stays a FAILURE", () => {
  assert.equal(crashed(REAL_LINT_ERROR, 1), false);
});

test("CONTROL — a genuine failing test stays a FAILURE", () => {
  assert.equal(crashed(REAL_TEST_FAILURE, 1), false);
});

test("CONTROL — a clean run is neither", () => {
  assert.equal(crashed("", 0), false);
  assert.equal(crashed(OOM_ZONE, 0), false); // exit 0 wins: it finished
});

test("the word 'error' alone must not be mistaken for a crash", () => {
  // Nearly every failing tool prints the word "error". If that were enough, every real
  // failure would be softened to "inconclusive" and the gate would stop meaning anything.
  assert.equal(crashed("error: something ordinary went wrong", 1), false);
  assert.equal(crashed("1 error occurred", 1), false);
});
