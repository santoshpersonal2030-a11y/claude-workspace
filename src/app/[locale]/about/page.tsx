import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "@/components/ContentPage";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.about.title"), description: t("meta.about.desc") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);

  const values = [
    { title: t("about.value1.title"), body: t("about.value1.body") },
    { title: t("about.value2.title"), body: t("about.value2.body") },
    { title: t("about.value3.title"), body: t("about.value3.body") },
  ];

  return (
    <ContentPage title={t("about.h1")} intro={t("about.intro")}>
      <div className="space-y-4 text-foreground/75 leading-relaxed">
        <p>{t("about.p1")}</p>
        <p>{t("about.p2")}</p>
        <p>{t("about.p3")}</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {values.map((v) => (
          <div
            key={v.title}
            className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
          >
            <h2 className="font-heading text-lg text-maroon-700">{v.title}</h2>
            <p className="mt-2 text-sm text-foreground/65">{v.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/pandits"
          className="rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
        >
          {t("about.meetPandits")}
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-saffron-300 px-6 py-2.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
        >
          {t("about.getInTouch")}
        </Link>
      </div>
    </ContentPage>
  );
}
