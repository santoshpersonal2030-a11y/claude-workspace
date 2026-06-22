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
  retrogradePlanets,
  computeChoghadiya,
  generateChoghadiyaCandidates,
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

test("retrogradePlanets matches known 2025 stations", () => {
  // Mars (Dec 2024–Feb 2025) and Jupiter (Oct 2024–Feb 2025) retrograde.
  const jan = retrogradePlanets("2025-01-15");
  assert.ok(jan.includes("Mangal (Mars)"), `Jan: ${jan.join(", ")}`);
  assert.ok(jan.includes("Guru (Jupiter)"), `Jan: ${jan.join(", ")}`);

  // Mercury and Venus both retrograde late March 2025.
  const mar = retrogradePlanets("2025-03-25");
  assert.ok(mar.includes("Budha (Mercury)"), `Mar: ${mar.join(", ")}`);
  assert.ok(mar.includes("Shukra (Venus)"), `Mar: ${mar.join(", ")}`);

  // Saturn retrograde mid-September 2025.
  assert.ok(retrogradePlanets("2025-09-15").includes("Shani (Saturn)"));

  // Mid-June 2025: all five classical grahas direct.
  assert.deepEqual(retrogradePlanets("2025-06-15"), []);
});

test("retrogradePlanets returns names in graha order, never Sun/Moon", () => {
  const order = ["Budha (Mercury)", "Shukra (Venus)", "Mangal (Mars)", "Guru (Jupiter)", "Shani (Saturn)"];
  const r = retrogradePlanets("2025-03-25");
  const idx = r.map((n) => order.indexOf(n));
  assert.deepEqual(idx, [...idx].sort((a, b) => a - b));
  assert.ok(!r.some((n) => /Surya|Chandra|Sun|Moon/.test(n)));
});

test("choghadiya: eight day + eight night, contiguous, correct weekday start", () => {
  // 2025-01-15 is a Wednesday → day starts with Labh, night with Udveg.
  const ch = computeChoghadiya("2025-01-15", DELHI.lat, DELHI.lng)!;
  assert.equal(ch.day.length, 8);
  assert.equal(ch.night.length, 8);
  assert.equal(ch.day[0].name, "Labh");
  assert.equal(ch.day[0].quality, "good");
  assert.equal(ch.night[0].name, "Udveg");
  assert.equal(ch.night[0].quality, "bad");
  // Day's last slot ends exactly where night's first slot begins (sunset).
  assert.ok(Math.abs(ch.day[7].end - ch.night[0].start) < 1e-6);
  // Names cycle through the seven choghadiya in order.
  assert.deepEqual(
    ch.day.map((c) => c.name),
    ["Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh"],
  );
});

test("choghadiya quality classification is consistent", () => {
  const ch = computeChoghadiya("2025-06-15", DELHI.lat, DELHI.lng)!;
  for (const c of [...ch.day, ...ch.night]) {
    if (["Amrit", "Shubh", "Labh"].includes(c.name)) assert.equal(c.quality, "good");
    else if (c.name === "Char") assert.equal(c.quality, "neutral");
    else assert.equal(c.quality, "bad");
  }
});

test("generateChoghadiyaCandidates: good slots only, scored, optional Char", () => {
  const days = 7; // 2025-06-01 .. 2025-06-07 inclusive
  const good = generateChoghadiyaCandidates(
    "2025-06-01", "2025-06-07", DELHI.lat, DELHI.lng,
  );
  // 8 daytime slots cycle 7 names with one repeat, so 3–4 good slots per day.
  assert.ok(good.length >= 3 * days && good.length <= 4 * days, `count ${good.length}`);
  for (const c of good) {
    const name = c.label.replace(" Choghadiya", "");
    assert.ok(["Amrit", "Shubh", "Labh"].includes(name), `unexpected ${name}`);
    assert.equal(typeof c.quality_score, "number");
    assert.ok(c.start_time < c.end_time);
  }
  // Including Char yields strictly more candidates.
  const withChar = generateChoghadiyaCandidates(
    "2025-06-01", "2025-06-07", DELHI.lat, DELHI.lng, true,
  );
  assert.ok(withChar.length > good.length);
  assert.ok(withChar.some((c) => c.label === "Char Choghadiya"));
});

test("rulesFor: new ceremonies have bespoke rule-sets", () => {
  assert.equal(rulesFor("upanayana").name, "Upanayana");
  assert.equal(rulesFor("jatakarma").name, "Jatakarma");
  assert.equal(rulesFor("vastu-shanti").name, "Vastu Shanti");
  assert.equal(rulesFor("vidyarambha").name, "Vidyarambha");
  // Upanayana + Vastu are month-restricted (Kharmas/Chaturmas); child rites aren't.
  assert.equal(rulesFor("upanayana").chaturmas, true);
  assert.equal(rulesFor("upanayana").asta, true);
  assert.equal(rulesFor("vastu-shanti").kharmas, true);
  assert.equal(rulesFor("jatakarma").kharmas, false);
  assert.equal(rulesFor("nishkramana").chaturmas, false);
});

test("Upanayana strict candidates avoid Chaturmas; child rite (jatakarma) doesn't", () => {
  const args = ["2026-01-01", "2026-12-31", DELHI.lat, DELHI.lng, true] as const;
  const upanayana = generateCeremonyCandidates("upanayana", ...args);
  const jatakarma = generateCeremonyCandidates("jatakarma", ...args);
  // No Upanayana in the monsoon Chaturmas window (Aug–Oct).
  const monsoon = upanayana.filter((c) => {
    const m = Number(c.date.slice(5, 7));
    return m >= 8 && m <= 10;
  });
  assert.equal(monsoon.length, 0, "no Upanayana in Chaturmas");
  // The unrestricted child rite yields more dates overall.
  assert.ok(jatakarma.length > upanayana.length);
});
