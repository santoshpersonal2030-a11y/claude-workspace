import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FESTIVALS,
  FESTIVAL_INFO,
  upcomingFestivals,
  festivalsOn,
  FESTIVALS_THROUGH,
} from "../src/lib/festivals.ts";
import { poojas } from "../src/lib/poojas.ts";

const slugs = new Set(poojas.map((p) => p.slug));

test("festivals: every row is well-formed and references a real pooja", () => {
  assert.ok(FESTIVALS.length > 0);
  for (const f of FESTIVALS) {
    assert.match(f.date, /^\d{4}-\d{2}-\d{2}$/, `bad date ${f.date}`);
    assert.ok(!Number.isNaN(Date.parse(f.date)), `unparseable ${f.date}`);
    assert.ok(slugs.has(f.slug), `${f.name}: missing pooja "${f.slug}"`);
    assert.ok(FESTIVAL_INFO[f.name], `${f.name}: missing FESTIVAL_INFO copy`);
    assert.ok(f.name.length > 0);
  }
});

test("festivals: every info entry has an emoji and a push line", () => {
  for (const [name, info] of Object.entries(FESTIVAL_INFO)) {
    assert.ok(info.emoji.length > 0, `${name}: empty emoji`);
    assert.ok(info.push.length > 0, `${name}: empty push`);
  }
});

test("festivals: rows are sorted ascending by date", () => {
  for (let i = 1; i < FESTIVALS.length; i++) {
    assert.ok(
      FESTIVALS[i - 1].date <= FESTIVALS[i].date,
      `out of order at ${FESTIVALS[i].date}`,
    );
  }
  assert.equal(FESTIVALS_THROUGH, FESTIVALS[FESTIVALS.length - 1].date);
});

test("festivals: the marquee festivals are all present", () => {
  const names = new Set(FESTIVALS.map((f) => f.name));
  for (const n of ["Mahashivratri", "Ram Navami", "Navratri", "Diwali", "Ganesh Chaturthi", "Krishna Janmashtami"]) {
    assert.ok(names.has(n), `missing ${n}`);
  }
  // Navratri must appear every covered year (the engine used to drop it).
  const years = [...new Set(FESTIVALS.map((f) => f.date.slice(0, 4)))];
  for (const y of years) {
    assert.ok(
      FESTIVALS.some((f) => f.name === "Navratri" && f.date.startsWith(y)),
      `Navratri missing in ${y}`,
    );
  }
});

test("upcomingFestivals: window is half-open [from, from+days) and ordered", () => {
  const first = FESTIVALS[0].date;
  const got = upcomingFestivals(first, 1);
  assert.ok(got.length >= 1);
  assert.equal(got[0].date, first);
  // A 366-day window from Jan 1 of the first year holds that whole year.
  const y = first.slice(0, 4);
  const yearCount = FESTIVALS.filter((f) => f.date.startsWith(y)).length;
  assert.equal(upcomingFestivals(`${y}-01-01`, 366).length, yearCount);
  // Bad input is tolerated.
  assert.deepEqual(upcomingFestivals("not-a-date", 30), []);
});

test("festivalsOn: matches an exact date", () => {
  const f = FESTIVALS[0];
  assert.ok(festivalsOn(f.date).some((x) => x.name === f.name));
  assert.deepEqual(festivalsOn("1999-01-01"), []);
});
