import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PanditDirectory from "@/components/PanditDirectory";
import { getPandits } from "@/lib/queries";
import { CITY_COORDS } from "@/lib/muhurat-engine";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.pandits.title"), description: t("meta.pandits.desc") };
}

export const revalidate = 300;

export default async function PanditsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const pandits = await getPandits();

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
              <span className="text-saffron-700">{t("nav.pandits")}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("pandits.h1")}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              {t("pandits.subtitle")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <PanditDirectory pandits={pandits} />

          <div className="mt-12 border-t border-saffron-100 pt-8">
            <h2 className="font-heading text-xl text-maroon-800">
              {t("pandits.acrossIndia")}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.keys(CITY_COORDS).map((c) => (
                <Link
                  key={c}
                  href={`/pandits/in/${c.toLowerCase().replace(/\s+/g, "-")}`}
                  className="rounded-full border border-saffron-200 bg-white px-4 py-1.5 text-sm text-saffron-700 hover:bg-saffron-50"
                >
                  {t("pandits.inCity", { city: c })}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
