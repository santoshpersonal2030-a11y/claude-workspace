import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.offline.title") };
}

// Shown by the service worker when a navigation fails with no network.
export default async function OfflinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);

  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="max-w-md text-center">
          <div className="text-5xl">🪔</div>
          <h1 className="mt-4 font-heading text-2xl text-maroon-800">
            {t("offline.h1")}
          </h1>
          <p className="mt-2 text-foreground/65">{t("offline.body")}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
