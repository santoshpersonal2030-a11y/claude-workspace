import { test } from "node:test";
import assert from "node:assert/strict";

import {
  festivalPages,
  festivalSlug,
  futureDates,
  getFestivalPage,
  nearbyFestivals,
  nextDate,
} from "../src/lib/festival-pages.ts";
import { FESTIVALS } from "../src/lib/festivals.ts";
import { poojas } from "../src/lib/poojas.ts";
import { localizeFestivalName, translatedFestivalNames } from "../src/lib/festivals-i18n.ts";

const TODAY = "2026-08-05";

test("one page per distinct festival, not one per row", () => {
  const pages = festivalPages();
  const distinct = new Set(FESTIVALS.map((f) => f.name));
  assert.equal(pages.length, distinct.size);
  assert.equal(pages.length, 17, "expected 17 distinct festivals across the 5-year table");
});

test("slugs are URL-safe and unique", () => {
  const pages = festivalPages();
  const slugs = pages.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate festival slug");
  for (const s of slugs) assert.match(s, /^[a-z0-9-]+$/, `not URL-safe: ${s}`);
});

test("festivals sharing a pooja still get separate pages", () => {
  /* Navratri and Dussehra both point at durga-puja; Diwali, Dhanteras and Akshaya Tritiya all
     point at lakshmi-puja. Keying the page off the pooja slug would collapse them. */
  const pages = festivalPages();
  const byPooja = new Map<string, string[]>();
  for (const p of pages) {
    byPooja.set(p.poojaSlug, [...(byPooja.get(p.poojaSlug) ?? []), p.slug]);
  }
  const shared = [...byPooja.values()].filter((v) => v.length > 1);
  assert.ok(shared.length > 0, "no shared pooja in the data — this test proves nothing");
  for (const group of shared) {
    assert.equal(new Set(group).size, group.length, `collapsed onto one slug: ${group}`);
  }
});

test("every festival links to a real, bookable pooja", () => {
  const slugs = new Set(poojas.map((p) => p.slug));
  for (const p of festivalPages()) {
    assert.ok(slugs.has(p.poojaSlug), `${p.name} -> ${p.poojaSlug} is not a pooja`);
    assert.ok(p.poojaName.length > 0);
    assert.ok(p.emoji.length > 0, `${p.name} has no emoji`);
    assert.ok(p.dates.length > 0);
  }
});

test("dates are sorted and cover the whole table", () => {
  let total = 0;
  for (const p of festivalPages()) {
    total += p.dates.length;
    const sorted = [...p.dates].sort();
    assert.deepEqual(p.dates, sorted, `${p.name} dates out of order`);
  }
  assert.equal(total, FESTIVALS.length, "some rows were lost while grouping");
});

test("nextDate and futureDates respect the day given", () => {
  const diwali = getFestivalPage("diwali")!;
  assert.equal(nextDate(diwali, "2026-08-05"), "2026-11-08");
  // On the day itself the festival is still "next" — it has not passed.
  assert.equal(nextDate(diwali, "2026-11-08"), "2026-11-08");
  assert.equal(nextDate(diwali, "2026-11-09"), "2027-10-29");
  assert.equal(futureDates(diwali, "2026-08-05").length, 5);
  assert.equal(futureDates(diwali, "2029-01-01").length, 2);
});

test("runs out gracefully once the curated table is exhausted", () => {
  // festivals.ts stops at 2030 and warns when it needs extending; pages must not crash.
  const diwali = getFestivalPage("diwali")!;
  assert.equal(nextDate(diwali, "2031-01-01"), null);
  assert.deepEqual(futureDates(diwali, "2031-01-01"), []);
  assert.deepEqual(nearbyFestivals(diwali, "2031-01-01"), []);
});

test("nearby festivals are actually near — and centred on the festival, not on today", () => {
  /* The Diwali page must offer Dhanteras (2 days before) and Govardhan Puja (1 day after).
     An earlier version anchored one end of the window on today and listed Krishna Janmashtami,
     two months earlier, as "nearby". */
  const diwali = getFestivalPage("diwali")!;
  const near = nearbyFestivals(diwali, TODAY).map((n) => n.page.slug);
  assert.ok(near.includes("dhanteras"), `Dhanteras missing from Diwali's neighbours: ${near}`);
  assert.ok(
    near.includes("govardhan-puja"),
    `Govardhan Puja (the next day) missing from Diwali's neighbours: ${near}`,
  );
  assert.ok(!near.includes("diwali"), "a festival listed itself as its own neighbour");

  // Everything returned must be inside the window, and displayed in date order.
  const anchor = nextDate(diwali, TODAY)!;
  const rows = nearbyFestivals(diwali, TODAY);
  for (const r of rows) {
    const days = Math.abs(Date.parse(r.date) - Date.parse(anchor)) / 86_400_000;
    assert.ok(days <= 30, `${r.page.name} is ${days} days away, outside the window`);
  }
  for (let i = 1; i < rows.length; i++) {
    assert.ok(rows[i - 1].date <= rows[i].date, "neighbours not in date order");
  }
});

test("every festival in the table is translated into Hindi and Telugu", () => {
  /* Guards the case that actually happens: someone adds 2031 dates and a new festival, and the
     name silently renders in English on the Hindi and Telugu sites. */
  const names = new Set(FESTIVALS.map((f) => f.name));
  for (const locale of ["hi", "te"] as const) {
    const translated = new Set(translatedFestivalNames(locale));
    const missing = [...names].filter((n) => !translated.has(n));
    assert.equal(missing.length, 0, `${locale} is missing: ${missing.join(", ")}`);
  }
});

test("a translated name is really in the right script, and differs from English", () => {
  const DEVANAGARI = /[ऀ-ॿ]/;
  const TELUGU = /[ఀ-౿]/;
  for (const p of festivalPages()) {
    const hi = localizeFestivalName(p.name, "hi");
    const te = localizeFestivalName(p.name, "te");
    assert.notEqual(hi, p.name, `${p.name} not translated to Hindi`);
    assert.notEqual(te, p.name, `${p.name} not translated to Telugu`);
    assert.ok(DEVANAGARI.test(hi), `${p.name} Hindi is not in Devanagari: ${hi}`);
    assert.ok(TELUGU.test(te), `${p.name} Telugu is not in Telugu script: ${te}`);
    // And no cross-contamination — the mistake I actually made writing these.
    assert.ok(!TELUGU.test(hi), `Telugu letters inside the Hindi name: ${hi}`);
    assert.ok(!DEVANAGARI.test(te), `Devanagari letters inside the Telugu name: ${te}`);
  }
});

test("an unknown slug returns undefined rather than guessing", () => {
  assert.equal(getFestivalPage("not-a-festival"), undefined);
  assert.equal(getFestivalPage(""), undefined);
});

test("festivalSlug is stable and sane", () => {
  assert.equal(festivalSlug("Krishna Janmashtami"), "krishna-janmashtami");
  assert.equal(festivalSlug("Govardhan Puja"), "govardhan-puja");
  assert.equal(festivalSlug("  Odd   Name!!  "), "odd-name");
});
