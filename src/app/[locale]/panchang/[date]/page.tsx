import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PanchangView from "@/components/PanchangView";
import { CITY_COORDS, fullPanchanga } from "@/lib/muhurat-engine";
import { getDictionary, isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { formatDate, formatWeekday } from "@/lib/dates";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_CITY = "New Delhi";

// Panchang for a fixed date is deterministic, so these pages are immutable.
function shift(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function pretty(date: string, locale: Locale): string {
  return formatDate(date, locale) ?? date;
}

// Prerender the next ~60 days; any other date renders on-demand and caches.
export function generateStaticParams() {
  const today = new Date(Date.now() + 5.5 * 3600 * 1000);
  const out: { date: string }[] = [];
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i);
    out.push({ date: d.toISOString().slice(0, 10) });
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  if (!DATE_RE.test(date)) return { title: "Panchang" };
  const coords = CITY_COORDS[DEFAULT_CITY];
  const pan = fullPanchanga(date, coords.lat, coords.lng);
  /* The metadata stays in DEFAULT_LOCALE on purpose. Its title and description are English
     sentences built around the date; localising only the date inside them would produce a
     half-Hindi title, which reads worse than a wholly English one. A translated per-date meta
     description needs its own dictionary keys and is not this change. */
  const desc = pan
    ? `Panchang for ${pretty(date, DEFAULT_LOCALE)}: ${pan.tithi.name}, ${pan.nakshatra.name} nakshatra, ${pan.yoga.name} yoga. Abhijit Muhurat, Rahu Kalam & more for ${DEFAULT_CITY}.`
    : `Hindu panchang for ${pretty(date, DEFAULT_LOCALE)}.`;
  return {
    title: `Panchang for ${pretty(date, DEFAULT_LOCALE)} — Tithi, Nakshatra & Muhurat`,
    description: desc,
  };
}

export default async function PanchangDatePage({
  params,
}: {
  params: Promise<{ locale: string; date: string }>;
}) {
  const { locale, date } = await params;
  if (!DATE_RE.test(date)) notFound();
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);

  const coords = CITY_COORDS[DEFAULT_CITY];
  const pan = fullPanchanga(date, coords.lat, coords.lng);
  if (!pan) notFound();

  const prev = shift(date, -1);
  const next = shift(date, 1);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <Link href="/panchang" className="hover:text-saffron-700">
                {t("nav.panchang")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{pretty(date, loc)}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("pan.forDate", { date: pretty(date, loc) })}
            </h1>
            <p className="mt-2 text-lg text-foreground/70">
              {formatWeekday(date, loc) ?? pan.weekday} · {DEFAULT_CITY}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <Link
                href={`/panchang/${prev}`}
                className="rounded-full border border-saffron-200 bg-white px-4 py-1.5 font-semibold text-saffron-700 hover:bg-saffron-50"
              >
                ← {pretty(prev, loc)}
              </Link>
              <Link
                href={`/panchang/${next}`}
                className="rounded-full border border-saffron-200 bg-white px-4 py-1.5 font-semibold text-saffron-700 hover:bg-saffron-50"
              >
                {pretty(next, loc)} →
              </Link>
              <Link
                href={`/panchang?date=${date}`}
                className="font-semibold text-saffron-700 hover:text-saffron-800"
              >
                {t("pan.changeCity")}
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <PanchangView
            pan={pan}
            city={DEFAULT_CITY}
            t={t}
            locale={loc}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
