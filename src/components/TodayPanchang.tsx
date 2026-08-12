import Link from "next/link";

import { CITY_COORDS, fullPanchanga, computeChoghadiya } from "@/lib/muhurat-engine";
import { getDictionary, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { formatClock, formatDate, formatWeekday } from "@/lib/dates";


function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

// Minutes from IST midnight right now (for the running-choghadiya lookup).
function istNowMinutes(): number {
  const d = new Date(Date.now() + 5.5 * 3600 * 1000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

// Compact "today's panchang" strip for the homepage. Computed (New Delhi),
// always renders. Deep-links to the full per-date panchang page.
/* This strip is on the homepage — and until 12-Aug-2026 no audit had ever looked at the
   homepage, because both of them walked app/<locale>/ while Next writes the root to
   <locale>.html. So this component reached the dictionary for nothing at all and nobody saw it.
   Every label below already had a pv.* key; it simply never asked. */
export default function TodayPanchang({
  locale = DEFAULT_LOCALE,
}: {
  locale?: Locale;
}) {
  const { t } = getDictionary(locale);
  const today = todayIST();
  const coords = CITY_COORDS["New Delhi"];
  const pan = fullPanchanga(today, coords.lat, coords.lng);
  if (!pan) return null;

  // The choghadiya slot running right now (day or night), for the strip.
  const ch = computeChoghadiya(today, coords.lat, coords.lng);
  const nowMin = istNowMinutes();
  const current = ch
    ? [...ch.day, ...ch.night].find(
        (c) =>
          (nowMin >= c.start && nowMin < c.end) ||
          (nowMin + 1440 >= c.start && nowMin + 1440 < c.end),
      )
    : undefined;

  const facts = [
    { label: t("pv.limbTithi"), value: pan.tithi.name },
    { label: t("pv.limbNakshatra"), value: pan.nakshatra.name },
    {
      label: t("pv.abhijit"),
      value: `${formatClock(pan.abhijit.start, locale)}–${formatClock(pan.abhijit.end, locale)}`,
    },
    {
      label: t("pv.rahu"),
      value: `${formatClock(pan.rahu.start, locale)}–${formatClock(pan.rahu.end, locale)}`,
    },
    ...(current ? [{ label: t("pv.chogh"), value: current.name }] : []),
  ];

  return (
    <section className="border-y border-saffron-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗓️</span>
          <div>
            <div className="text-xs text-foreground/65">
              {t("tp.title")} · New Delhi
            </div>
            <div className="font-heading text-maroon-800">
              {formatWeekday(today, locale) ?? pan.weekday}, {formatDate(today, locale)}
            </div>
          </div>
        </div>
        <dl className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          {facts.map((f) => (
            <div key={f.label} className="flex items-baseline gap-1.5">
              <dt className="text-xs text-foreground/65">{f.label}</dt>
              <dd className="font-medium text-maroon-700">{f.value}</dd>
            </div>
          ))}
        </dl>
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/choghadiya"
            className="whitespace-nowrap text-sm font-semibold text-saffron-700 hover:text-saffron-800"
          >
            {t("tp.choghadiyaLink")}
          </Link>
          <Link
            href={`/panchang/${today}`}
            className="whitespace-nowrap text-sm font-semibold text-saffron-700 hover:text-saffron-800"
          >
            {t("cty.fullPanchang")}
          </Link>
        </div>
      </div>
    </section>
  );
}
