/* Per-festival page data.
 *
 * src/lib/festivals.ts holds 85 ROWS — but only 17 distinct festivals, each repeated for the five
 * years 2026–2030. (I described it as "85 festivals" in an earlier note; that was the row count,
 * not the festival count. 17 pages, not 85.)
 *
 * Every row's `slug` is a POOJA slug, not a festival slug — and several festivals share one
 * (Navratri and Dussehra both point at durga-puja; Diwali, Dhanteras and Akshaya Tritiya all
 * point at lakshmi-puja). So the page slug has to come from the festival NAME, or three festivals
 * would collapse onto one URL.
 *
 * Relative imports with the .ts extension, for the same reason as muhurat-finder.ts: `npm test`
 * runs these through node directly.
 */
import { FESTIVALS, FESTIVAL_INFO, type Festival } from "./festivals.ts";
import { poojas } from "./poojas.ts";

export type FestivalPage = {
  /** URL slug, derived from the English name. */
  slug: string;
  /** Canonical English name — the key into FESTIVAL_INFO and the translation tables. */
  name: string;
  emoji: string;
  /** English one-line description; callers localize it. */
  push: string;
  /** The bookable pooja for this festival. */
  poojaSlug: string;
  poojaName: string;
  poojaEmoji: string;
  /** Every observance date on record, ascending. */
  dates: string[];
};

export function festivalSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const POOJA_BY_SLUG = new Map(poojas.map((p) => [p.slug, p]));

/* One entry per distinct festival, with all its dates gathered.
 * Built fresh each call — the table is 85 rows, so there is nothing to gain from caching and a
 * shared mutable cache is a bug waiting to happen in a server component. */
export function festivalPages(): FestivalPage[] {
  const byName = new Map<string, Festival[]>();
  for (const f of FESTIVALS) {
    const list = byName.get(f.name);
    if (list) list.push(f);
    else byName.set(f.name, [f]);
  }

  const out: FestivalPage[] = [];
  for (const [name, rows] of byName) {
    const pooja = POOJA_BY_SLUG.get(rows[0].slug);
    out.push({
      slug: festivalSlug(name),
      name,
      emoji: FESTIVAL_INFO[name]?.emoji ?? "🎉",
      push: FESTIVAL_INFO[name]?.push ?? "",
      poojaSlug: rows[0].slug,
      poojaName: pooja?.name ?? rows[0].slug,
      poojaEmoji: pooja?.emoji ?? "🪔",
      dates: rows.map((r) => r.date).sort(),
    });
  }
  // Stable order: by the earliest date on record, so the list reads as a year.
  out.sort((a, b) => a.dates[0].localeCompare(b.dates[0]) || a.name.localeCompare(b.name));
  return out;
}

export function getFestivalPage(slug: string): FestivalPage | undefined {
  return festivalPages().find((f) => f.slug === slug);
}

/** The next observance on or after `todayISO`, or null once the table runs out. */
export function nextDate(page: FestivalPage, todayISO: string): string | null {
  return page.dates.find((d) => d >= todayISO) ?? null;
}

/** Dates still ahead, soonest first. Empty once the curated table is exhausted. */
export function futureDates(page: FestivalPage, todayISO: string): string[] {
  return page.dates.filter((d) => d >= todayISO);
}

const shiftDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/* Other festivals falling CLOSE TO this one — the Diwali page should offer Dhanteras and
 * Govardhan Puja, which are two days either side of it.
 *
 * The window is centred on this festival's next date, not on today. The first version anchored
 * the far end on the festival but the near end on today, so the Diwali page listed Krishna
 * Janmashtami and Ganesh Chaturthi — two months earlier — as "nearby". It was really answering
 * "what is coming up", which the /festivals list already does.
 *
 * Each other festival contributes the single date nearest this one, so a five-year table does not
 * produce five entries for the same festival.
 */
export function nearbyFestivals(
  page: FestivalPage,
  todayISO: string,
  days = 30,
  limit = 4,
): { page: FestivalPage; date: string }[] {
  const anchor = nextDate(page, todayISO);
  if (!anchor) return [];
  const from = shiftDays(anchor, -days);
  const to = shiftDays(anchor, days);

  const dist = (d: string) =>
    Math.abs(Date.parse(`${d}T00:00:00Z`) - Date.parse(`${anchor}T00:00:00Z`));

  const out: { page: FestivalPage; date: string }[] = [];
  for (const other of festivalPages()) {
    if (other.slug === page.slug) continue;
    const inWindow = other.dates.filter((d) => d >= from && d <= to);
    if (inWindow.length === 0) continue;
    const nearest = inWindow.reduce((a, b) => (dist(b) < dist(a) ? b : a));
    out.push({ page: other, date: nearest });
  }

  /* Pick the NEAREST `limit`, then order those by date for reading.
     Sorting by date before slicing dropped Govardhan Puja — the day after Diwali — while keeping
     Navratri a month before it, purely because Navratri sorts earlier. The cut has to be made on
     closeness; only the display order is chronological. */
  out.sort((a, b) => dist(a.date) - dist(b.date));
  const nearest = out.slice(0, limit);
  nearest.sort((a, b) => a.date.localeCompare(b.date));
  return nearest;
}
