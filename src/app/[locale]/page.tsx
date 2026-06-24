import Link from "next/link";

import HomeHero from "@/components/HomeHero";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddToCartButton from "@/components/AddToCartButton";
import RatingStars from "@/components/RatingStars";
import ProductThumb from "@/components/ProductThumb";
import { formatINR } from "@/lib/poojas";
import { getPopularPoojas, getPandits, getProducts } from "@/lib/queries";
import { getApprovedMuhuratWindows } from "@/lib/muhurat-data";
import TodayPanchang from "@/components/TodayPanchang";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

const MUHURAT_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MUHURAT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function muhuratDateLabel(date: string) {
  const [, m, d] = date.split("-").map(Number);
  const wd = new Date(`${date}T00:00:00Z`).getUTCDay();
  return `${MUHURAT_WEEKDAYS[wd]}, ${d} ${MUHURAT_MONTHS[m - 1]}`;
}

// Re-fetch popular poojas from the database at most once every 5 minutes.
export const revalidate = 300;

function panditInitials(name: string) {
  return name
    .replace(/^(Pandit|Acharya)\s+/i, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);

  const trustStats = [
    { value: "500+", label: t("home.trust.pandits") },
    { value: "50,000+", label: t("home.trust.poojas") },
    { value: "4.9★", label: t("home.trust.rating") },
    { value: "20+", label: t("home.trust.languages") },
  ];

  const steps = [1, 2, 3, 4].map((n) => ({
    icon: ["📿", "🧑🏽‍🦱", "🛍️", "🙏"][n - 1],
    title: t(`home.how.step${n}.title`),
    text: t(`home.how.step${n}.text`),
  }));

  const reasons = [1, 2, 3, 4].map((n) => ({
    icon: ["✅", "💰", "🗣️", "📦"][n - 1],
    title: t(`home.why.${n}.title`),
    text: t(`home.why.${n}.text`),
  }));

  const testimonials = [1, 2, 3].map((n) => ({
    quote: t(`home.testimonials.${n}.quote`),
    name: ["Priya & Aniket", "Ramesh Gupta", "Lakshmi Iyer"][n - 1],
    detail: t(`home.testimonials.${n}.detail`),
  }));

  const faqs = [1, 2, 3, 4, 5, 6].map((n) => ({
    q: t(`home.faq.${n}.q`),
    a: t(`home.faq.${n}.a`),
  }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const popularPoojas = await getPopularPoojas();
  const featuredPandits = (await getPandits()).slice(0, 3);
  const muhuratDates = (await getApprovedMuhuratWindows(8)).slice(0, 4);
  const featuredProducts = (await getProducts())
    .slice()
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 4);

  return (
    <>
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-temple-gradient">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <HomeHero />

            <div className="relative">
              <div className="rounded-3xl border border-saffron-100 bg-white/70 p-8 shadow-xl backdrop-blur">
                <div className="mb-5 flex items-center justify-center text-6xl">
                  🛕
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {trustStats.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-2xl bg-saffron-50 p-4 text-center"
                    >
                      <div className="font-heading text-2xl text-saffron-700">
                        {s.value}
                      </div>
                      <div className="mt-1 text-xs text-foreground/65">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Today's panchang */}
        <TodayPanchang />

        {/* Popular poojas */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-3xl text-maroon-800">
                {t("home.popular.title")}
              </h2>
              <p className="mt-2 text-foreground/70">
                {t("home.popular.subtitle")}
              </p>
            </div>
            <Link
              href="/poojas"
              className="hidden whitespace-nowrap text-sm font-semibold text-saffron-700 hover:text-saffron-800 sm:block"
            >
              {t("home.popular.viewAll")}
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popularPoojas.map((pooja) => (
              <Link
                key={pooja.slug}
                href={`/poojas/${pooja.slug}`}
                className="group flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-saffron-200 hover:shadow-md"
              >
                <div className="text-4xl">{pooja.emoji}</div>
                <h3 className="mt-4 font-heading text-lg text-maroon-700">
                  {pooja.name}
                </h3>
                {pooja.sanskritName && (
                  <p className="text-sm text-saffron-700">
                    {pooja.sanskritName}
                  </p>
                )}
                <p className="mt-2 flex-1 text-sm text-foreground/65">
                  {pooja.shortDescription}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-saffron-50 pt-4">
                  <span className="text-sm text-foreground/65">
                    {t("home.popular.startsAt")}{" "}
                    <span className="font-semibold text-foreground">
                      {formatINR(pooja.startingPrice)}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-saffron-700 group-hover:translate-x-0.5">
                    {t("home.popular.book")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Upcoming auspicious dates teaser */}
        {muhuratDates.length > 0 && (
          <section className="bg-cream-100/60 py-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-heading text-3xl text-maroon-800">
                    {t("home.muhurat.title")}
                  </h2>
                  <p className="mt-2 text-foreground/70">
                    {t("home.muhurat.subtitle")}
                  </p>
                </div>
                <Link
                  href="/muhurat"
                  className="hidden whitespace-nowrap text-sm font-semibold text-saffron-700 hover:text-saffron-800 sm:block"
                >
                  {t("home.muhurat.viewAll")}
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {muhuratDates.map((w) => (
                  <Link
                    key={w.id}
                    href={w.poojaSlug ? `/poojas/${w.poojaSlug}` : "/muhurat"}
                    className="flex flex-col rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="font-heading text-xl text-maroon-800">
                      {muhuratDateLabel(w.date)}
                    </div>
                    <div className="mt-1 text-sm font-medium text-saffron-700">
                      🕉️ {w.label ?? t("home.muhurat.auspicious")}
                    </div>
                    <div className="mt-1 text-sm text-foreground/65">
                      {w.ceremony} · {w.startTime}–{w.endTime}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Consultation CTA */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-saffron-100 bg-cream-100/70 px-6 py-10 text-center sm:px-12">
            <span className="text-4xl">🔮</span>
            <h2 className="font-heading text-3xl text-maroon-800">
              {t("home.consult.title")}
            </h2>
            <p className="max-w-xl text-foreground/70">
              {t("home.consult.text")}
            </p>
            <Link
              href="/consultations"
              className="rounded-full bg-saffron-700 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-saffron-800"
            >
              {t("home.consult.cta")}
            </Link>
          </div>
        </section>

        {/* Shop bestsellers */}
        {featuredProducts.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-3xl text-maroon-800">
                  {t("home.store.title")}
                </h2>
                <p className="mt-2 text-foreground/70">
                  {t("home.store.subtitle")}
                </p>
              </div>
              <Link
                href="/store"
                className="hidden whitespace-nowrap text-sm font-semibold text-saffron-700 hover:text-saffron-800 sm:block"
              >
                {t("home.store.visit")}
              </Link>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => {
                const discount =
                  product.mrp && product.mrp > product.price
                    ? Math.round(
                        ((product.mrp - product.price) / product.mrp) * 100,
                      )
                    : 0;
                return (
                  <div
                    key={product.slug}
                    className="flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative">
                      <Link href={`/store/${product.slug}`}>
                        <ProductThumb
                          imageUrl={product.imageUrl}
                          name={product.name}
                          className="aspect-square w-full rounded-xl"
                        />
                      </Link>
                      {discount > 0 && (
                        <span className="absolute right-2 top-2 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                          {t("home.store.off", { pct: discount })}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 font-heading text-base text-maroon-700">
                      <Link
                        href={`/store/${product.slug}`}
                        className="hover:text-saffron-700"
                      >
                        {product.name}
                      </Link>
                    </h3>
                    <div className="mt-1">
                      <RatingStars
                        rating={product.rating}
                        reviewCount={product.reviewCount}
                      />
                    </div>
                    <div className="mt-2 flex flex-1 items-end gap-2">
                      <span className="font-heading text-lg text-saffron-700">
                        {formatINR(product.price)}
                      </span>
                      {discount > 0 && product.mrp && (
                        <span className="text-xs text-foreground/65 line-through">
                          {formatINR(product.mrp)}
                        </span>
                      )}
                    </div>
                    <AddToCartButton product={product} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Featured pandits */}
        {featuredPandits.length > 0 && (
          <section className="bg-cream-100/60 py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-heading text-3xl text-maroon-800">
                    {t("home.pandits.title")}
                  </h2>
                  <p className="mt-2 text-foreground/70">
                    {t("home.pandits.subtitle")}
                  </p>
                </div>
                <Link
                  href="/pandits"
                  className="hidden whitespace-nowrap text-sm font-semibold text-saffron-700 hover:text-saffron-800 sm:block"
                >
                  {t("home.pandits.viewAll")}
                </Link>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {featuredPandits.map((pandit) => (
                  <Link
                    key={pandit.slug}
                    href={`/pandits/${pandit.slug}`}
                    className="flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-saffron-100 font-heading text-lg text-saffron-700">
                        {panditInitials(pandit.fullName)}
                      </div>
                      <div>
                        <h3 className="font-heading text-lg text-maroon-700">
                          {pandit.fullName}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-2 text-sm">
                          <span className="text-gold-600">
                            ★ {pandit.rating.toFixed(1)}
                          </span>
                          <span className="text-foreground/65">
                            ({pandit.reviewCount})
                          </span>
                          {pandit.verified && (
                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                              {t("home.pandits.verified")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 flex-1 text-sm text-foreground/65">
                      {pandit.bio}
                    </p>
                    <div className="mt-4 border-t border-saffron-50 pt-3 text-xs text-foreground/65">
                      {t("home.pandits.years", { years: pandit.experienceYears })} ·{" "}
                      {pandit.languages.slice(0, 3).join(", ")}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center font-heading text-3xl text-maroon-800">
              {t("home.how.title")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-foreground/70">
              {t("home.how.subtitle")}
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <div key={step.title} className="relative text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm ring-1 ring-saffron-100">
                    {step.icon}
                  </div>
                  <div className="mt-3 font-heading text-sm text-saffron-700">
                    {t("home.how.step", { n: i + 1 })}
                  </div>
                  <h3 className="mt-1 font-heading text-lg text-maroon-700">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-foreground/65">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why choose us */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-heading text-3xl text-maroon-800">
            {t("home.why.title")}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r) => (
              <div
                key={r.title}
                className="rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
              >
                <div className="text-3xl">{r.icon}</div>
                <h3 className="mt-4 font-heading text-lg text-maroon-700">
                  {r.title}
                </h3>
                <p className="mt-2 text-sm text-foreground/65">{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-cream-100/60 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center font-heading text-3xl text-maroon-800">
              {t("home.testimonials.title")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-foreground/70">
              {t("home.testimonials.subtitle")}
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {testimonials.map((tm) => (
                <figure
                  key={tm.name}
                  className="flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
                >
                  <div className="text-gold-500" aria-hidden="true">
                    ★★★★★
                  </div>
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground/75">
                    “{tm.quote}”
                  </blockquote>
                  <figcaption className="mt-4 border-t border-saffron-50 pt-3">
                    <div className="font-medium text-maroon-700">{tm.name}</div>
                    <div className="text-xs text-foreground/65">{tm.detail}</div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Samagri store teaser */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-saffron-700 px-8 py-12 text-center shadow-lg sm:px-12">
            <div className="text-5xl">🛍️</div>
            <h2 className="mt-4 font-heading text-3xl text-white">
              {t("home.samagri.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-saffron-50">
              {t("home.samagri.text")}
            </p>
            <Link
              href="/store"
              className="mt-6 inline-block rounded-full bg-white px-7 py-3 text-base font-semibold text-saffron-700 transition-colors hover:bg-saffron-50"
            >
              {t("home.samagri.cta")}
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
          <h2 className="text-center font-heading text-3xl text-maroon-800">
            {t("home.faq.title")}
          </h2>
          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-maroon-700">
                  {faq.q}
                  <span className="text-saffron-600 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <h2 className="font-heading text-3xl text-maroon-800">
              {t("home.cta.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-foreground/70">
              {t("home.cta.text")}
            </p>
            <Link
              href="/poojas"
              className="mt-7 inline-block rounded-full bg-saffron-700 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800"
            >
              {t("home.cta.button")}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
