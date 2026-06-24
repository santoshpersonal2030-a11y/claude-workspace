import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { consultations } from "@/lib/consultations";
import { formatINR } from "@/lib/poojas";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.consult.title"), description: t("meta.consult.desc") };
}

export default async function ConsultationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <span>{t("common.home")}</span>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{t("consult.crumb")}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("consult.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              {t("consult.subtitle")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="sr-only">{t("consult.allHeading")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {consultations.map((c) => (
              <Link
                key={c.slug}
                href={`/consultations/${c.slug}`}
                className="group flex flex-col rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{c.emoji}</span>
                  {c.popular && (
                    <span className="rounded-full bg-saffron-100 px-2.5 py-0.5 text-xs font-semibold text-saffron-800">
                      {t("consult.popular")}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 font-heading text-lg text-maroon-700 group-hover:text-saffron-700">
                  {c.name}
                </h3>
                {c.sanskritName && (
                  <p className="text-xs text-foreground/55">{c.sanskritName}</p>
                )}
                <p className="mt-2 flex-1 text-sm text-foreground/65">
                  {c.shortDescription}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-saffron-50 pt-3">
                  <span className="text-xs text-foreground/65">
                    {t("consult.minutes", { mins: c.durationMins })}
                  </span>
                  <span className="font-heading text-lg text-saffron-700">
                    {formatINR(c.price)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
