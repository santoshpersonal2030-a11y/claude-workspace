import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import {
  festivalPages,
  futureDates,
  getFestivalPage,
  nearbyFestivals,
  nextDate,
} from "@/lib/festival-pages";
import { localizeFestivalName, localizeFestivalPush } from "@/lib/festivals-i18n";
import { occasionFor, samagriLeadDays } from "@/lib/store-calendar";
import { formatDate, formatDateLong } from "@/lib/dates";
import { getPoojaBySlug } from "@/lib/poojas";
import { getDictionary, isLocale, DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n";
import { localizePooja } from "@/lib/poojas-i18n";

/* One page per festival — 17 of them, each with five years of dates.
 *
 * "When is Diwali 2027" is searched by name, every year, by a very large number of people. The
 * site had a single 120-day rolling list and nothing addressable per festival, so none of that
 * traffic had anywhere to land.
 *
 * Prerendered for all 17 × 3 locales, revalidated daily so "next date" and "in N days" stay
 * honest. No database.
 */

export const revalidate = 86400;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookmypoojari.com";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    festivalPages().map((f) => ({ locale, slug: f.slug })),
  );
}

function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

function daysBetween(fromISO: string, toISO: string): number {
  return Math.round(
    (Date.parse(`${toISO}T00:00:00Z`) - Date.parse(`${fromISO}T00:00:00Z`)) / 86_400_000,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);
  const festival = getFestivalPage(slug);
  if (!festival) return {};

  const name = localizeFestivalName(festival.name, loc);
  const next = nextDate(festival, todayIST());
  const year = next ? next.slice(0, 4) : "";

  return {
    title: `${name}${year ? ` ${year}` : ""}`,
    description: localizeFestivalPush(festival.name, festival.push, loc) || t("fp.whenIs", { name }),
    alternates: {
      canonical: loc === DEFAULT_LOCALE ? `/festivals/${slug}` : `/${loc}/festivals/${slug}`,
      languages: Object.fromEntries([
        ...LOCALES.map((l) => [
          l,
          l === DEFAULT_LOCALE ? `/festivals/${slug}` : `/${l}/festivals/${slug}`,
        ]),
        ["x-default", `/festivals/${slug}`],
      ]),
    },
  };
}

export default async function FestivalPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);

  const festival = getFestivalPage(slug);
  if (!festival) notFound();

  const today = todayIST();
  const name = localizeFestivalName(festival.name, loc);
  const blurb = localizeFestivalPush(festival.name, festival.push, loc);
  const next = nextDate(festival, today);
  const upcoming = futureDates(festival, today);
  const nearby = nearbyFestivals(festival, today);

  const pooja = getPoojaBySlug(festival.poojaSlug);
  const localizedPooja = pooja ? localizePooja(pooja, loc) : undefined;

  const occasion = occasionFor(festival, today, samagriLeadDays());

  // Shared formatters — see src/lib/dates.ts for why invoices and receipts must NOT use them.
  const fmtLong = (iso: string) => formatDateLong(`${iso}T00:00:00Z`, loc) ?? iso;
  const fmtShort = (iso: string) => formatDate(`${iso}T00:00:00Z`, loc) ?? iso;

  const countdown = (() => {
    if (!next) return null;
    const d = daysBetween(today, next);
    if (d === 0) return t("fp.today");
    if (d === 1) return t("fp.tomorrow");
    return t("fp.daysAway", { n: d });
  })();

  // schema.org Event for each upcoming observance — this is what puts a date in a search result.
  const eventsLd = {
    "@context": "https://schema.org",
    "@graph": upcoming.map((d) => ({
      "@type": "Event",
      name: `${name}${d ? ` ${d.slice(0, 4)}` : ""}`,
      startDate: d,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      description: blurb || undefined,
      location: {
        "@type": "Place",
        name: "India",
        address: { "@type": "PostalAddress", addressCountry: "IN" },
      },
      organizer: { "@type": "Organization", name: "BookMyPoojari", url: SITE_URL },
      url: `${SITE_URL}${loc === DEFAULT_LOCALE ? "" : `/${loc}`}/festivals/${festival.slug}`,
    })),
  };

  return (
    <>
      <Header />
      <main className="flex-1">
        {upcoming.length > 0 && <JsonLd data={eventsLd} />}

        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <Link href="/festivals" className="hover:text-saffron-700">
                {t("fes.crumb")}
              </Link>
            </nav>
            <h1 className="mt-3 flex items-center gap-3 font-heading text-4xl text-maroon-800">
              <span aria-hidden="true">{festival.emoji}</span>
              <span>{name}</span>
            </h1>
            {blurb && <p className="mt-2 max-w-2xl text-lg text-foreground/70">{blurb}</p>}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          {next ? (
            <div className="rounded-2xl border border-saffron-300 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-saffron-700">
                {t("fp.nextDate", { name })}
              </p>
              <p className="mt-1 font-heading text-2xl text-maroon-800">
                {fmtLong(next)}
              </p>
              {countdown && <p className="mt-0.5 text-sm text-foreground/65">{countdown}</p>}

              {/* The order-by line only appears once a real dispatch lead time is configured —
                  see samagriLeadDays(). Until then this is a countdown and nothing more. */}
              {occasion?.orderBy && !occasion.tooLateToOrder && (
                <p className="mt-2 text-sm font-medium text-saffron-800">
                  {t("sc.orderBy", {
                    date: fmtShort(occasion.orderBy),
                  })}
                </p>
              )}
              {occasion?.tooLateToOrder && (
                <p className="mt-2 text-sm text-foreground/70">{t("sc.tooLate", { name })}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/poojas/${festival.poojaSlug}`}
                  className="rounded-full bg-saffron-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
                >
                  {t("fp.bookFor", { name })}
                </Link>
                <Link
                  href="/store"
                  className="rounded-full border border-saffron-300 px-5 py-2.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
                >
                  {t("fp.samagri")}
                </Link>
              </div>

              {localizedPooja && (
                <p className="mt-3 text-sm text-foreground/65">
                  <span aria-hidden="true">{festival.poojaEmoji} </span>
                  {localizedPooja.name} — {localizedPooja.shortDescription}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-saffron-100 bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-foreground/70">{t("fp.exhausted")}</p>
            </div>
          )}

          {upcoming.length > 1 && (
            <>
              <h2 className="mt-6 font-heading text-xl text-maroon-800">
                {t("fp.upcomingDates")}
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {upcoming.map((d) => (
                  <li
                    key={d}
                    className="rounded-xl border border-saffron-100 bg-white px-4 py-2.5 text-sm shadow-sm"
                  >
                    <span className="font-semibold text-maroon-700">{d.slice(0, 4)}</span>
                    <span className="ml-2 text-foreground/75">
                      {fmtLong(d)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {nearby.length > 0 && (
            <>
              <h2 className="mt-6 font-heading text-xl text-maroon-800">{t("fp.nearby")}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {nearby.map((n) => (
                  <li key={n.page.slug}>
                    <Link
                      href={`/festivals/${n.page.slug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-saffron-200 bg-white px-4 py-2 text-sm text-foreground/80 shadow-sm hover:border-saffron-400 hover:text-saffron-700"
                    >
                      <span aria-hidden="true">{n.page.emoji}</span>
                      {localizeFestivalName(n.page.name, loc)}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-6 rounded-xl border border-saffron-100 bg-cream-100/60 px-4 py-3 text-xs text-foreground/70">
            {t("fp.datesNote")}
          </p>

          <Link
            href="/festivals"
            className="mt-3 inline-block text-sm font-semibold text-saffron-700 hover:text-saffron-800"
          >
            {t("fp.allFestivals")}
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
