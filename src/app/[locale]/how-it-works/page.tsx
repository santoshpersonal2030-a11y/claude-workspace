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
  return { title: t("meta.howItWorks.title"), description: t("meta.howItWorks.desc") };
}

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);

  const steps = [
    { emoji: "📿", title: t("hiw.step1.title"), body: t("hiw.step1.body") },
    { emoji: "📅", title: t("hiw.step2.title"), body: t("hiw.step2.body") },
    { emoji: "💳", title: t("hiw.step3.title"), body: t("hiw.step3.body") },
    { emoji: "🙏", title: t("hiw.step4.title"), body: t("hiw.step4.body") },
  ];

  return (
    <ContentPage title={t("nav.howItWorks")} intro={t("hiw.intro")}>
      <ol className="space-y-6">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="flex gap-4 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
          >
            <div className="text-3xl">{step.emoji}</div>
            <div>
              <h2 className="font-heading text-lg text-maroon-700">
                {i + 1}. {step.title}
              </h2>
              <p className="mt-1 text-sm text-foreground/70">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 rounded-2xl bg-saffron-50 p-6 text-center">
        <h3 className="font-heading text-xl text-maroon-700">
          {t("hiw.ready")}
        </h3>
        <p className="mt-1 text-sm text-foreground/65">{t("hiw.readyText")}</p>
        <Link
          href="/poojas"
          className="mt-4 inline-block rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
        >
          {t("hiw.browse")}
        </Link>
      </div>
    </ContentPage>
  );
}
