import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoojaCard from "@/components/PoojaCard";
import PackageBookingForm from "@/components/PackageBookingForm";
import { lifeEvents, getLifeEvent } from "@/lib/ceremonies";
import { localizeLifeEvent } from "@/lib/ceremonies-i18n";
import { getPoojas } from "@/lib/queries";
import { localizePooja } from "@/lib/poojas-i18n";
import { formatINR, type Pooja } from "@/lib/poojas";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const revalidate = 300;

export function generateStaticParams() {
  return lifeEvents.map((e) => ({ event: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ event: string }>;
}): Promise<Metadata> {
  const { event } = await params;
  const e = getLifeEvent(event);
  if (!e) return { title: "Ceremony not found" };
  return { title: `${e.title} — Book a Pandit`, description: e.description };
}

export default async function LifeEventPage({
  params,
}: {
  params: Promise<{ locale: string; event: string }>;
}) {
  const { locale, event } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);
  const rawEvent = getLifeEvent(event);
  if (!rawEvent) notFound();
  const lifeEvent = localizeLifeEvent(rawEvent, loc);

  const poojas = (await getPoojas()).map((p) => localizePooja(p, loc));
  const bySlug = new Map(poojas.map((p) => [p.slug, p]));
  // Keep the curated order; drop any slug missing from the catalog.
  const ceremonies = lifeEvent.poojaSlugs
    .map((slug) => bySlug.get(slug))
    .filter((p): p is Pooja => Boolean(p));

  const packageTotal = ceremonies.reduce((s, p) => s + p.startingPrice, 0);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <Link href="/ceremonies" className="hover:text-saffron-700">
                {t("cer.crumb")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{lifeEvent.title}</span>
            </nav>
            <div className="mt-4 flex items-center gap-4">
              <span className="text-5xl">{lifeEvent.emoji}</span>
              <div>
                <h1 className="font-heading text-4xl text-maroon-800">
                  {lifeEvent.title}
                </h1>
                <p className="text-saffron-700">{lifeEvent.sanskrit}</p>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-lg text-foreground/70">
              {lifeEvent.description}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          {/* Marriage (or any package) summary banner */}
          {lifeEvent.isPackage && ceremonies.length > 0 && (
            <div className="mb-5 rounded-3xl border border-gold-200 bg-gradient-to-br from-cream-100/80 to-white p-7 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-heading text-2xl text-maroon-800">
                    {lifeEvent.packageName ?? t("cer.package")}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm text-foreground/70">
                    {lifeEvent.packageNote}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {ceremonies.map((p, i) => (
                      <span
                        key={p.slug}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm text-maroon-700 shadow-sm"
                      >
                        <span>{p.emoji}</span>
                        {p.name}
                        {i < ceremonies.length - 1 && (
                          <span className="ml-1 text-saffron-400">→</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-maroon-700 px-6 py-5 text-center text-white">
                  <div className="text-xs uppercase tracking-wide text-cream-100/80">
                    Full package from
                  </div>
                  <div className="mt-1 font-heading text-3xl">
                    {formatINR(packageTotal)}
                  </div>
                  <div className="mt-1 text-xs text-cream-100/70">
                    {ceremonies.length} ceremonies · book below
                  </div>
                </div>
              </div>

              <PackageBookingForm
                ceremonies={ceremonies.map((p) => ({
                  slug: p.slug,
                  name: p.name,
                  emoji: p.emoji,
                  price: p.startingPrice,
                }))}
                total={packageTotal}
              />
            </div>
          )}

          <h2 className="font-heading text-2xl text-maroon-800">
            {lifeEvent.isPackage ? t("cer.inPackage") : t("cer.crumb")}
          </h2>
          {ceremonies.length === 0 ? (
            <p className="mt-4 text-foreground/65">
              These ceremonies are being added — please check back soon.
            </p>
          ) : (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ceremonies.map((pooja) => (
                <PoojaCard key={pooja.slug} pooja={pooja} />
              ))}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-saffron-100 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-foreground/70">
              Not sure which ceremony you need, or planning something special?
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/muhurat"
                className="inline-block rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-saffron-800"
              >
                See auspicious dates
              </Link>
              <Link
                href="/contact"
                className="inline-block rounded-full border border-saffron-300 px-6 py-2.5 text-sm font-semibold text-saffron-700 transition-colors hover:bg-saffron-50"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
