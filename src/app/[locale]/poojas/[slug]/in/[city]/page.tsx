import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { CITY_COORDS, fullPanchanga } from "@/lib/muhurat-engine";
import { findAuspiciousDates, isKnownCeremony } from "@/lib/muhurat-finder";
import { getPoojas } from "@/lib/queries";
import { localizePooja } from "@/lib/poojas-i18n";
import { formatINR, popularPoojas, type Pooja } from "@/lib/poojas";
import { getDictionary, isLocale, DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";
import {
  formatClock,
  formatClockHHMM,
  formatDate,
  formatWeekday,
} from "@/lib/dates";
import { localeAlternates } from "@/lib/seo";

/* ── "Griha Pravesh pandit in Hyderabad" ──────────────────────────────────────
 * The crossing of /poojas/[slug] and /pandits/in/[city]. It is how people actually search, and
 * it did not exist.
 *
 * ⚠️ THE RISK WITH THIS PAGE TYPE IS THAT IT IS THIN. 14 cities × 50 poojas is 700 URLs, and 700
 * pages that differ only in a swapped city name are worth nothing and can be actively harmful.
 * docs/WHAT-ELSE-TO-BUILD.md says exactly that, so this page only exists because three things on
 * it genuinely differ by city, and they are computed, not templated:
 *
 *   1. The auspicious dates for THIS ceremony in THIS city. Sunrise differs, so the tithi at
 *      sunrise differs, so the dates differ — Varanasi and Ahmedabad really do disagree.
 *   2. Today's panchang for that city: sunrise, sunset, the Abhijit window.
 *   3. The priests who serve that city.
 *
 * And where a ceremony has no muhurat rules, the page SAYS SO rather than inventing dates. Of
 * the 50 poojas only 14 have rules in CEREMONY_RULES; the other 36 get the panchang and an
 * honest sentence. A wrong auspicious date is a ruined ceremony, not a bad search result.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookmypoojari.com";

export const revalidate = 86400;

const citySlug = (city: string) => city.toLowerCase().replace(/\s+/g, "-");
const CITY_BY_SLUG = new Map(
  Object.keys(CITY_COORDS).map((c) => [citySlug(c), c]),
);

function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

/* Prerender only the POPULAR poojas × every city — 4 × 14 = 56 routes, 168 pages across three
 * languages. The other 646 routes are real and reachable; they render on demand and then cache
 * for a day. Prerendering all 700 would add 2,100 pages to a build that already takes over ten
 * minutes on this machine, to bake pages nobody has asked for yet. */
export function generateStaticParams() {
  const cities = Object.keys(CITY_COORDS).map(citySlug);
  return popularPoojas.flatMap((p) =>
    cities.flatMap((city) =>
      LOCALES.map((locale) => ({ locale, slug: p.slug, city })),
    ),
  );
}

async function resolve(slug: string, city: string) {
  const name = CITY_BY_SLUG.get(city);
  if (!name) return null;
  const pooja = (await getPoojas()).find((p) => p.slug === slug);
  if (!pooja) return null;
  return { cityName: name, pooja };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; city: string }>;
}): Promise<Metadata> {
  const { locale, slug, city } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);
  const found = await resolve(slug, city);
  if (!found) return { title: t("cp.notFound") };
  const p = localizePooja(found.pooja, loc);
  return {
    title: t("cp.metaTitle", { pooja: p.name, city: found.cityName }),
    description: t("cp.metaDesc", {
      pooja: p.name,
      city: found.cityName,
      price: formatINR(p.startingPrice),
    }),
    alternates: localeAlternates(loc, `/poojas/${slug}/in/${city}`),
  };
}

export default async function PoojaInCityPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; city: string }>;
}) {
  const { locale, slug, city } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);

  const found = await resolve(slug, city);
  if (!found) notFound();
  const { cityName } = found;
  const pooja: Pooja = localizePooja(found.pooja, loc);

  const coords = CITY_COORDS[cityName];
  const today = todayIST();
  const pan = fullPanchanga(today, coords.lat, coords.lng);

  /* Only the 14 ceremonies the engine has real rules for get dates. The rest get the panchang
     and a sentence saying the timing is flexible — never an invented muhurat. */
  const hasRules = isKnownCeremony(slug);
  const dates = hasRules
    ? findAuspiciousDates({
        ceremony: slug,
        city: cityName,
        months: 6,
        today,
        limit: 5,
      })
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${pooja.name} — ${cityName}`,
    serviceType: pooja.name,
    areaServed: { "@type": "City", name: cityName },
    provider: { "@type": "Organization", name: "BookMyPoojari", url: SITE_URL },
    offers: {
      "@type": "Offer",
      price: pooja.startingPrice,
      priceCurrency: "INR",
    },
    url: `${SITE_URL}/poojas/${slug}/in/${city}`,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <Link href={`/poojas/${slug}`} className="hover:text-saffron-700">
                {pooja.name}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{cityName}</span>
            </nav>

            {/* min-w-0 + break-words: a Telugu pooja name has no space in it, so the word itself
                sets the minimum width and the page scrolls sideways on a phone without both. */}
            <h1 className="mt-3 min-w-0 break-words font-heading text-3xl text-maroon-800 sm:text-4xl">
              {t("cp.h1", { pooja: pooja.name, city: cityName })}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              {pooja.shortDescription}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={`/poojas/${slug}`}
                className="rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
              >
                {t("cp.bookIn", { city: cityName })}
              </Link>
              <Link
                href={`/pandits/in/${city}`}
                className="rounded-full border border-saffron-300 px-6 py-2.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
              >
                {t("cp.panditsIn", { city: cityName })}
              </Link>
              <span className="text-sm text-foreground/65">
                {t("browse.startsAt")}{" "}
                <span className="font-semibold text-foreground">
                  {formatINR(pooja.startingPrice)}
                </span>
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          {/* ── Auspicious dates, computed for THIS city ─────────────────── */}
          <h2 className="font-heading text-2xl text-maroon-800">
            {t("cp.datesH2", { pooja: pooja.name, city: cityName })}
          </h2>

          {hasRules && dates.length > 0 ? (
            <>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {dates.map((d) => (
                  <li
                    key={d.date}
                    className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
                  >
                    <div className="font-heading text-lg text-maroon-700">
                      {formatDate(d.date, loc)}
                    </div>
                    <div className="text-sm text-foreground/65">
                      {formatWeekday(d.date, loc)} ·{" "}
                      {formatClockHHMM(d.startTime, loc)} –{" "}
                      {formatClockHHMM(d.endTime, loc)}
                    </div>
                    {/* The list is sorted BEST FIRST by findAuspiciousDates, not by date —
                        deliberately, and /muhurat/find shows the same order. Without the tier
                        shown, reading the real page made that order look random: 11 Feb, then
                        8 Feb, then 20 Nov. The label is what makes the ordering legible. */}
                    <div className="mt-1 text-xs font-semibold text-saffron-700">
                      {d.tier === "Excellent"
                        ? t("mf.tierExcellent")
                        : d.tier === "Good"
                          ? t("mf.tierGood")
                          : t("mf.tierFair")}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-foreground/60">
                {t("mf.disclaimer")}
              </p>
              <Link
                href={`/muhurat/find?ceremony=${slug}&city=${encodeURIComponent(cityName)}&months=12`}
                className="mt-3 inline-block text-sm font-semibold text-saffron-700 hover:underline"
              >
                {t("cp.moreDates")}
              </Link>
            </>
          ) : (
            /* Fail closed. No rules, or none in the window — say so, do not fill the space. */
            <p className="mt-4 rounded-2xl border border-saffron-100 bg-white p-5 text-foreground/70 shadow-sm">
              {hasRules ? t("cp.noneInWindow") : t("cp.flexibleTiming")}
            </p>
          )}

          {/* ── Today's panchang, for THIS city ──────────────────────────── */}
          {pan && (
            <>
              <h2 className="mt-6 font-heading text-2xl text-maroon-800">
                {t("cp.panchangH2", { city: cityName })}
              </h2>
              <div className="mt-3 overflow-x-auto">
                <dl className="flex min-w-max flex-wrap items-baseline gap-x-6 gap-y-2 rounded-2xl border border-saffron-100 bg-white p-5 text-sm shadow-sm">
                  <div className="flex items-baseline gap-1.5">
                    <dt className="text-xs text-foreground/65">
                      {t("pv.limbVaara")}
                    </dt>
                    <dd className="font-medium text-maroon-700">
                      {formatWeekday(today, loc) ?? pan.weekday}
                    </dd>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <dt className="text-xs text-foreground/65">
                      {t("pv.limbTithi")}
                    </dt>
                    <dd className="font-medium text-maroon-700">
                      {pan.tithi.name}
                    </dd>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <dt className="text-xs text-foreground/65">
                      {t("pv.sunrise")}
                    </dt>
                    <dd className="font-medium text-maroon-700">
                      {formatClock(pan.sunrise, loc)}
                    </dd>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <dt className="text-xs text-foreground/65">
                      {t("pv.sunset")}
                    </dt>
                    <dd className="font-medium text-maroon-700">
                      {formatClock(pan.sunset, loc)}
                    </dd>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <dt className="text-xs text-foreground/65">
                      {t("pv.abhijit")}
                    </dt>
                    <dd className="font-medium text-maroon-700">
                      {formatClock(pan.abhijit.start, loc)}–
                      {formatClock(pan.abhijit.end, loc)}
                    </dd>
                  </div>
                </dl>
              </div>
              <Link
                href={`/panchang?city=${encodeURIComponent(cityName)}`}
                className="mt-3 inline-block text-sm font-semibold text-saffron-700 hover:underline"
              >
                {t("cty.fullPanchang")}
              </Link>
            </>
          )}

          {/* ── The same pooja in other cities ───────────────────────────── */}
          <h2 className="mt-6 font-heading text-2xl text-maroon-800">
            {t("cp.otherCitiesH2", { pooja: pooja.name })}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.keys(CITY_COORDS)
              .filter((c) => c !== cityName)
              .map((c) => (
                <Link
                  key={c}
                  href={`/poojas/${slug}/in/${citySlug(c)}`}
                  className="rounded-full bg-saffron-50 px-3 py-1.5 text-sm text-saffron-800 hover:bg-saffron-100"
                >
                  {c}
                </Link>
              ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
