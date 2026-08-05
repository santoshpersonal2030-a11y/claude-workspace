import { test } from "node:test";
import assert from "node:assert/strict";

import {
  findAuspiciousDates,
  isKnownCeremony,
  isKnownCity,
  muhuratCeremonies,
  muhuratCities,
} from "../src/lib/muhurat-finder.ts";
import { poojas } from "../src/lib/poojas.ts";

// A fixed "today" so these never drift with the real clock.
const TODAY = "2026-08-05";

test("every ceremony the finder offers is a real, bookable pooja", () => {
  const slugs = new Set(poojas.map((p) => p.slug));
  const list = muhuratCeremonies();
  assert.equal(list.length, 14);
  for (const c of list) {
    assert.ok(slugs.has(c.slug), `${c.slug} is not a pooja slug — the result could not be booked`);
    assert.ok(c.poojaName.length > 0);
    assert.ok(c.emoji.length > 0);
  }
});

test("cities are the engine's cities", () => {
  const cities = muhuratCities();
  assert.equal(cities.length, 14);
  assert.ok(cities.includes("New Delhi"));
  assert.ok(cities.includes("Hyderabad"));
});

test("finds auspicious wedding dates, best first", () => {
  const r = findAuspiciousDates({
    ceremony: "vivah-sanskar",
    city: "New Delhi",
    months: 6,
    today: TODAY,
  });
  assert.ok(r.length > 0, "expected at least one vivah date in six months");
  for (let i = 1; i < r.length; i++) {
    assert.ok(
      r[i - 1].score >= r[i].score,
      `not sorted best-first at ${i}: ${r[i - 1].score} then ${r[i].score}`,
    );
  }
});

test("every returned date is complete enough to show a visitor", () => {
  const r = findAuspiciousDates({
    ceremony: "vivah-sanskar",
    city: "Mumbai",
    months: 6,
    today: TODAY,
  });
  for (const d of r) {
    assert.match(d.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(d.startTime, /^\d{2}:\d{2}$/);
    assert.match(d.endTime, /^\d{2}:\d{2}$/);
    assert.ok(d.score > 0 && d.score <= 100, `score out of range: ${d.score}`);
    assert.ok(["Excellent", "Good", "Fair"].includes(d.tier));
    assert.ok(d.nakshatra.length > 0, "nakshatra name missing");
    assert.ok(d.tithi.length > 0, "tithi name missing");
    assert.ok(d.factors.length > 0, "no reasons given for the score");
    assert.match(d.avoidRahu.from, /^\d{2}:\d{2}$/);
    assert.ok(d.date >= TODAY, "returned a date in the past");
    assert.equal(typeof d.rahuOverlapsWindow, "boolean");
  }
});

test("the tier always matches the score", () => {
  // Guards against the label and the number drifting apart in the display.
  const r = findAuspiciousDates({
    ceremony: "vivah-sanskar",
    city: "New Delhi",
    months: 12,
    today: TODAY,
  });
  for (const d of r) {
    const expected = d.score >= 80 ? "Excellent" : d.score >= 65 ? "Good" : "Fair";
    assert.equal(d.tier, expected, `${d.date}: score ${d.score} labelled ${d.tier}`);
  }
});

test("the Rahu-overlap flag is true exactly when the windows really overlap", () => {
  /* The first result this finder ever produced had its auspicious window sitting inside Rahu
     Kalam. The flag exists so the page can say so; this checks the flag against the times
     rather than trusting it. */
  const mins = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const r = findAuspiciousDates({
    ceremony: "vivah-sanskar",
    city: "New Delhi",
    months: 12,
    today: TODAY,
  });
  let seenTrue = false;
  let seenFalse = false;
  for (const d of r) {
    const real =
      mins(d.startTime) < mins(d.avoidRahu.to) && mins(d.avoidRahu.from) < mins(d.endTime);
    assert.equal(d.rahuOverlapsWindow, real, `${d.date}: flag disagrees with the times`);
    if (real) seenTrue = true;
    else seenFalse = true;
  }
  // A control: over a full year both outcomes must actually occur, or this test proves nothing.
  assert.ok(seenTrue, "no overlapping date in a year — the flag is never exercised");
  assert.ok(seenFalse, "every date overlaps — the flag is not discriminating");
});

test("an unknown city or ceremony fails safe rather than guessing", () => {
  assert.equal(
    findAuspiciousDates({ ceremony: "vivah-sanskar", city: "Atlantis", months: 6, today: TODAY })
      .length,
    0,
  );
  assert.equal(isKnownCity("Atlantis"), false);
  assert.equal(isKnownCity("New Delhi"), true);
  assert.equal(isKnownCeremony("not-a-ceremony"), false);
  assert.equal(isKnownCeremony("griha-pravesh"), true);
});

test("the look-ahead window is clamped so a URL cannot ask for 80 years of astronomy", () => {
  const twelve = findAuspiciousDates({
    ceremony: "vivah-sanskar",
    city: "New Delhi",
    months: 12,
    today: TODAY,
  });
  const absurd = findAuspiciousDates({
    ceremony: "vivah-sanskar",
    city: "New Delhi",
    months: 999,
    today: TODAY,
  });
  assert.equal(absurd.length, twelve.length, "months is not clamped — a URL could pin the CPU");
  // And a nonsense value must not produce an empty or infinite range.
  const nan = findAuspiciousDates({
    ceremony: "vivah-sanskar",
    city: "New Delhi",
    months: Number.NaN,
    today: TODAY,
  });
  assert.ok(Array.isArray(nan));
});

test("strict rules really are strict — Kharmas dates never appear for a wedding", () => {
  /* Mid-December to mid-January is Kharmas (Sun in Dhanu), when weddings are not performed.
     If the finder ever returns a date in that window for vivah, the rule set is not being
     applied — which is the single most visible way this feature could be wrong. */
  const r = findAuspiciousDates({
    ceremony: "vivah-sanskar",
    city: "New Delhi",
    months: 12,
    today: TODAY,
  });
  const kharmas = r.filter((d) => {
    const md = d.date.slice(5); // MM-DD
    return md >= "12-20" || md <= "01-10";
  });
  assert.equal(
    kharmas.length,
    0,
    `returned wedding dates inside Kharmas: ${kharmas.map((d) => d.date).join(", ")}`,
  );
});

test("different ceremonies genuinely give different answers", () => {
  // If the rule sets were not being used, every ceremony would return the same dates.
  const vivah = findAuspiciousDates({
    ceremony: "vivah-sanskar",
    city: "New Delhi",
    months: 12,
    today: TODAY,
  }).map((d) => d.date);
  const griha = findAuspiciousDates({
    ceremony: "griha-pravesh",
    city: "New Delhi",
    months: 12,
    today: TODAY,
  }).map((d) => d.date);
  assert.notDeepEqual(vivah, griha, "vivah and griha pravesh returned identical dates");
});
