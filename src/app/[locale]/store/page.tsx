import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoreBrowser from "@/components/StoreBrowser";
import { getProducts } from "@/lib/queries";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.store.title"), description: t("meta.store.desc") };
}

// Re-fetch products from the database at most once every 5 minutes.
export const revalidate = 300;

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const { category, sort } = await searchParams;
  const products = await getProducts();

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <span>{t("common.home")}</span>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{t("nav.store")}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("nav.store")}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              {t("store.subtitle")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {products.length === 0 ? (
            <p className="text-center text-foreground/65">
              {t("store.empty")}
            </p>
          ) : (
            <StoreBrowser
              products={products}
              initialCategory={category}
              initialSort={sort}
            />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
