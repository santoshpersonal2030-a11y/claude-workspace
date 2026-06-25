import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PanchangView from "@/components/PanchangView";
import { CITY_COORDS, fullPanchanga } from "@/lib/muhurat-engine";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_CITY = "New Delhi";
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Panchang for a fixed date is deterministic, so these pages are immutable.
function shift(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function pretty(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
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
  const desc = pan
    ? `Panchang for ${pretty(date)}: ${pan.tithi.name}, ${pan.nakshatra.name} nakshatra, ${pan.yoga.name} yoga. Abhijit Muhurat, Rahu Kalam & more for ${DEFAULT_CITY}.`
    : `Hindu panchang for ${pretty(date)}.`;
  return {
    title: `Panchang for ${pretty(date)} — Tithi, Nakshatra & Muhurat`,
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
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);

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
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <Link href="/panchang" className="hover:text-saffron-700">
                {t("nav.panchang")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{pretty(date)}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("pan.forDate", { date: pretty(date) })}
            </h1>
            <p className="mt-2 text-lg text-foreground/70">
              {pan.weekday} · {DEFAULT_CITY}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <Link
                href={`/panchang/${prev}`}
                className="rounded-full border border-saffron-200 bg-white px-4 py-1.5 font-semibold text-saffron-700 hover:bg-saffron-50"
              >
                ← {pretty(prev)}
              </Link>
              <Link
                href={`/panchang/${next}`}
                className="rounded-full border border-saffron-200 bg-white px-4 py-1.5 font-semibold text-saffron-700 hover:bg-saffron-50"
              >
                {pretty(next)} →
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

        <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <PanchangView pan={pan} city={DEFAULT_CITY} t={t} />
        </section>
      </main>
      <Footer />
    </>
  );
}
