import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoojaList from "@/components/PoojaList";
import { getPoojas } from "@/lib/queries";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Book a Pooja — All Ceremonies",
  description:
    "Browse and book verified Pandits for Satyanarayan Katha, Griha Pravesh, Lakshmi Puja, Navagraha Shanti and more. Transparent pricing, your language, on time.",
};

// Re-fetch the catalog from the database at most once every 5 minutes.
export const revalidate = 300;

export default async function PoojasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const poojas = await getPoojas();

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <nav className="text-sm text-foreground/60">
              <span>{t("common.home")}</span>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{t("nav.bookPooja")}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("nav.bookPooja")}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              {t("poojas.subtitle")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <PoojaList poojas={poojas} />
        </section>
      </main>
      <Footer />
    </>
  );
}
