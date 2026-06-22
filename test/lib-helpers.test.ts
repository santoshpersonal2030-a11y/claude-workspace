import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isValidPincode,
  resolveTravelBand,
  servesPincode,
  sharedPincodePrefix,
  nearbyProximity,
  servesNearby,
  TRAVEL_BANDS,
} from "../src/lib/travel.ts";
import {
  parseHHMM,
  toHHMM,
  travelMinutes,
  jobsCompatible,
  availableStartTimes,
  isBlackedOut,
  type DayJob,
} from "../src/lib/scheduling.ts";
import { panditTier, panditTierInfo } from "../src/lib/pandit-tier.ts";
import {
  normalisePhone,
  smsConfigured,
  sendTemplatedSms,
} from "../src/lib/sms.ts";

// ── travel.ts ───────────────────────────────────────────────────────────────

test("isValidPincode rejects leading zero / wrong length / non-digits", () => {
  assert.equal(isValidPincode("411004"), true);
  assert.equal(isValidPincode("011004"), false);
  assert.equal(isValidPincode("41100"), false);
  assert.equal(isValidPincode("4110045"), false);
  assert.equal(isValidPincode("abc123"), false);
});

const pandit = { homePincode: "411004", servicePincodes: ["411004", "411001"] };

test("resolveTravelBand: home=local(0), serviced=nearby(500), else null", () => {
  assert.equal(resolveTravelBand("411004", pandit)?.id, "local");
  assert.equal(resolveTravelBand("411004", pandit)?.fee, 0);
  assert.equal(resolveTravelBand("411001", pandit)?.id, "nearby");
  assert.equal(resolveTravelBand("411001", pandit)?.fee, TRAVEL_BANDS.nearby.fee);
  assert.equal(resolveTravelBand("411090", pandit), null);
  assert.equal(servesPincode("560001", pandit), false);
});

test("sharedPincodePrefix counts leading common digits", () => {
  assert.equal(sharedPincodePrefix("411090", "411004"), 4);
  assert.equal(sharedPincodePrefix("411004", "411004"), 6);
  assert.equal(sharedPincodePrefix("411004", "560001"), 0);
});

test("servesNearby: same region but not exact = true; far = false", () => {
  // 411090 isn't served exactly, but shares 4 digits with 411004/411001.
  assert.equal(resolveTravelBand("411090", pandit), null);
  assert.equal(nearbyProximity("411090", pandit), 4);
  assert.equal(servesNearby("411090", pandit), true);
  // Exact match is not "nearby".
  assert.equal(servesNearby("411004", pandit), false);
  // Different region.
  assert.equal(servesNearby("560001", pandit), false);
});

// ── scheduling.ts ────────────────────────────────────────────────────────────

test("parseHHMM / toHHMM round-trip", () => {
  assert.equal(parseHHMM("06:30"), 390);
  assert.equal(toHHMM(390), "06:30");
  assert.equal(toHHMM(1260), "21:00");
});

test("travelMinutes: same pincode quick hop, else max travel", () => {
  assert.equal(travelMinutes("411004", "411004", 30), 15);
  assert.equal(travelMinutes("411004", "411001", 30), 30);
  assert.equal(travelMinutes(null, "411004", 45), 45);
});

test("jobsCompatible enforces duration + travel + buffer gap", () => {
  const a: DayJob = { startMin: 600, durationMin: 120, pincode: "411004" }; // 10:00–12:00
  const tooClose: DayJob = { startMin: 720, durationMin: 60, pincode: "411004" }; // 12:00
  const okGap: DayJob = { startMin: 765, durationMin: 60, pincode: "411004" }; // 12:45 (gap 45 = 15+30)
  assert.equal(jobsCompatible(a, tooClose, 30), false);
  assert.equal(jobsCompatible(a, okGap, 30), true);
});

test("availableStartTimes walks the working window with safe gaps", () => {
  const base = {
    workStart: "06:00",
    workEnd: "21:00",
    durationMin: 120,
    pincode: "411004",
    maxTravelMins: 30,
    existing: [] as DayJob[],
    stepMin: 60,
  };
  const free = availableStartTimes(base);
  assert.equal(free.length, 14); // 06:00 … 19:00
  assert.ok(free.includes("06:00") && free.includes("19:00"));
  assert.ok(!free.includes("20:00")); // 20:00 + 2h > 21:00

  // With a 10:00–12:00 job, overlapping/too-close starts drop out.
  const withJob = availableStartTimes({
    ...base,
    existing: [{ startMin: 600, durationMin: 120, pincode: "411004" }],
  });
  assert.ok(withJob.includes("06:00")); // ends 08:00, 120m before the job
  assert.ok(!withJob.includes("10:00")); // overlaps
  assert.ok(!withJob.includes("12:00")); // zero gap after the job
  assert.ok(withJob.includes("13:00")); // 60m gap ≥ 45
});

test("isBlackedOut checks the date list", () => {
  assert.equal(isBlackedOut("2026-11-01", ["2026-11-01"]), true);
  assert.equal(isBlackedOut("2026-11-02", ["2026-11-01"]), false);
});

// ── pandit-tier.ts ───────────────────────────────────────────────────────────

test("panditTier bands: Pandit 0–4 · Acharya 5–15 · Vidwan 16+", () => {
  assert.equal(panditTier(0), "Pandit");
  assert.equal(panditTier(4), "Pandit");
  assert.equal(panditTier(5), "Acharya");
  assert.equal(panditTier(15), "Acharya");
  assert.equal(panditTier(16), "Vidwan");
  assert.equal(panditTier(30), "Vidwan");
});

test("panditTierInfo handles invalid years (entry tier)", () => {
  assert.equal(panditTierInfo(-3).tier, "Pandit");
  assert.equal(panditTierInfo(Number.NaN).tier, "Pandit");
  assert.equal(panditTierInfo(22).tier, "Vidwan");
});

// ── sms.ts ──────────────────────────────────────────────────────────────────

test("normalisePhone strips +91/0/spaces to a 10-digit mobile", () => {
  assert.equal(normalisePhone("+91 98765 43210"), "9876543210");
  assert.equal(normalisePhone("09876543210"), "9876543210");
  assert.equal(normalisePhone("98765-43210"), "9876543210");
  assert.equal(normalisePhone("919876543210"), "9876543210");
});

test("normalisePhone rejects invalid Indian mobiles", () => {
  assert.equal(normalisePhone("12345"), null); // too short
  assert.equal(normalisePhone("5000000000"), null); // must start 6-9
  assert.equal(normalisePhone("abcd"), null);
});

test("sms is a no-op without provider config (dormant until keyed)", async () => {
  // The test env has no TWO_FACTOR_API_KEY/SMS_SENDER_ID set.
  assert.equal(smsConfigured(), false);
  const sent = await sendTemplatedSms({
    to: "9876543210",
    kind: "priest_assignment",
    vars: ["Ganesh Puja", "2026-07-01"],
  });
  assert.equal(sent, false);
});
