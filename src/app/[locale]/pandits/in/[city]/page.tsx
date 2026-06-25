import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { CITY_COORDS, fullPanchanga } from "@/lib/muhurat-engine";
import { getPopularPoojas } from "@/lib/queries";
import { localizePooja } from "@/lib/poojas-i18n";
import { formatINR } from "@/lib/poojas";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

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
function to12h(mins: number): string {
  const t = Math.round(mins);
  let h = Math.floor(t / 60) % 24;
  const m = t % 60;
  const ap = h < 12 ? "AM" : "PM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

export function generateStaticParams() {
  return Object.keys(CITY_COORDS).map((c) => ({ city: citySlug(c) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const name = CITY_BY_SLUG.get(city);
  if (!name) return { title: "City not found" };
  return {
    title: `Book a Verified Pandit in ${name} — Pooja at Home`,
    description: `Book experienced, verified Pandits in ${name} for Satyanarayan Katha, Griha Pravesh, Havan, Shanti poojas and all sanskars — in your language, at home, with authentic samagri.`,
  };
}

export default async function CityPanditPage({
  params,
}: {
  params: Promise<{ locale: string; city: string }>;
}) {
  const { locale, city } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);
  const name = CITY_BY_SLUG.get(city);
  if (!name) notFound();

  const coords = CITY_COORDS[name];
  const pan = fullPanchanga(todayIST(), coords.lat, coords.lng);
  const poojas = (await getPopularPoojas()).map((p) => localizePooja(p, loc));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Pandit booking in ${name}`,
    serviceType: "Hindu priest (Pandit) booking for poojas and ceremonies",
    areaServed: { "@type": "City", name },
    provider: { "@type": "Organization", name: "BookMyPoojari", url: SITE_URL },
    url: `${SITE_URL}/pandits/in/${city}`,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <Link href="/pandits" className="hover:text-saffron-700">
                {t("nav.pandits")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{name}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("cty.h1", { city: name })}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              {t("cty.subtitle", { city: name })}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/poojas"
                className="rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
              >
                {t("nav.bookPooja")}
              </Link>
              <Link
                href="/pandits"
                className="rounded-full border border-saffron-300 px-6 py-2.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
              >
                {t("about.meetPandits")}
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          {pan && (
            <div className="mb-5 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-lg text-maroon-700">
                {t("cty.today", { city: name })}
              </h2>
              <p className="mt-1 text-sm text-foreground/65">
                {pan.weekday} · {pan.tithi.name} · {pan.nakshatra.name} ·{" "}
                {t("pv.sunrise")} {to12h(pan.sunrise)} · {t("pv.sunset")}{" "}
                {to12h(pan.sunset)} · {t("pv.abhijit")}{" "}
                {to12h(pan.abhijit.start)}–{to12h(pan.abhijit.end)}.{" "}
                <Link
                  href={`/panchang?city=${encodeURIComponent(name)}`}
                  className="font-semibold text-saffron-700 hover:underline"
                >
                  {t("cty.fullPanchang")}
                </Link>
              </p>
            </div>
          )}

          <h2 className="font-heading text-2xl text-maroon-800">
            {t("cty.popular", { city: name })}
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {poojas.map((p) => (
              <Link
                key={p.slug}
                href={`/poojas/${p.slug}`}
                className="group flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="text-4xl">{p.emoji}</div>
                <h3 className="mt-3 font-heading text-lg text-maroon-700">
                  {p.name}
                </h3>
                <p className="mt-1 flex-1 text-sm text-foreground/65">
                  {p.shortDescription}
                </p>
                <div className="mt-3 text-sm text-foreground/65">
                  {t("cty.from")}{" "}
                  <span className="font-semibold text-foreground">
                    {formatINR(p.startingPrice)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-saffron-100 bg-cream-100/60 p-6">
            <h2 className="font-heading text-xl text-maroon-800">
              {t("cty.why", { city: name })}
            </h2>
            <ul className="mt-3 grid gap-2 text-sm text-foreground/75 sm:grid-cols-2">
              <li>✓ {t("cty.why1")}</li>
              <li>✓ {t("cty.why2")}</li>
              <li>✓ {t("cty.why3")}</li>
              <li>✓ {t("cty.why4")}</li>
              <li>✓ {t("cty.why5")}</li>
              <li>✓ {t("cty.why6")}</li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
