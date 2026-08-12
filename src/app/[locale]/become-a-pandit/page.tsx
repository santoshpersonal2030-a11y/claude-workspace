import type { Metadata } from "next";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PanditApplicationForm from "@/components/PanditApplicationForm";
import { localeAlternates } from "@/lib/seo";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

// Was a static `metadata` with `canonical: "/become-a-pandit"` — the same URL in all three
// languages, which told search engines the Hindi and Telugu versions were duplicates of the
// English one. generateMetadata is needed instead because the canonical depends on the locale.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);
  return {
    title: t("meta.becomeAPandit.title"),
    description: t("meta.becomeAPandit.desc"),
    alternates: localeAlternates(loc, "/become-a-pandit"),
  };
}

export default async function BecomeAPanditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);

  /* Inside the component, not at module level: a module-level array is evaluated once on first
     load and would then serve that first language to everyone. */
  const PERKS = [
    { emoji: "📅", title: t("bap.perk1.title"), body: t("bap.perk1.body") },
    { emoji: "✅", title: t("bap.perk2.title"), body: t("bap.perk2.body") },
    { emoji: "💸", title: t("bap.perk3.title"), body: t("bap.perk3.body") },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-saffron-700">
            {t("bap.eyebrow")}
          </p>
          <h1 className="mt-1 font-heading text-3xl text-maroon-800 sm:text-4xl">
            {t("bap.h1")}
          </h1>
          <p className="mt-3 text-foreground/70">{t("bap.intro")}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {PERKS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
              >
                <div className="text-2xl">{p.emoji}</div>
                {/* h2, not h3. These sit directly under the page's h1, so h3 skipped a level and
                    then "Apply now" (an h2) came after them — a screen reader navigating by
                    heading gets a structure that contradicts the page. Purely a tag change:
                    globals.css styles h1-h4 identically and Tailwind's reset makes every heading
                    inherit its size, so nothing moves on screen. */}
                <h2 className="mt-2 font-medium text-maroon-700">{p.title}</h2>
                <p className="mt-1 text-sm text-foreground/65">{p.body}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-5 font-heading text-2xl text-maroon-800">
            {t("bap.applyNow")}
          </h2>
          <div className="mt-4">
            <PanditApplicationForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
