import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SIGNS, getSign, dailyHoroscope } from "@/lib/horoscope";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const revalidate = 3600;

function istDate(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

export function generateStaticParams() {
  return SIGNS.map((s) => ({ sign: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sign: string }>;
}): Promise<Metadata> {
  const { sign: slug } = await params;
  const sign = getSign(slug);
  if (!sign) return { title: "Horoscope not found" };
  return {
    title: `${sign.name} Daily Horoscope Today`,
    description: `Today's free ${sign.name} horoscope — love, career, health, lucky colour and number.`,
  };
}

export default async function SignHoroscopePage({
  params,
}: {
  params: Promise<{ locale: string; sign: string }>;
}) {
  const { locale, sign: slug } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const sign = getSign(slug);
  if (!sign) notFound();

  const idx = SIGNS.findIndex((s) => s.slug === slug);
  const h = dailyHoroscope(idx, istDate());

  const sections = [
    { label: t("horoscope.overall"), value: h.overall, emoji: "✨" },
    { label: t("horoscope.love"), value: h.love, emoji: "❤️" },
    { label: t("horoscope.career"), value: h.career, emoji: "💼" },
    { label: t("horoscope.health"), value: h.health, emoji: "🌿" },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/horoscope" className="hover:text-saffron-700">
                {t("horoscope.crumb")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{sign.name}</span>
            </nav>
            <div className="mt-3 flex items-center gap-4">
              <span className="text-5xl">{sign.symbol}</span>
              <div>
                <h1 className="font-heading text-4xl text-maroon-800">
                  {sign.name}
                </h1>
                <p className="text-sm text-foreground/65">
                  {sign.dates} ·{" "}
                  {t("horoscope.signMeta", {
                    element: sign.element,
                    ruler: sign.ruler,
                  })}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="space-y-4">
            {sections.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
              >
                <h2 className="font-heading text-lg text-maroon-700">
                  {s.emoji} {s.label}
                </h2>
                <p className="mt-2 text-foreground/75">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-foreground/55">{t("horoscope.mood")}</p>
              <p className="mt-1 font-heading text-maroon-700">{h.mood}</p>
            </div>
            <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-foreground/55">
                {t("horoscope.luckyColor")}
              </p>
              <p className="mt-1 font-heading text-maroon-700">{h.luckyColor}</p>
            </div>
            <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-foreground/55">
                {t("horoscope.luckyNumber")}
              </p>
              <p className="mt-1 font-heading text-maroon-700">{h.luckyNumber}</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-saffron-100 bg-cream-100/60 p-6 text-center">
            <Link
              href="/consultations/kundli-reading"
              className="inline-block rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
            >
              {t("horoscope.ctaButton")}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
