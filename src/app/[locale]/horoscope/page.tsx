import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SIGNS, dailyHoroscope } from "@/lib/horoscope";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

// Refresh through the day; content is keyed by the IST date so it changes daily.
export const revalidate = 3600;

function istDate(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return {
    title: t("meta.horoscope.title"),
    description: t("meta.horoscope.desc"),
  };
}

export default async function HoroscopePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const date = istDate();

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <span>{t("common.home")}</span>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{t("horoscope.crumb")}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("horoscope.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              {t("horoscope.subtitle")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SIGNS.map((sign, i) => {
              const h = dailyHoroscope(i, date);
              return (
                <Link
                  key={sign.slug}
                  href={`/horoscope/${sign.slug}`}
                  className="group flex flex-col rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{sign.symbol}</span>
                    <div>
                      <h2 className="font-heading text-lg text-maroon-700 group-hover:text-saffron-700">
                        {sign.name}
                      </h2>
                      <p className="text-xs text-foreground/55">{sign.dates}</p>
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-sm text-foreground/70">
                    {h.overall}
                  </p>
                  <span className="mt-3 text-sm font-semibold text-saffron-700">
                    {t("horoscope.readFull")}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
