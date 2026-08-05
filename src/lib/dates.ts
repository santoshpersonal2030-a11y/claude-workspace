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

/** Date and time together, for messages and activity feeds. */
export function formatDateTime(value: DateInput, locale: Locale): string | null {
  const d = toDate(value);
  if (!d) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

/** Numbers with Indian grouping — "1,20,000" — in the reader's numerals. */
export function formatNumber(value: number | null | undefined, locale: Locale): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}
