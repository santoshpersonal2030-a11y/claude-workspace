import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import TemplePujaBookingForm from "@/components/TemplePujaBookingForm";
import { templePujas, getTemplePuja } from "@/lib/temple-pujas";
import { localizeTemplePuja } from "@/lib/temple-i18n";
import { formatINR } from "@/lib/poojas";
import { SITE_URL, breadcrumbLd } from "@/lib/seo";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export function generateStaticParams() {
  return templePujas.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const puja = getTemplePuja(slug);
  if (!puja) return { title: "Puja not found" };
  return {
    title: `${puja.name} at ${puja.temple} — Online Temple Puja`,
    description: puja.shortDescription,
  };
}

export default async function TemplePujaDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);
  const raw = getTemplePuja(slug);
  if (!raw) notFound();
  const puja = localizeTemplePuja(raw, loc);

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: `${puja.name} at ${puja.temple}`,
        serviceType: "Temple e-puja",
        description: puja.longDescription ?? puja.shortDescription,
        url: `${SITE_URL}/temple-puja/${puja.slug}`,
        areaServed: "IN",
        provider: {
          "@type": "Organization",
          name: "BookMyPoojari",
          url: SITE_URL,
        },
        offers: {
          "@type": "Offer",
          price: puja.price,
          priceCurrency: "INR",
          url: `${SITE_URL}/temple-puja/${puja.slug}`,
        },
      },
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Temple Puja", path: "/temple-puja" },
        { name: puja.name, path: `/temple-puja/${puja.slug}` },
      ]),
    ],
  };

  return (
    <>
      <JsonLd data={ld} />
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/temple-puja" className="hover:text-saffron-700">
                {t("temple.crumb")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{puja.name}</span>
            </nav>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{puja.emoji}</span>
                <div>
                  <h1 className="font-heading text-3xl text-maroon-800">
                    {puja.name}
                  </h1>
                  <p className="text-sm font-medium text-saffron-700">
                    {puja.temple}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-saffron-50 px-3 py-1 text-saffron-800">
                  {puja.deity}
                </span>
                <span className="rounded-full bg-saffron-50 px-3 py-1 text-saffron-800">
                  {puja.category}
                </span>
                {puja.includesPrasad && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                    {t("temple.withPrasad")}
                  </span>
                )}
                <span className="rounded-full bg-saffron-50 px-3 py-1 font-semibold text-saffron-800">
                  {formatINR(puja.price)}
                </span>
              </div>

              <p className="mt-5 text-foreground/75 leading-relaxed">
                {puja.longDescription ?? puja.shortDescription}
              </p>

              {puja.includes && puja.includes.length > 0 && (
                <div className="mt-6">
                  <h2 className="font-heading text-lg text-maroon-700">
                    {t("temple.included")}
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {puja.includes.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-foreground/75"
                      >
                        <span className="mt-0.5 text-saffron-600">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <TemplePujaBookingForm puja={puja} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
