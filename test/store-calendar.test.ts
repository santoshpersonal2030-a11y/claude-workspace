import { test } from "node:test";
import assert from "node:assert/strict";

import {
  daysBetween,
  nextOccasion,
  occasionFor,
  occasionsForPooja,
  samagriLeadDays,
  upcomingOccasions,
} from "../src/lib/store-calendar.ts";
import { getFestivalPage } from "../src/lib/festival-pages.ts";

const TODAY = "2026-08-05";
const DIWALI = "2026-11-08";

test("daysBetween counts whole days and handles month ends", () => {
  assert.equal(daysBetween("2026-08-05", "2026-08-05"), 0);
  assert.equal(daysBetween("2026-08-05", "2026-08-06"), 1);
  assert.equal(daysBetween("2026-10-31", "2026-11-01"), 1);
  assert.equal(daysBetween("2026-11-08", "2026-08-05"), -95);
});

test("NO delivery promise is made when the lead time is unconfigured", () => {
  /* The whole point of this design. There is no transit-time data in the project, so with
     SAMAGRI_LEAD_DAYS unset the site must show the countdown and promise nothing. A wrong
     delivery promise means a family does not buy elsewhere and the ceremony goes ahead without
     the samagri. */
  const diwali = getFestivalPage("diwali")!;
  const o = occasionFor(diwali, TODAY, null)!;
  assert.equal(o.orderBy, null, "an order-by date was invented with no lead time configured");
  assert.equal(o.tooLateToOrder, false, "cannot be 'too late' when nothing was promised");
  assert.equal(o.date, DIWALI);
  assert.equal(o.daysAway, 95);
});

test("samagriLeadDays refuses anything that is not a sane number", () => {
  const original = process.env.SAMAGRI_LEAD_DAYS;
  try {
    for (const bad of [undefined, "", "abc", "-1", "61", "NaN", "Infinity"]) {
      if (bad === undefined) delete process.env.SAMAGRI_LEAD_DAYS;
      else process.env.SAMAGRI_LEAD_DAYS = bad;
      assert.equal(samagriLeadDays(), null, `accepted a bad lead time: ${String(bad)}`);
    }
    process.env.SAMAGRI_LEAD_DAYS = "5";
    assert.equal(samagriLeadDays(), 5);
    process.env.SAMAGRI_LEAD_DAYS = "5.9";
    assert.equal(samagriLeadDays(), 5, "should floor, not round");
    process.env.SAMAGRI_LEAD_DAYS = "0";
    assert.equal(samagriLeadDays(), 0, "zero is a legitimate same-day setting");
  } finally {
    if (original === undefined) delete process.env.SAMAGRI_LEAD_DAYS;
    else process.env.SAMAGRI_LEAD_DAYS = original;
  }
});

test("with a lead time set, the order-by date is that many days before the festival", () => {
  const diwali = getFestivalPage("diwali")!;
  assert.equal(occasionFor(diwali, TODAY, 5)!.orderBy, "2026-11-03");
  assert.equal(occasionFor(diwali, TODAY, 0)!.orderBy, DIWALI);
  // Crossing a month boundary backwards.
  assert.equal(occasionFor(diwali, TODAY, 10)!.orderBy, "2026-10-29");
});

test("tooLateToOrder flips exactly on the order-by date, not a day early or late", () => {
  const diwali = getFestivalPage("diwali")!;
  // lead 5 => order by 2026-11-03
  assert.equal(occasionFor(diwali, "2026-11-02", 5)!.tooLateToOrder, false);
  assert.equal(occasionFor(diwali, "2026-11-03", 5)!.tooLateToOrder, false, "the order-by day itself is still in time");
  assert.equal(occasionFor(diwali, "2026-11-04", 5)!.tooLateToOrder, true);
});

test("a festival with no dates left returns null rather than a bogus occasion", () => {
  const diwali = getFestivalPage("diwali")!;
  assert.equal(occasionFor(diwali, "2031-01-01", 5), null);
  assert.deepEqual(upcomingOccasions("2031-01-01", 45, 5), []);
  assert.equal(nextOccasion("2031-01-01", 45, 5), null);
});

test("upcoming occasions are the near ones, soonest first, and never in the past", () => {
  // Late October 2026: Karwa Chauth 29 Oct, Dhanteras 6 Nov, Diwali 8 Nov, Govardhan 9 Nov.
  const rows = upcomingOccasions("2026-10-25", 20, null, 10);
  assert.ok(rows.length >= 3, `expected several festivals in the window, got ${rows.length}`);
  for (const r of rows) {
    assert.ok(r.daysAway >= 0, `${r.festival.name} is in the past`);
    assert.ok(r.daysAway <= 20, `${r.festival.name} is outside the 20-day window`);
  }
  for (let i = 1; i < rows.length; i++) {
    assert.ok(rows[i - 1].daysAway <= rows[i].daysAway, "not sorted soonest-first");
  }
  assert.equal(rows[0].festival.slug, "karwa-chauth");
});

test("the window really excludes — a short window returns fewer than a long one", () => {
  // A control: without this, a broken filter that returns everything would still pass the above.
  const near = upcomingOccasions(TODAY, 7, null, 50);
  const far = upcomingOccasions(TODAY, 120, null, 50);
  assert.ok(far.length > near.length, `window not applied: 7d=${near.length} 120d=${far.length}`);
});

test("nextOccasion is the soonest of the upcoming ones", () => {
  const next = nextOccasion("2026-10-25", 45, null)!;
  const all = upcomingOccasions("2026-10-25", 45, null, 10);
  assert.equal(next.festival.slug, all[0].festival.slug);
  assert.equal(next.festival.slug, "karwa-chauth");
});

test("a pooja that serves several festivals gets all of them, nearest first", () => {
  /* lakshmi-puja is Diwali, Dhanteras AND Akshaya Tritiya. A pooja page that showed only one
     would be wrong for most of the year. */
  const rows = occasionsForPooja("lakshmi-puja", TODAY, null);
  const slugs = rows.map((r) => r.festival.slug);
  assert.ok(slugs.includes("diwali"), `missing diwali: ${slugs}`);
  assert.ok(slugs.includes("dhanteras"), `missing dhanteras: ${slugs}`);
  assert.ok(slugs.includes("akshaya-tritiya"), `missing akshaya-tritiya: ${slugs}`);
  for (let i = 1; i < rows.length; i++) {
    assert.ok(rows[i - 1].daysAway <= rows[i].daysAway, "not nearest-first");
  }
});

test("a pooja that serves no festival returns nothing rather than guessing", () => {
  assert.deepEqual(occasionsForPooja("griha-pravesh", TODAY, null), []);
  assert.deepEqual(occasionsForPooja("not-a-pooja", TODAY, null), []);
});

test("every occasion carries a bookable pooja and a linkable festival slug", () => {
  for (const o of upcomingOccasions(TODAY, 365, 5, 50)) {
    assert.match(o.festival.slug, /^[a-z0-9-]+$/);
    assert.ok(o.festival.poojaSlug.length > 0);
    assert.match(o.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(o.orderBy && o.orderBy < o.date, "order-by must precede the festival");
  }
});
