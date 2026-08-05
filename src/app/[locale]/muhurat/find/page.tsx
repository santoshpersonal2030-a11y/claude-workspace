import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  findAuspiciousDates,
  isKnownCeremony,
  isKnownCity,
  muhuratCeremonies,
  muhuratCities,
} from "@/lib/muhurat-finder";
import { getDictionary, isLocale, DEFAULT_LOCALE, type Translator } from "@/lib/i18n";

/* "Find an auspicious date" — the public face of the muhurat engine.
 *
 * The engine has been able to do this since June; the only thing that ever called it was the
 * admin screen, which produces candidates for a human to curate. The public /muhurat page shows
 * only what has been curated, and nothing has — so this question got an empty page.
 *
 * Everything here is computed at request time from the panchang. It touches no database, which
 * is why it works today with Supabase paused, and will keep working whether or not anyone ever
 * curates a window by hand.
 */

const DEFAULT_CEREMONY = "vivah-sanskar";
const DEFAULT_CITY = "New Delhi";
const MONTH_CHOICES = [3, 6, 12];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("mf.h1"), description: t("mf.subtitle") };
}

function tierLabel(t: Translator, tier: "Excellent" | "Good" | "Fair"): string {
  if (tier === "Excellent") return t("mf.tierExcellent");
  if (tier === "Good") return t("mf.tierGood");
  return t("mf.tierFair");
}

const TIER_CLASS: Record<string, string> = {
  Excellent: "bg-green-100 text-green-800",
  Good: "bg-saffron-100 text-saffron-800",
  Fair: "bg-cream-200 text-foreground/70",
};

export default async function MuhuratFinderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ceremony?: string; city?: string; months?: string }>;
}) {
  const { locale } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);
  const sp = await searchParams;

  // Never trust the URL: fall back to the defaults rather than passing anything through.
  const ceremony = isKnownCeremony(sp.ceremony ?? "") ? sp.ceremony! : DEFAULT_CEREMONY;
  const city = isKnownCity(sp.city ?? "") ? sp.city! : DEFAULT_CITY;
  const months = MONTH_CHOICES.includes(Number(sp.months)) ? Number(sp.months) : 6;

  const ceremonies = muhuratCeremonies(loc);
  const cities = muhuratCities();
  const chosen = ceremonies.find((c) => c.slug === ceremony)!;

  const today = new Date().toISOString().slice(0, 10);
  const dates = findAuspiciousDates({ ceremony, city, months, today, limit: 40 });

  const dateFormat = new Intl.DateTimeFormat(
    loc === "hi" ? "hi-IN" : loc === "te" ? "te-IN" : "en-IN",
    { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
  );

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
              <Link href="/muhurat" className="hover:text-saffron-700">
                {t("nav.muhurat")}
              </Link>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">{t("mf.h1")}</h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">{t("mf.subtitle")}</p>
          </div>
        </section>

        {/* A plain GET form: no JavaScript needed, every result has a shareable URL, and the
            whole page stays server-rendered in the visitor's language. */}
        <section className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <form
            method="get"
            className="grid gap-3 rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm sm:grid-cols-[2fr_1.4fr_1fr_auto] sm:items-end"
          >
            <div>
              <label
                htmlFor="mf-ceremony"
                className="block text-xs font-semibold text-foreground/70"
              >
                {t("mf.ceremony")}
              </label>
              <select
                id="mf-ceremony"
                name="ceremony"
                defaultValue={ceremony}
                className="mt-1 w-full rounded-lg border border-saffron-200 bg-white px-3 py-2 text-sm"
              >
                {ceremonies.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.emoji} {c.poojaName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mf-city" className="block text-xs font-semibold text-foreground/70">
                {t("mf.city")}
              </label>
              <select
                id="mf-city"
                name="city"
                defaultValue={city}
                className="mt-1 w-full rounded-lg border border-saffron-200 bg-white px-3 py-2 text-sm"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="mf-months"
                className="block text-xs font-semibold text-foreground/70"
              >
                {t("mf.lookAhead")}
              </label>
              <select
                id="mf-months"
                name="months"
                defaultValue={String(months)}
                className="mt-1 w-full rounded-lg border border-saffron-200 bg-white px-3 py-2 text-sm"
              >
                {MONTH_CHOICES.map((m) => (
                  <option key={m} value={m}>
                    {t("mf.monthsN", { n: m })}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
            >
              {t("mf.submit")}
            </button>
          </form>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-6 sm:px-6">
          {dates.length === 0 ? (
            <div className="rounded-2xl border border-saffron-100 bg-white p-8 text-center shadow-sm">
              <div className="text-4xl">🗓️</div>
              <h2 className="mt-3 font-heading text-xl text-maroon-800">{t("mf.none")}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-foreground/65">
                {t("mf.noneHint")}
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-block rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
              >
                {t("muh.askMuhurat")}
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-heading text-xl text-maroon-800">
                {t("mf.found", {
                  n: dates.length,
                  ceremony: chosen.poojaName,
                  city,
                })}
              </h2>

              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {dates.map((d) => (
                  <li
                    key={d.date}
                    className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-heading text-lg text-maroon-800">
                          {dateFormat.format(new Date(`${d.date}T00:00:00Z`))}
                        </p>
                        <p className="mt-0.5 text-xs text-foreground/65">
                          {d.nakshatra} · {d.tithi}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          TIER_CLASS[d.tier] ?? TIER_CLASS.Fair
                        }`}
                      >
                        {tierLabel(t, d.tier)} · {t("mf.score", { n: d.score })}
                      </span>
                    </div>

                    <dl className="mt-3 space-y-1 text-sm">
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-foreground/60">{t("mf.window")}:</dt>
                        <dd className="font-medium text-foreground/85">
                          {d.startTime} – {d.endTime}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-foreground/60">{t("mf.avoid")}:</dt>
                        <dd className="text-foreground/85">
                          {d.avoidRahu.from} – {d.avoidRahu.to}
                        </dd>
                      </div>
                    </dl>

                    {d.rahuOverlapsWindow && (
                      <p className="mt-2 rounded-lg bg-cream-200/70 px-3 py-2 text-xs text-foreground/75">
                        {t("mf.overlapNote")}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-foreground/55">{d.factors.join(" · ")}</p>

                    <Link
                      href={`/poojas/${chosen.slug}`}
                      className="mt-3 inline-block rounded-full border border-saffron-300 px-4 py-1.5 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
                    >
                      {t("mf.book", { name: chosen.poojaName })}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Not decoration. A computed muhurat presented as authoritative is the one way this
              feature could do real harm — a wrong auspicious date is a ruined ceremony, not a bad
              search result. Shown on every state of this page, including the empty one. */}
          <p className="mt-5 rounded-xl border border-saffron-100 bg-cream-100/60 px-4 py-3 text-xs text-foreground/70">
            {t("mf.disclaimer")}
          </p>

          <Link
            href="/muhurat"
            className="mt-3 inline-block text-sm font-semibold text-saffron-700 hover:text-saffron-800"
          >
            {t("mf.seePublished")}
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
