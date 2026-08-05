import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoojaList from "@/components/PoojaList";
import { getPoojas } from "@/lib/queries";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { localizePooja } from "@/lib/poojas-i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.poojas.title"), description: t("meta.poojas.desc") };
}

// Re-fetch the catalog from the database at most once every 5 minutes.
export const revalidate = 300;

export default async function PoojasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const poojas = (await getPoojas()).map((p) => localizePooja(p, loc));

  // The breadcrumb, <h1>, subtitle and search box are rendered by PoojaList so that the search
  // can sit on the same line as the heading while still owning the query state it filters with.
  return (
    <>
      <Header />
      <main className="flex-1">
        <PoojaList poojas={poojas} />
      </main>
      <Footer />
    </>
  );
}
