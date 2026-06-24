import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoojaBooking from "@/components/PoojaBooking";
import AddToCartButton from "@/components/AddToCartButton";
import ProductThumb from "@/components/ProductThumb";
import { getIncludes, formatINR } from "@/lib/poojas";
import {
  getPoojaBySlug,
  getPoojaSlugs,
  getPanditsForPooja,
  getProducts,
} from "@/lib/queries";
import { panditTier } from "@/lib/pandit-tier";
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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pooja = await getPoojaBySlug(slug);
  if (!pooja) return { title: "Pooja not found" };
  return {
    title: `Book ${pooja.name} — Verified Pandit`,
    description: pooja.shortDescription,
  };
}

export default async function PoojaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pooja = await getPoojaBySlug(slug);
  if (!pooja) notFound();

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
    .slice()
    .sort((a, b) => {
      const ra = crossSellRank.indexOf(a.category ?? "");
      const rb = crossSellRank.indexOf(b.category ?? "");
      return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
    })
    .slice(0, 4);

  const includes = getIncludes(pooja);
  const longDescription =
    pooja.longDescription ??
    `${pooja.shortDescription} Our verified Pandits perform the ${pooja.name} ` +
      `with complete devotion and adherence to Vedic tradition, guiding your ` +
      `family through every ritual. The ceremony typically takes around ` +
      `${pooja.durationHours} hour${pooja.durationHours > 1 ? "s" : ""}.`;

  const faqs = poojaFaqs(pooja);
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href="/poojas" className="hover:text-saffron-700">
                Book a Pooja
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{pooja.name}</span>
            </nav>

            <div className="mt-4 flex items-start gap-4">
              <div className="text-5xl">{pooja.emoji}</div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-medium text-saffron-700">
                    {pooja.category}
                  </span>
                  {pooja.requiresMuhurat ? (
                    <span
                      className="rounded-full bg-gold-400 px-3 py-1 text-xs font-medium text-maroon-800"
                      title="This ceremony is performed at an auspicious muhurat — the Pandit will confirm the exact timing."
                    >
                      🕉️ Auspicious muhurat
                    </span>
                  ) : (
                    <span
                      className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                      title="Flexible timing — choose any available slot."
                    >
                      ✓ Flexible timing
                    </span>
                  )}
                </div>
                <h1 className="mt-2 font-heading text-4xl text-maroon-800">
                  {pooja.name}
                </h1>
                {pooja.sanskritName && (
                  <p className="mt-1 text-lg text-saffron-700">
                    {pooja.sanskritName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            {/* Left: details */}
            <div>
              <div className="flex flex-wrap gap-6 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm">
                <div>
                  <div className="text-xs text-foreground/65">
                    Starting price
                  </div>
                  <div className="font-heading text-2xl text-saffron-700">
                    {formatINR(pooja.startingPrice)}
                  </div>
                </div>
                <div className="border-l border-saffron-100 pl-6">
                  <div className="text-xs text-foreground/65">Duration</div>
                  <div className="font-heading text-2xl text-maroon-700">
                    ~{pooja.durationHours} hr
                  </div>
                </div>
                <div className="border-l border-saffron-100 pl-6">
                  <div className="text-xs text-foreground/65">Rating</div>
                  <div className="font-heading text-2xl text-maroon-700">
                    4.9 ★
                  </div>
                </div>
              </div>

              <h2 className="mt-8 font-heading text-2xl text-maroon-800">
                About this pooja
              </h2>
              <p className="mt-3 leading-relaxed text-foreground/75">
                {longDescription}
              </p>

              <h2 className="mt-8 font-heading text-2xl text-maroon-800">
                What&apos;s included
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

              <h2 className="mt-8 font-heading text-2xl text-maroon-800">
                Frequently asked questions
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

              <div className="mt-8 rounded-2xl border border-saffron-100 bg-cream-100/60 p-5">
                <h3 className="font-heading text-lg text-maroon-700">
                  Not sure which pooja you need?
                </h3>
                <p className="mt-1 text-sm text-foreground/65">
                  Our team can guide you to the right ceremony and the
                  auspicious muhurat.{" "}
                  <Link
                    href="/contact"
                    className="font-semibold text-saffron-700 hover:text-saffron-800"
                  >
                    Talk to us →
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
            <div className="mt-16">
              <h2 className="font-heading text-2xl text-maroon-800">
                Frequently bought together
              </h2>
              <p className="mt-1 text-sm text-foreground/65">
                Add the samagri you&apos;ll need for this pooja.
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
