/* The store and the calendar, joined.
 *
 * These two halves of the site did not know each other existed. The samagri store has no idea
 * there is a festival calendar; the calendar has no idea there is a shop. That matters more here
 * than in ordinary retail, because samagri is bought FOR A CEREMONY ON A FIXED DATE — a kit that
 * arrives the day after the muhurat is not late, it is worthless.
 *
 * Relative imports with .ts, for the same reason as the other lib files: `npm test` runs these
 * through node directly.
 */
import { festivalPages, nextDate, type FestivalPage } from "./festival-pages.ts";

export type Occasion = {
  festival: FestivalPage;
  /** Observance date, YYYY-MM-DD IST. */
  date: string;
  /** Whole days from today. 0 = today. */
  daysAway: number;
  /** Last day to place an order and still receive it in time — null when no lead time is set. */
  orderBy: string | null;
  /** True when the order-by date has already passed, so ordering can no longer arrive in time. */
  tooLateToOrder: boolean;
};

const DAY_MS = 86_400_000;

const shiftDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/* Today's date in IST, as YYYY-MM-DD.
 *
 * Lives here rather than inline in each page because eslint's react-hooks/purity rule rejects a
 * Date.now() call in a component body — correctly, since it makes the render impure. Extracting
 * it is the pattern the festivals page already used. */
export function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((Date.parse(`${toISO}T00:00:00Z`) - Date.parse(`${fromISO}T00:00:00Z`)) / DAY_MS);
}

/* How many days before the ceremony an order must be placed.
 *
 * THERE IS NO DELIVERY-TIME DATA ANYWHERE IN THIS PROJECT. carriers.ts holds tracking URLs and
 * nothing else; there are no shipping zones, no transit estimates and no courier integration. So
 * this is NOT guessed — it is read from SAMAGRI_LEAD_DAYS, and when that is unset the site shows
 * the countdown to the festival and makes NO delivery promise at all.
 *
 * That is deliberate, and it is the same fail-closed rule as COD. Telling a family their samagri
 * will arrive before Diwali, on the strength of a number nobody measured, is the single most
 * damaging thing this feature could do: they would not buy elsewhere, and the ceremony would go
 * ahead without it. A missing promise is a gap; a wrong promise is a ruined ceremony.
 *
 * Set it once real dispatch and transit times are known — see .env.example.
 */
export function samagriLeadDays(): number | null {
  const raw = process.env.SAMAGRI_LEAD_DAYS;
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 60) return null;
  return Math.floor(n);
}

/** Builds an Occasion for a festival, given today and the configured lead time. */
export function occasionFor(
  festival: FestivalPage,
  todayISO: string,
  leadDays: number | null,
): Occasion | null {
  const date = nextDate(festival, todayISO);
  if (!date) return null;
  const orderBy = leadDays === null ? null : shiftDays(date, -leadDays);
  return {
    festival,
    date,
    daysAway: daysBetween(todayISO, date),
    orderBy,
    tooLateToOrder: orderBy !== null && orderBy < todayISO,
  };
}

/* Festivals falling within `withinDays` of today, soonest first.
 * This is what lets the store lead with the Ganesh kit two weeks before Ganesh Chaturthi instead
 * of waiting for someone to remember. */
export function upcomingOccasions(
  todayISO: string,
  withinDays = 45,
  leadDays: number | null = samagriLeadDays(),
  limit = 3,
): Occasion[] {
  const out: Occasion[] = [];
  for (const f of festivalPages()) {
    const o = occasionFor(f, todayISO, leadDays);
    if (o && o.daysAway >= 0 && o.daysAway <= withinDays) out.push(o);
  }
  out.sort((a, b) => a.daysAway - b.daysAway);
  return out.slice(0, limit);
}

/** The single nearest upcoming festival, for a one-line banner. */
export function nextOccasion(
  todayISO: string,
  withinDays = 45,
  leadDays: number | null = samagriLeadDays(),
): Occasion | null {
  return upcomingOccasions(todayISO, withinDays, leadDays, 1)[0] ?? null;
}

/* Every festival that a given pooja serves, so a pooja page can say "this is booked for Diwali,
 * which is on 8 November". One pooja can serve several — lakshmi-puja covers Diwali, Dhanteras
 * and Akshaya Tritiya — so this returns a list, nearest first. */
export function occasionsForPooja(
  poojaSlug: string,
  todayISO: string,
  leadDays: number | null = samagriLeadDays(),
): Occasion[] {
  const out: Occasion[] = [];
  for (const f of festivalPages()) {
    if (f.poojaSlug !== poojaSlug) continue;
    const o = occasionFor(f, todayISO, leadDays);
    if (o) out.push(o);
  }
  out.sort((a, b) => a.daysAway - b.daysAway);
  return out;
}
