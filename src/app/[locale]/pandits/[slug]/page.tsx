import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getPanditBySlug,
  getPanditSlugs,
  getPanditReviews,
} from "@/lib/queries";
import { panditTierInfo, TIER_BADGE_CLASS } from "@/lib/pandit-tier";
import PanditAvatar from "@/components/PanditAvatar";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, breadcrumbLd } from "@/lib/seo";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { localizePandit } from "@/lib/pandits-i18n";

function reviewDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getPanditSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pandit = await getPanditBySlug(slug);
  if (!pandit) return { title: "Pandit not found" };
  return {
    title: `${pandit.fullName} — Verified Pandit`,
    description: pandit.bio,
  };
}

export default async function PanditDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);
  const raw = await getPanditBySlug(slug);
  if (!raw) notFound();
  const pandit = localizePandit(raw, loc);

  const reviews = await getPanditReviews(slug);

  const panditLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: pandit.fullName,
        jobTitle: "Hindu Priest (Pandit / Poojari)",
        description: pandit.bio || undefined,
        image: pandit.photoUrl ?? undefined,
        url: `${SITE_URL}/pandits/${slug}`,
        knowsLanguage: pandit.languages.length ? pandit.languages : undefined,
        worksFor: {
          "@type": "Organization",
          name: "BookMyPoojari",
          url: SITE_URL,
        },
        ...(pandit.reviewCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: pandit.rating,
                reviewCount: pandit.reviewCount,
              },
            }
          : {}),
      },
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Our Pandits", path: "/pandits" },
        { name: pandit.fullName, path: `/pandits/${slug}` },
      ]),
    ],
  };

  const tier = panditTierInfo(pandit.experienceYears);
  const facts = [
    { label: t("dir.experience"), value: t("home.pandits.years", { years: pandit.experienceYears }) },
    { label: t("pd.rating"), value: `${pandit.rating.toFixed(1)} ★ (${pandit.reviewCount})` },
    { label: t("dir.languages"), value: pandit.languages.join(", ") },
    { label: t("dir.serves"), value: pandit.regions.join(", ") },
    ...(pandit.specializations.length > 0
      ? [{ label: t("dir.performs"), value: pandit.specializations.map((c) => t(`pcat.${c}`)).join(", ") }]
      : []),
  ];

  return (
    <>
      <JsonLd data={panditLd} />
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <Link href="/pandits" className="hover:text-saffron-700">
                {t("nav.pandits")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{pandit.fullName}</span>
            </nav>

            <div className="mt-5 flex items-center gap-5">
              <PanditAvatar
                photoUrl={pandit.photoUrl}
                name={pandit.fullName}
                className="h-20 w-20 text-2xl"
                sizes="80px"
              />
              <div>
                <h1 className="font-heading text-3xl text-maroon-800">
                  {pandit.fullName}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TIER_BADGE_CLASS[tier.tier]}`}
                    title={t(`ptier.blurb.${tier.tier}`)}
                  >
                    {t(`ptier.${tier.tier}`)}
                  </span>
                  <span className="text-gold-600">
                    ★ {pandit.rating.toFixed(1)}
                  </span>
                  <span className="text-foreground/65">
                    {t("pdt.reviewsParen", { n: pandit.reviewCount })}
                  </span>
                  {pandit.verified && (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                      {t("home.pandits.verified")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <h2 className="font-heading text-2xl text-maroon-800">
                {t("pdt.about")}
              </h2>
              <p className="mt-3 leading-relaxed text-foreground/75">
                {pandit.bio}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-4">
                {facts.map((f) => (
                  <div
                    key={f.label}
                    className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
                  >
                    <div className="text-xs text-foreground/65">{f.label}</div>
                    <div className="mt-1 font-medium text-maroon-700">
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>

              {pandit.qualifications.length > 0 && (
                <div className="mt-4">
                  <h2 className="font-heading text-2xl text-maroon-800">
                    {t("pdt.qualifications")}
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {pandit.qualifications.map((q) => (
                      <li
                        key={q}
                        className="flex gap-3 text-sm text-foreground/75"
                      >
                        <span className="mt-0.5 text-saffron-600">🎓</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pandit.achievements.length > 0 && (
                <div className="mt-4">
                  <h2 className="font-heading text-2xl text-maroon-800">
                    {t("pdt.achievements")}
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {pandit.achievements.map((a) => (
                      <li
                        key={a}
                        className="flex gap-3 text-sm text-foreground/75"
                      >
                        <span className="mt-0.5 text-gold-600">🏆</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-saffron-100 bg-cream-100/60 p-6 text-center shadow-sm">
                <h3 className="font-heading text-lg text-maroon-700">
                  {t("pdt.bookCeremony")}
                </h3>
                <p className="mt-2 text-sm text-foreground/65">
                  {t("pdt.bookBlurb", { name: pandit.fullName })}
                </p>
                <Link
                  href="/poojas"
                  className="mt-5 block w-full rounded-full bg-saffron-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-saffron-800"
                >
                  {t("hiw.browse")}
                </Link>
              </div>
            </div>
          </div>

          {reviews.length > 0 && (
            <div className="mt-6">
              <h2 className="font-heading text-2xl text-maroon-800">
                {t("pdt.reviewsHeading", { n: pandit.reviewCount })}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-saffron-600">
                        {"★".repeat(r.rating)}
                        <span className="text-saffron-200">
                          {"★".repeat(5 - r.rating)}
                        </span>
                      </span>
                      <span className="text-xs text-foreground/65">
                        {reviewDate(r.createdAt)}
                      </span>
                    </div>
                    {r.title && (
                      <h3 className="mt-2 font-heading text-base text-maroon-700">
                        {r.title}
                      </h3>
                    )}
                    {r.body && (
                      <p className="mt-1 text-sm text-foreground/70">{r.body}</p>
                    )}
                    <p className="mt-2 text-xs text-foreground/65">
                      — {r.reviewerName || "A devotee"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
