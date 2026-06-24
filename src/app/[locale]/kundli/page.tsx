import type { Metadata } from "next";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KundliForm from "@/components/KundliForm";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.kundli.title"), description: t("meta.kundli.desc") };
}

export default async function KundliPage({
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
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <span>{t("common.home")}</span>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{t("kundli.crumb")}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("kundli.title")}
            </h1>
            <p className="mt-3 text-lg text-foreground/70">
              {t("kundli.subtitle")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-xl px-4 py-10 sm:px-6">
          <KundliForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
