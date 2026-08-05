/* Relative imports, not the "@/" alias, and deliberately so: every unit-tested file in src/lib
   either imports relatively or imports types only (which type-stripping erases). `npm test` runs
   the files directly through node, which does not know the alias — so an alias import of a real
   VALUE here would make this file impossible to test. Checked against the existing convention
   rather than assumed. */
import {
  CITY_COORDS,
  computeDayPeriods,
  generateCeremonyCandidates,
  minutesToHHMM,
  muhuratQuality,
  panchangaAt,
  rulesFor,
  tierFromScore,
  weekdayOf,
  CEREMONY_RULES,
} from "./muhurat-engine.ts";
import { poojas } from "./poojas.ts";

/* Public-facing muhurat finder.
 *
 * The engine in muhurat-engine.ts has been able to do all of this since June. Until now the only
 * caller was the ADMIN screen, which generates candidate windows for a human to review and
 * publish; the public /muhurat page shows only what was published, and nothing has been. So a
 * visitor asking the single most common question in this business — "which dates are auspicious
 * for my wedding?" — got an empty page and a contact form.
 *
 * This composes the engine's parts into an answer that can be shown to a visitor directly.
 *
 * WHY NOT JUST REUSE THE CANDIDATE'S `note`:
 * the admin note ends with "Computed (strict rules) — verify before publishing." That is correct
 * for the person curating the list and wrong for the family reading it. Rather than string-trim
 * an internal message into a public one, this rebuilds the display from the structured parts.
 */

export type MuhuratCeremony = { slug: string; name: string; poojaName: string; emoji: string };

// The 14 ceremonies the engine has real rules for. Every key is also a pooja slug, so every
// result can link to something bookable — verified, not assumed.
export function muhuratCeremonies(): MuhuratCeremony[] {
  return Object.entries(CEREMONY_RULES).map(([slug, rules]) => {
    const pooja = poojas.find((p) => p.slug === slug);
    return {
      slug,
      name: rules.name,
      poojaName: pooja?.name ?? rules.name,
      emoji: pooja?.emoji ?? "🕉️",
    };
  });
}

export function muhuratCities(): string[] {
  return Object.keys(CITY_COORDS);
}

export type AuspiciousDate = {
  date: string;
  weekday: number;
  startTime: string;
  endTime: string;
  score: number;
  tier: "Excellent" | "Good" | "Fair";
  nakshatra: string;
  tithi: string;
  factors: string[];
  /** Inauspicious window on the same day, to be avoided. */
  avoidRahu: { from: string; to: string };
  /* True when the auspicious window itself overlaps Rahu Kalam.
   *
   * This is not hypothetical — the very first result the finder produced (vivah, New Delhi,
   * 15-Jan-2027) had an Abhijit window of 12:10–12:52 sitting inside a Rahu Kalam of 11:12–12:31.
   * Abhijit is traditionally held to override Rahu Kalam, so the date is not wrong, but showing a
   * recommended time and an "avoid" time that silently overlap looks like a bug to anyone who
   * knows the subject — and to anyone who does not, it looks like advice to do both. Flagged so
   * the page can say which it means instead of leaving the reader to notice. */
  rahuOverlapsWindow: boolean;
};

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const overlaps = (aFrom: number, aTo: number, bFrom: number, bTo: number): boolean =>
  aFrom < bTo && bFrom < aTo;

const MAX_MONTHS = 12;

function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/* Finds auspicious dates for a ceremony in a city.
 *
 * `today` is injected rather than read from the clock so this is testable and so a page can pin
 * it. `months` is clamped: the engine will happily walk 800 days of astronomy per request, and
 * this runs on every page view.
 */
export function findAuspiciousDates(opts: {
  ceremony: string;
  city: string;
  months: number;
  today: string;
  limit?: number;
}): AuspiciousDate[] {
  const coords = CITY_COORDS[opts.city];
  if (!coords) return [];

  const months = Math.min(Math.max(1, Math.floor(opts.months) || 1), MAX_MONTHS);
  const from = opts.today;
  const to = addMonths(from, months);
  const rules = rulesFor(opts.ceremony);

  const candidates = generateCeremonyCandidates(
    opts.ceremony,
    from,
    to,
    coords.lat,
    coords.lng,
    true, // strict: only dates that pass every rule, never a "close enough" suggestion
  );

  const out: AuspiciousDate[] = [];
  for (const c of candidates) {
    const periods = computeDayPeriods(c.date, coords.lat, coords.lng);
    if (!periods) continue;
    const quality = muhuratQuality(rules, c.date);
    const pan = panchangaAt(c.date);
    out.push({
      date: c.date,
      weekday: weekdayOf(c.date),
      startTime: c.start_time,
      endTime: c.end_time,
      score: quality.score,
      tier: tierFromScore(quality.score),
      nakshatra: pan?.nakshatraName ?? "",
      tithi: pan?.tithiName ?? "",
      factors: quality.factors,
      avoidRahu: {
        from: minutesToHHMM(periods.rahu.start),
        to: minutesToHHMM(periods.rahu.end),
      },
      rahuOverlapsWindow: overlaps(
        toMinutes(c.start_time),
        toMinutes(c.end_time),
        periods.rahu.start,
        periods.rahu.end,
      ),
    });
  }

  // Best first — a family wants the strongest dates, not the earliest ones. Ties break by date.
  out.sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));
  return opts.limit ? out.slice(0, opts.limit) : out;
}

export function isKnownCeremony(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(CEREMONY_RULES, slug);
}

export function isKnownCity(city: string): boolean {
  return Object.prototype.hasOwnProperty.call(CITY_COORDS, city);
}
