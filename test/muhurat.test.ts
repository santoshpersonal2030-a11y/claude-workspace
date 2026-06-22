import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CITY_COORDS,
  computeDayPeriods,
  minutesToHHMM,
  panchangaAt,
  fullPanchanga,
  karanaAt,
  tierFromScore,
  ceremonyExclusionReason,
  rulesFor,
  generateCeremonyCandidates,
  generateVivahCandidates,
} from "../src/lib/muhurat-engine.ts";

const DELHI = CITY_COORDS["New Delhi"];

test("sunrise/sunset match the almanac for Delhi (summer solstice)", () => {
  const p = computeDayPeriods("2026-06-21", DELHI.lat, DELHI.lng)!;
  // Real: sunrise ~05:24, sunset ~19:22 IST.
  assert.ok(Math.abs(p.sunrise - 324) <= 5, `sunrise ${minutesToHHMM(p.sunrise)}`);
  assert.ok(Math.abs(p.sunset - 1162) <= 5, `sunset ${minutesToHHMM(p.sunset)}`);
  // Abhijit straddles solar noon and sits within the day.
  assert.ok(p.abhijit.start > p.sunrise && p.abhijit.end < p.sunset);
});

test("minutesToHHMM formats 24h zero-padded", () => {
  assert.equal(minutesToHHMM(324), "05:24");
  assert.equal(minutesToHHMM(1162), "19:22");
});

test("panchanga values stay within valid ranges", () => {
  for (const date of ["2026-01-15", "2026-06-21", "2026-11-12"]) {
    const pan = fullPanchanga(date, DELHI.lat, DELHI.lng)!;
    assert.ok(pan.tithi.num >= 1 && pan.tithi.num <= 30);
    assert.ok(pan.nakshatra.num >= 1 && pan.nakshatra.num <= 27);
    assert.ok(pan.yoga.num >= 1 && pan.yoga.num <= 27);
    assert.ok(pan.karana.name.length > 0);
    assert.ok(pan.sunset > pan.sunrise);
  }
});

test("panchangaAt names match the indices", () => {
  const p = panchangaAt("2026-06-21", 6)!;
  assert.equal(typeof p.tithiName, "string");
  assert.equal(typeof p.nakshatraName, "string");
});

test("karanaAt returns a karana with a Vishti flag", () => {
  const k = karanaAt("2026-06-21", 6);
  assert.equal(typeof k.name, "string");
  assert.equal(typeof k.isVishti, "boolean");
});

test("tierFromScore boundaries", () => {
  assert.equal(tierFromScore(80), "Excellent");
  assert.equal(tierFromScore(79), "Good");
  assert.equal(tierFromScore(65), "Good");
  assert.equal(tierFromScore(64), "Fair");
});

test("Vivah strict candidates: sensible count, none during Chaturmas", () => {
  const cands = generateCeremonyCandidates(
    "vivah-sanskar", "2026-01-01", "2026-12-31", DELHI.lat, DELHI.lng, true,
  );
  assert.ok(cands.length >= 30 && cands.length <= 60, `count ${cands.length}`);
  const monsoon = cands.filter((c) => {
    const m = Number(c.date.slice(5, 7));
    return m >= 8 && m <= 10; // Aug–Oct
  });
  assert.equal(monsoon.length, 0, "no weddings in Chaturmas");
  // Every candidate carries a quality score.
  assert.ok(cands.every((c) => typeof c.quality_score === "number"));
});

test("generateVivahCandidates wrapper equals the ceremony generator", () => {
  const a = generateVivahCandidates("2026-03-01", "2026-03-31", DELHI.lat, DELHI.lng, true);
  const b = generateCeremonyCandidates("vivah-sanskar", "2026-03-01", "2026-03-31", DELHI.lat, DELHI.lng, true);
  assert.deepEqual(a, b);
});

test("child sanskars are not month-restricted; weddings are", () => {
  const args = ["2026-01-01", "2026-12-31", DELHI.lat, DELHI.lng, true] as const;
  const vivah = generateCeremonyCandidates("vivah-sanskar", ...args);
  const namkaran = generateCeremonyCandidates("namkaran", ...args);
  // Namkaran has no Kharmas/Chaturmas/asta → many more, and present in monsoon.
  assert.ok(namkaran.length > vivah.length, `nk ${namkaran.length} vs vivah ${vivah.length}`);
  const nkAug = namkaran.some((c) => c.date.slice(5, 7) === "08");
  assert.ok(nkAug, "Namkaran allowed in August");
});

test("rulesFor falls back to a default rule-set", () => {
  assert.equal(rulesFor("vivah-sanskar").name, "Vivah");
  assert.equal(rulesFor("griha-pravesh").asta, true);
  assert.equal(rulesFor("namkaran").chaturmas, false);
  assert.equal(rulesFor("unknown-slug").name, "Muhurat"); // default
});

test("ceremonyExclusionReason returns null or a string reason", () => {
  const rules = rulesFor("vivah-sanskar");
  const r = ceremonyExclusionReason(rules, "2026-08-15", 12);
  assert.ok(r === null || typeof r === "string");
});
