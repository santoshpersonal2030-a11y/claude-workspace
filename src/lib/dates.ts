import type { Locale } from "./i18n.ts";

/* Locale-aware date and time formatting.
 *
 * 978 of the untranslated strings on this site are dates and times, and they all have one cause:
 * every call site hardcodes "en-IN", so a Hindi page shows "Wednesday, 5 August 2026" and a
 * Telugu page shows the same. One helper fixes almost all of it.
 *
 * ⚠️ WHAT THIS MUST NOT BE USED FOR — read before adding a call site.
 * Invoices, credit notes, payslips, booking receipts, GST returns, e-invoices and e-way bills.
 * Those are legal and financial documents. Their date format is not a presentation choice: it is
 * what a tax authority, an accountant and a customer's own records will be reconciled against,
 * and it must stay stable and identical for everyone regardless of the language the buyer happens
 * to be browsing in. Changing it retrospectively would make previously-issued documents disagree
 * with newly-issued ones.
 *
 * Those call sites deliberately keep their hardcoded "en-IN" and are listed in
 * qa/checks.js section 16, which fails if any of them starts using this module.
 *
 * The boundary is: is this text a person is READING, or is it a record?
 */

const INTL_LOCALE: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
};

export function intlLocale(locale: Locale): string {
  return INTL_LOCALE[locale] ?? "en-IN";
}

/* All formatters take the value first and the locale last, matching the existing helpers in this
   codebase, and every one tolerates null/undefined by returning null — the call sites are full of
   nullable timestamps and a crash in a date label is a worse outcome than a blank. */

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "5 August 2026" / "5 अगस्त 2026" / "5 ఆగస్టు 2026" */
export function formatDate(value: DateInput, locale: Locale): string | null {
  const d = toDate(value);
  if (!d) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** With the weekday: "Wednesday, 5 August 2026" and its translations. */
export function formatDateLong(value: DateInput, locale: Locale): string | null {
  const d = toDate(value);
  if (!d) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Short weekday plus the full date: "Wed, 12 August 2026".
 *
 * Byte-identical to the hand-rolled version it replaced on the festival calendar for English.
 * The reason it must go through Intl rather than concatenating a translated weekday onto a
 * translated date is Telugu: `12, ఆగస్టు 2026, బుధ` puts the weekday LAST. String-building
 * "{weekday}, {date}" would have produced fluent-looking nonsense in one of the three
 * languages, and nothing would have flagged it. */
export function formatDateWithWeekday(
  value: DateInput,
  locale: Locale,
): string | null {
  const d = toDate(value);
  if (!d) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Short weekday, day and short month, no year: "Wed, 12 Aug" — for compact teasers. */
export function formatDayMonthWeekday(
  value: DateInput,
  locale: Locale,
): string | null {
  const d = toDate(value);
  if (!d) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(d);
}

/** The seven weekday names, Sunday first — for a calendar grid header.
 *
 * Sunday-first because that is what every calendar in this app already assumes (`getUTCDay()`
 * returns 0 for Sunday and the grids are built from it). The dates below are an arbitrary real
 * week chosen so 2026-08-02 is a Sunday; only the weekday is read from them. */
export function weekdayNames(
  locale: Locale,
  style: "short" | "long" = "short",
): string[] {
  const fmt = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: style,
    timeZone: "UTC",
  });
  return Array.from({ length: 7 }, (_, i) =>
    fmt.format(new Date(Date.UTC(2026, 7, 2 + i))),
  );
}

/** The twelve month names, January first — for a month picker or a calendar header. */
export function monthNames(
  locale: Locale,
  style: "long" | "short" = "long",
): string[] {
  const fmt = new Intl.DateTimeFormat(intlLocale(locale), {
    month: style,
    timeZone: "UTC",
  });
  return Array.from({ length: 12 }, (_, i) =>
    fmt.format(new Date(Date.UTC(2026, i, 15))),
  );
}

/** "August 2026" — a month-and-year heading for grouped lists. */
export function formatMonthYear(value: DateInput, locale: Locale): string | null {
  const d = toDate(value);
  if (!d) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Compact, for lists and tables: "5 Aug 2026". */
export function formatDateShort(value: DateInput, locale: Locale): string | null {
  const d = toDate(value);
  if (!d) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Date and time together, for messages and activity feeds.
 *
 * `timeZone` is separate from `locale` on purpose. The priest calendar pins its timestamps to
 * Asia/Kolkata because a priest's schedule is in IST whatever language they read it in — and a
 * booking shown an hour out is a missed ceremony. Language and timezone are independent choices
 * and collapsing them would have quietly dropped that pin. */
export function formatDateTime(
  value: DateInput,
  locale: Locale,
  timeZone?: string,
): string | null {
  const d = toDate(value);
  if (!d) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  }).format(d);
}

/** Just the clock time. */
export function formatTime(value: DateInput, locale: Locale): string | null {
  const d = toDate(value);
  if (!d) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** Just the weekday: "Wednesday" / "बुधवार" / "బుధవారం".
 *
 * The muhurat engine returns `weekday` as an English STRING because it is a computation, not a
 * view — and the admin console and the GST exports read the same value. So the engine keeps
 * speaking English and the display sites call this instead. */
export function formatWeekday(value: DateInput, locale: Locale): string | null {
  const d = toDate(value);
  if (!d) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: "long" }).format(d);
}

/** Day and month with no year — "20 April" — for things like a zodiac date range.
 *
 * `month: "long"`, not "short". Hindi CLDR abbreviates SOME months and not others, so a short
 * range came out as "21 जून – 22 जुल॰" — one full name beside one abbreviation, which reads as
 * a typo. Reading the rendered page is the only way that shows up. */
export function formatDayMonth(value: DateInput, locale: Locale): string | null {
  const d = toDate(value);
  if (!d) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(d);
}

/* ── Clock times ────────────────────────────────────────────────────────────────
   Minutes-since-midnight → "1:47 PM". This is the panchang's format: sunrise, sunset, Rahu
   Kalam, Abhijit and all sixteen choghadiya slots.

   ⚠️ IT DELIBERATELY DOES NOT USE Intl, AND THE OUTPUT IS THE SAME IN ALL THREE LANGUAGES.
   I checked before changing it rather than assuming. Intl.DateTimeFormat gives:

       en-IN  "1:47 pm"      hi-IN  "1:47 pm"      te-IN  "1:47 PM"

   So Intl would lower-case the marker on the English site — a visible change for every visitor
   — and would still not translate anything for a Hindi reader, because Hindi CLDR uses "am/pm"
   too. A clock time reads the same in all three languages. The only thing Intl could change is
   the DIGITS (१:४७ via -u-nu-deva), and Devanagari numerals are not what Indian panchang sites
   use and are not mine to choose.

   This exists because the identical function was COPIED INTO FOUR FILES — PanchangView,
   TodayPanchang, choghadiya/page and pandits/in/[city]/page. Four copies of a formatter is how
   three of them end up agreeing and one drifts. `locale` is taken and ignored on purpose, so
   every call site already passes it if this ever does become locale-dependent. */
export function formatClock(
  minutesFromMidnight: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _locale: Locale,
): string {
  /* Both wrapped, not just the minutes. My first attempt guarded the minute and left the hour,
     so a negative input gave "-1:59 AM" — half a fix, which the test caught. Identical to the
     old copies for every value in 0…1440, which is the only range that ever occurs. */
  const t = Math.round(minutesFromMidnight);
  let h = ((Math.floor(t / 60) % 24) + 24) % 24;
  const m = ((t % 60) + 60) % 60;
  const ap = h < 12 ? "AM" : "PM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

/** The same clock, from a "HH:MM" 24-hour string — which is what the muhurat engine returns.
 *
 * Added 12-Aug-2026 because reading a real city × pooja page showed the muhurat window as
 * "12:07 – 12:54" directly above a panchang reading "5:58 AM". Two clock formats on one page
 * reads as a bug even though both were correct. Every visible clock on the site now goes
 * through formatClock. Returns the input unchanged if it is not HH:MM, rather than throwing in
 * the middle of a date label. */
export function formatClockHHMM(hhmm: string, locale: Locale): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return hhmm;
  return formatClock(Number(m[1]) * 60 + Number(m[2]), locale);
}

/** Numbers with Indian grouping — "1,20,000" — in the reader's numerals. */
export function formatNumber(value: number | null | undefined, locale: Locale): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}
