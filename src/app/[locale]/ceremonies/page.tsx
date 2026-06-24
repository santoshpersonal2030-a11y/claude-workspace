import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { lifeEvents } from "@/lib/ceremonies";
import { getPoojas } from "@/lib/queries";
import { formatINR } from "@/lib/poojas";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.ceremonies.title"), description: t("meta.ceremonies.desc") };
}

export const revalidate = 300;

export default async function CeremoniesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const poojas = await getPoojas();
  const priceOf = (slug: string) =>
    poojas.find((p) => p.slug === slug)?.startingPrice ?? 0;

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{t("cer.crumb")}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("cer.h1")}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              {t("cer.subtitle")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {lifeEvents.map((event) => {
              const from = event.poojaSlugs
                .map(priceOf)
                .filter((n) => n > 0)
                .reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY);
              return (
                <Link
                  key={event.slug}
                  href={`/ceremonies/${event.slug}`}
                  className="group flex flex-col rounded-3xl border border-saffron-100 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-saffron-200 hover:shadow-md"
                >
                  <div className="text-5xl">{event.emoji}</div>
                  <h2 className="mt-4 font-heading text-2xl text-maroon-800">
                    {event.title}
                  </h2>
                  <p className="text-sm text-saffron-700">{event.sanskrit}</p>
                  <p className="mt-3 flex-1 text-sm text-foreground/65">
                    {event.tagline}.
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-saffron-50 pt-4">
                    <span className="text-sm text-foreground/65">
                      {t("cer.count", { n: event.poojaSlugs.length })}
                      {Number.isFinite(from) && (
                        <>
                          {" "}
                          · {t("cer.from")}{" "}
                          <span className="font-semibold text-foreground">
                            {formatINR(from)}
                          </span>
                        </>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-saffron-700">
                      {t("cer.explore")}
                    </span>
                  </div>
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
