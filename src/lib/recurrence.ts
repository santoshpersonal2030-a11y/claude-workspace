// Pure recurrence helpers for recurring-pooja subscriptions. No I/O — unit-tested
// and reused by the scheduling cron and the account UI.

export type Cadence = "weekly" | "monthly";

/* ⚠️ ENGLISH ON PURPOSE, and the only English calendar left outside the allowlist that a
   reader can reach. cadenceLabel returns a SENTENCE — "Every Monday", "Monthly on the 5th" —
   not a date, and its ordinal rule (st/nd/rd/th) has no equivalent in Hindi or Telugu. Turning
   it into a translated string needs its own dictionary keys with a {weekday} and a {day}
   variable, on an account page that is wholly English anyway. That is a translation job, not a
   date-formatting one, and doing half of it would read worse than not doing it.
   The weekday PICKER that used to share this array now uses weekdayNames() and is translated. */
const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

// The next occurrence STRICTLY AFTER `from` (YYYY-MM-DD).
//   weekly  → anchorDay is a weekday 0 (Sun) … 6 (Sat)
//   monthly → anchorDay is a day-of-month 1 … 28 (kept ≤28 so it always exists)
export function nextRunDate(
  cadence: Cadence,
  anchorDay: number,
  from: string,
): string {
  const base = new Date(`${from}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return from;

  if (cadence === "weekly") {
    let delta = (anchorDay - base.getUTCDay() + 7) % 7;
    if (delta === 0) delta = 7; // strictly after `from`
    base.setUTCDate(base.getUTCDate() + delta);
    return base.toISOString().slice(0, 10);
  }

  // monthly
  let year = base.getUTCFullYear();
  let month = base.getUTCMonth();
  if (base.getUTCDate() >= anchorDay) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return new Date(Date.UTC(year, month, anchorDay)).toISOString().slice(0, 10);
}

// Human label for a cadence + anchor, e.g. "Every Monday" / "Monthly on the 5th".
export function cadenceLabel(cadence: Cadence, anchorDay: number): string {
  if (cadence === "weekly") return `Every ${WEEKDAYS[anchorDay] ?? "week"}`;
  return `Monthly on the ${ordinal(anchorDay)}`;
}

// Kept for cadenceLabel only. No view imports it any more.
const WEEKDAY_NAMES_UNUSED_BY_VIEWS = WEEKDAYS;
void WEEKDAY_NAMES_UNUSED_BY_VIEWS;
