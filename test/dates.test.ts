import { test } from "node:test";
import assert from "node:assert/strict";

import {
  formatDate,
  formatDateLong,
  formatDateShort,
  formatDateWithWeekday,
  formatDayMonthWeekday,
  formatMonthYear,
  weekdayNames,
  monthNames,
  formatDateTime,
  formatNumber,
  formatTime,
  formatClock,
  formatClockHHMM,
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

test("formatDayMonth uses FULL month names, so a range does not mix forms", () => {
  /* Hindi CLDR abbreviates some months and not others. With month:"short" the Gemini range
     rendered "21 जून – 22 जुल॰" — a full name beside an abbreviation, which reads as a typo.
     Only looking at the page shows that. */
  assert.equal(formatDayMonth("2026-07-22", "hi"), "22 जुलाई");
  assert.equal(formatDayMonth("2026-06-21", "hi"), "21 जून");
});

test("formatClockHHMM turns the engine's 24-hour string into the site's one clock format", () => {
  /* Reading a real page found the muhurat window rendering "12:07 – 12:54" directly above a
     panchang reading "5:58 AM". Both were right; together they read as a bug. */
  assert.equal(formatClockHHMM("12:07", "en"), "12:07 PM");
  assert.equal(formatClockHHMM("05:58", "en"), "5:58 AM");
  assert.equal(formatClockHHMM("00:30", "en"), "12:30 AM");
  assert.equal(formatClockHHMM("23:59", "en"), "11:59 PM");
});

test("formatClockHHMM returns junk unchanged rather than throwing inside a label", () => {
  assert.equal(formatClockHHMM("", "en"), "");
  assert.equal(formatClockHHMM("not a time", "en"), "not a time");
});

test("formatDateWithWeekday matches the festival calendar's old English output exactly", () => {
  /* It replaced a hand-rolled "Wed, 12 August 2026" on the festival list — 39 of the 42
     remaining translatable date strings on the whole site came from that one line. Byte-equal
     for English, so nothing moves for the visitors who already had it right. */
  assert.equal(formatDateWithWeekday("2026-08-12", "en"), "Wed, 12 August 2026");
  assert.equal(formatDateWithWeekday("2026-01-01", "en"), "Thu, 1 January 2026");
});

test("…and it is NOT built by concatenating a weekday onto a date", () => {
  /* The reason this goes through Intl. Telugu puts the weekday LAST:
       en  Wed, 12 August 2026
       te  12, ఆగస్టు 2026, బుధ
     Building "{weekday}, {date}" by hand would have produced fluent-looking nonsense in one of
     the three languages and nothing would have flagged it. */
  const te = formatDateWithWeekday("2026-08-12", "te");
  const hi = formatDateWithWeekday("2026-08-12", "hi");
  assert.ok(te && hi);
  assert.notEqual(te, formatDateWithWeekday("2026-08-12", "en"));
  assert.match(te, /^\d/, `Telugu should start with the day, not the weekday: ${te}`);
  assert.match(hi, /^[^\d]/, `Hindi should start with the weekday, not the day: ${hi}`);
});

test("weekdayNames starts at Sunday and really is translated", () => {
  /* Sunday-first because every calendar grid in this app is built from getUTCDay(), which
     returns 0 for Sunday. If the anchor date were wrong the whole grid would be off by a day —
     silently, and on the priest's schedule. */
  const en = weekdayNames("en");
  assert.equal(en.length, 7);
  assert.equal(en[0], "Sun");
  assert.equal(en[6], "Sat");
  assert.equal(weekdayNames("en", "long")[0], "Sunday");
  const hi = weekdayNames("hi");
  assert.notEqual(hi[0], en[0], "Hindi weekday names identical to English");
  assert.equal(new Set(hi).size, 7, "Hindi weekday names are not all distinct");
});

test("monthNames starts at January and really is translated", () => {
  const en = monthNames("en");
  assert.equal(en.length, 12);
  assert.equal(en[0], "January");
  assert.equal(en[11], "December");
  const te = monthNames("te");
  assert.notEqual(te[0], en[0], "Telugu month names identical to English");
  assert.equal(new Set(te).size, 12, "Telugu month names are not all distinct");
});

test("formatMonthYear translates the month", () => {
  assert.equal(formatMonthYear("2026-08-12", "en"), "August 2026");
  assert.notEqual(formatMonthYear("2026-08-12", "hi"), "August 2026");
});

test("formatDayMonthWeekday keeps the homepage teaser short and translated", () => {
  assert.equal(formatDayMonthWeekday("2026-08-12", "en"), "Wed, 12 Aug");
  assert.notEqual(formatDayMonthWeekday("2026-08-12", "hi"), "Wed, 12 Aug");
});
