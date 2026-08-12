import { test } from "node:test";
import assert from "node:assert/strict";

import {
  formatDate,
  formatDateLong,
  formatDateShort,
  formatDateTime,
  formatNumber,
  formatTime,
  formatClock,
  formatWeekday,
  formatDayMonth,
  intlLocale,
} from "../src/lib/dates.ts";

const DAY = "2026-08-05T09:30:00+05:30";

test("each locale maps to its Intl locale", () => {
  assert.equal(intlLocale("en"), "en-IN");
  assert.equal(intlLocale("hi"), "hi-IN");
  assert.equal(intlLocale("te"), "te-IN");
});

test("a date really is formatted differently in each language", () => {
  /* The whole point. Every call site hardcoded "en-IN", so a Hindi page showed English dates.
     A control matters here: if Intl had no Hindi or Telugu data the three would come out
     identical and this would silently prove nothing. */
  const en = formatDateLong(DAY, "en");
  const hi = formatDateLong(DAY, "hi");
  const te = formatDateLong(DAY, "te");
  assert.ok(en && hi && te);
  assert.notEqual(hi, en, "Hindi date is identical to English — Intl has no hi-IN data here");
  assert.notEqual(te, en, "Telugu date is identical to English");
  assert.notEqual(hi, te, "Hindi and Telugu dates are identical");
  assert.match(hi, /[ऀ-ॿ]/, `Hindi date is not in Devanagari: ${hi}`);
  assert.match(te, /[ఀ-౿]/, `Telugu date is not in Telugu script: ${te}`);
});

test("every formatter is locale-aware, not just one of them", () => {
  for (const [name, fn] of [
    ["formatDate", formatDate],
    ["formatDateLong", formatDateLong],
    ["formatDateShort", formatDateShort],
    ["formatDateTime", formatDateTime],
  ] as const) {
    assert.notEqual(fn(DAY, "hi"), fn(DAY, "en"), `${name} ignores the locale`);
  }
});

test("null, undefined and rubbish give null rather than 'Invalid Date'", () => {
  for (const bad of [null, undefined, "", "not-a-date", Number.NaN]) {
    assert.equal(formatDate(bad as never, "en"), null, `formatDate accepted ${String(bad)}`);
    assert.equal(formatDateLong(bad as never, "en"), null);
    assert.equal(formatDateShort(bad as never, "en"), null);
    assert.equal(formatDateTime(bad as never, "en"), null);
    assert.equal(formatTime(bad as never, "en"), null);
  }
  assert.equal(formatNumber(null, "en"), null);
  assert.equal(formatNumber(undefined, "en"), null);
  assert.equal(formatNumber(Number.NaN, "en"), null);
});

test("accepts a Date, a timestamp and an ISO string alike", () => {
  const d = new Date(DAY);
  const a = formatDate(d, "en");
  const b = formatDate(d.getTime(), "en");
  const c = formatDate(DAY, "en");
  assert.equal(a, b);
  assert.equal(b, c);
  assert.ok(a && a.includes("2026"));
});

test("numbers use Indian grouping", () => {
  // 12,00,000 — not 1,200,000.
  const s = formatNumber(1200000, "en");
  assert.equal(s, "12,00,000");
});

test("an unknown locale falls back to en-IN rather than throwing", () => {
  // Guards the case where a fourth language is added to LOCALES but not to this map.
  assert.equal(intlLocale("xx" as never), "en-IN");
  assert.ok(formatDate(DAY, "xx" as never));
});

/* ── formatClock — the four copies that became one ────────────────────────────
   PanchangView, TodayPanchang, choghadiya/page and pandits/in/[city]/page each carried a
   byte-identical `to12h`. Consolidating them is only safe if the output is unchanged, so this
   asserts it against a verbatim copy of the old implementation for every minute of the day
   rather than spot-checking three values. */
function oldTo12h(mins: number): string {
  const t = Math.round(mins);
  let h = Math.floor(t / 60) % 24;
  const m = t % 60;
  const ap = h < 12 ? "AM" : "PM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

test("formatClock is byte-identical to the four copies it replaced, all day", () => {
  for (let m = 0; m <= 1440; m++) {
    assert.equal(formatClock(m, "en"), oldTo12h(m), `minute ${m}`);
  }
});

test("formatClock reads the same in all three languages — and that is correct", () => {
  /* Not an oversight. Intl gives "1:47 pm" for BOTH en-IN and hi-IN, so using it would
     lower-case the marker for every English visitor and translate nothing for a Hindi one.
     A clock time is the same in all three languages. This test exists so that anyone who
     "fixes" it later has to read the reason first. */
  assert.equal(formatClock(825, "en"), "1:45 PM");
  assert.equal(formatClock(825, "hi"), "1:45 PM");
  assert.equal(formatClock(825, "te"), "1:45 PM");
});

test("formatClock no longer prints a negative minute", () => {
  // The old copies took `t % 60` with no guard. I asserted this produced "11:-1 PM"; the test
  // corrected me — it produces "-1:-1 AM", because the hour goes negative as well.
  assert.equal(oldTo12h(-1), "-1:-1 AM");
  assert.equal(formatClock(-1, "en"), "11:59 PM");
});

test("the weekday really is translated", () => {
  const en = formatWeekday(DAY, "en");
  const hi = formatWeekday(DAY, "hi");
  const te = formatWeekday(DAY, "te");
  assert.equal(en, "Wednesday");
  assert.notEqual(hi, en, "Hindi weekday identical to English — no hi-IN data");
  assert.notEqual(te, en, "Telugu weekday identical to English — no te-IN data");
  assert.notEqual(hi, te);
});

test("formatDayMonth drops the year and still translates the month", () => {
  const en = formatDayMonth("2026-04-20", "en");
  const hi = formatDayMonth("2026-04-20", "hi");
  assert.ok(en && !en.includes("2026"));
  assert.notEqual(hi, en);
});
