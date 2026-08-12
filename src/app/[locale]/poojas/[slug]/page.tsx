import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import PoojaBooking from "@/components/PoojaBooking";
import AddToCartButton from "@/components/AddToCartButton";
import ProductThumb from "@/components/ProductThumb";
import { formatINR } from "@/lib/poojas";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { localizePooja } from "@/lib/poojas-i18n";
import { localizeProduct } from "@/lib/products-i18n";
import {
  getPoojaBySlug,
  getPoojaSlugs,
  getPanditsForPooja,
  getProducts,
} from "@/lib/queries";
import { panditTier } from "@/lib/pandit-tier";
import OccasionBanner from "@/components/OccasionBanner";
import { occasionsForPooja, todayIST } from "@/lib/store-calendar";
import { poojaFaqs } from "@/lib/pooja-faq";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookmypoojari.com";

// Re-fetch from the database at most once every 5 minutes.
export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getPoojaSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const raw = await getPoojaBySlug(slug);
  if (!raw) return { title: "Pooja not found" };
  const pooja = localizePooja(raw, loc);
  return {
    title: `${pooja.name} — BookMyPoojari`,
    description: pooja.shortDescription,
  };
}

export default async function PoojaDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);
  const raw = await getPoojaBySlug(slug);
  if (!raw) notFound();
  const pooja = localizePooja(raw, loc);

  // The nearest festival this pooja is performed for, if any. Bundled data, no database.
  const occasion = occasionsForPooja(pooja.slug, todayIST())[0];

  // Priests who specialise in this pooja's category or ritual type come first.
  const panditRoster = await getPanditsForPooja(pooja.category, pooja.ritualType);
  const pandits = panditRoster.map((p) => ({
    slug: p.slug,
    fullName: p.fullName,
    languages: p.languages,
    tier: panditTier(p.experienceYears),
    experienceYears: p.experienceYears,
    homePincode: p.homePincode,
    servicePincodes: p.servicePincodes,
  }));

  // Cross-sell samagri: prefer kits/essentials, then fill with bestsellers.
  const crossSellRank = ["Puja Kits", "Essentials", "Havan"];
  const crossSell = (await getProducts())
    .map((p) => localizeProduct(p, loc))
    .slice()
    .sort((a, b) => {
      const ra = crossSellRank.indexOf(a.category ?? "");
      const rb = crossSellRank.indexOf(b.category ?? "");
      return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
    })
    .slice(0, 4);

  const includes =
    pooja.includes && pooja.includes.length > 0
      ? pooja.includes
      : [
          t("pd.defInc1"),
          t("pd.defInc2"),
          t("pd.defInc3"),
          t("pd.defInc4"),
          t("pd.defInc5"),
        ];
  const longDescription =
    pooja.longDescription ??
    t("pd.autoDesc", {
      short: pooja.shortDescription,
      name: pooja.name,
      h: pooja.durationHours,
    });

  const faqs = poojaFaqs(pooja, t);
  const url = `${SITE_URL}/poojas/${pooja.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: pooja.name,
        serviceType: `${pooja.ritualType} · ${pooja.category}`,
        description: longDescription,
        url,
        areaServed: "IN",
        provider: {
          "@type": "Organization",
          name: "BookMyPoojari",
          url: SITE_URL,
        },
        offers: {
          "@type": "Offer",
          price: pooja.startingPrice,
          priceCurrency: "INR",
          url,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <Link href="/poojas" className="hover:text-saffron-700">
                {t("nav.bookPooja")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{pooja.name}</span>
            </nav>

            {/* min-w-0 on the text block, shrink-0 on the icon.
                A flex child will not shrink below its own min-content width unless it is told it
                may — so the long Telugu pooja name pushed this row to 343px inside a 320px
                viewport and the whole page scrolled sideways. Found by e2e/reflow.spec.ts, which
                tests in Telugu precisely because it is the language that overflows first.
                Same shape as the `minmax(0,1fr)` grid trap: the default floor is min-content. */}
            <div className="mt-4 flex items-start gap-4">
              <div className="shrink-0 text-5xl">{pooja.emoji}</div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-medium text-saffron-700">
                    {t(`pcat.${pooja.category}`)}
                  </span>
                  {pooja.requiresMuhurat ? (
                    <span className="rounded-full bg-gold-400 px-3 py-1 text-xs font-medium text-maroon-800">
                      🕉️ {t("pd.auspiciousMuhurat")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      ✓ {t("pd.flexibleTiming")}
                    </span>
                  )}
                </div>
                {/* break-words as well as min-w-0 on the parent. min-w-0 gives the box PERMISSION
                    to shrink; it does not give the text anywhere to break. A long Telugu or Hindi
                    pooja name has no space in it, so without this the word itself sets the
                    minimum width and the row stays too wide however willing the box is. Both are
                    needed — that is why the first attempt at this fix moved the reported culprit
                    but left the page still scrolling 23px. */}
                <h1 className="mt-2 break-words font-heading text-4xl text-maroon-800">
                  {pooja.name}
                </h1>
                {pooja.sanskritName && (
                  <p className="mt-1 break-words text-lg text-saffron-700">
                    {pooja.sanskritName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Which festival, if any, this pooja is performed for. lakshmi-puja serves three
            (Diwali, Dhanteras, Akshaya Tritiya), so this shows the nearest one. */}
        {occasion && (
          <section className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
            <OccasionBanner occasion={occasion} locale={loc} showShopLink />
          </section>
        )}

        {/* Body */}
        <section className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* Left: details */}
            <div>
              <div className="flex flex-wrap gap-6 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm">
                <div>
                  <div className="text-xs text-foreground/65">
                    {t("pd.startingPrice")}
                  </div>
                  <div className="font-heading text-2xl text-saffron-700">
                    {formatINR(pooja.startingPrice)}
                  </div>
                </div>
                <div className="border-l border-saffron-100 pl-6">
                  <div className="text-xs text-foreground/65">{t("pd.duration")}</div>
                  <div className="font-heading text-2xl text-maroon-700">
                    {t("pd.hours", { h: pooja.durationHours })}
                  </div>
                </div>
                <div className="border-l border-saffron-100 pl-6">
                  <div className="text-xs text-foreground/65">{t("pd.rating")}</div>
                  <div className="font-heading text-2xl text-maroon-700">
                    4.9 ★
                  </div>
                </div>
              </div>

              <h2 className="mt-4 font-heading text-2xl text-maroon-800">
                {t("pd.about")}
              </h2>
              <p className="mt-3 leading-relaxed text-foreground/75">
                {longDescription}
              </p>

              <h2 className="mt-4 font-heading text-2xl text-maroon-800">
                {t("pd.included")}
              </h2>
              <ul className="mt-3 space-y-2">
                {includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-foreground/75"
                  >
                    <span className="mt-0.5 text-saffron-600">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h2 className="mt-4 font-heading text-2xl text-maroon-800">
                {t("pd.faq")}
              </h2>
              <div className="mt-3 divide-y divide-saffron-100 rounded-2xl border border-saffron-100 bg-white">
                {faqs.map((f) => (
                  <details key={f.question} className="group p-4">
                    <summary className="cursor-pointer list-none font-medium text-maroon-700 marker:content-none">
                      <span className="text-saffron-600 group-open:hidden">+ </span>
                      <span className="hidden text-saffron-600 group-open:inline">– </span>
                      {f.question}
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                      {f.answer}
                    </p>
                  </details>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-saffron-100 bg-cream-100/60 p-5">
                <h3 className="font-heading text-lg text-maroon-700">
                  {t("pd.unsureTitle")}
                </h3>
                <p className="mt-1 text-sm text-foreground/65">
                  {t("pd.unsureText")}{" "}
                  <Link
                    href="/contact"
                    className="font-semibold text-saffron-700 hover:text-saffron-800"
                  >
                    {t("pd.talkToUs")}
                  </Link>
                </p>
              </div>
            </div>

            {/* Right: booking form */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <PoojaBooking pooja={pooja} pandits={pandits} />
            </div>
          </div>

          {/* Frequently bought together */}
          {crossSell.length > 0 && (
            <div className="mt-8">
              <h2 className="font-heading text-2xl text-maroon-800">
                {t("pd.fbt")}
              </h2>
              <p className="mt-1 text-sm text-foreground/65">
                {t("pd.fbtSubtitle")}
              </p>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {crossSell.map((item) => (
                  <div
                    key={item.slug}
                    className="flex flex-col rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
                  >
                    <Link href={`/store/${item.slug}`}>
                      <ProductThumb
                        imageUrl={item.imageUrl}
                        name={item.name}
                        className="aspect-square w-full rounded-xl"
                        emojiSize="text-3xl"
                      />
                    </Link>
                    <h3 className="mt-3 font-heading text-base text-maroon-700">
                      <Link
                        href={`/store/${item.slug}`}
                        className="hover:text-saffron-700"
                      >
                        {item.name}
                      </Link>
                    </h3>
                    <div className="mt-2 flex flex-1 items-end">
                      <span className="font-heading text-lg text-saffron-700">
                        {formatINR(item.price)}
                      </span>
                    </div>
                    <AddToCartButton product={item} />
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
