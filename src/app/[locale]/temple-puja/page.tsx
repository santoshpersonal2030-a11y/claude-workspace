import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { templePujas } from "@/lib/temple-pujas";
import { formatINR } from "@/lib/poojas";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.temple.title"), description: t("meta.temple.desc") };
}

export default async function TemplePujaPage({
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
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <span>{t("common.home")}</span>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{t("temple.crumb")}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("temple.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              {t("temple.subtitle")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h2 className="sr-only">{t("temple.allHeading")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {templePujas.map((p) => (
              <Link
                key={p.slug}
                href={`/temple-puja/${p.slug}`}
                className="group flex flex-col rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{p.emoji}</span>
                  <div className="flex gap-1">
                    {p.includesPrasad && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        {t("temple.withPrasad")}
                      </span>
                    )}
                    {p.popular && (
                      <span className="rounded-full bg-saffron-100 px-2.5 py-0.5 text-xs font-semibold text-saffron-800">
                        {t("temple.popular")}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="mt-4 font-heading text-lg text-maroon-700 group-hover:text-saffron-700">
                  {p.name}
                </h3>
                <p className="text-xs font-medium text-saffron-700">
                  {p.temple}
                </p>
                <p className="mt-2 flex-1 text-sm text-foreground/65">
                  {p.shortDescription}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-saffron-50 pt-3">
                  <span className="text-xs text-foreground/65">{p.category}</span>
                  <span className="font-heading text-lg text-saffron-700">
                    {formatINR(p.price)}
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
