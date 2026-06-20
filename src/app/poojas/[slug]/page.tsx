import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { getIncludes, formatINR } from "@/lib/poojas";
import { getPoojaBySlug, getPoojaSlugs, getPandits } from "@/lib/queries";

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

  const panditRoster = await getPandits();
  const pandits = panditRoster.map((p) => ({
    slug: p.slug,
    fullName: p.fullName,
    languages: p.languages,
  }));

  const includes = getIncludes(pooja);
  const longDescription =
    pooja.longDescription ??
    `${pooja.shortDescription} Our verified Pandits perform the ${pooja.name} ` +
      `with complete devotion and adherence to Vedic tradition, guiding your ` +
      `family through every ritual. The ceremony typically takes around ` +
      `${pooja.durationHours} hour${pooja.durationHours > 1 ? "s" : ""}.`;

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <nav className="text-sm text-foreground/60">
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
                <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-medium text-saffron-700">
                  {pooja.category}
                </span>
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
                  <div className="text-xs text-foreground/50">
                    Starting price
                  </div>
                  <div className="font-heading text-2xl text-saffron-700">
                    {formatINR(pooja.startingPrice)}
                  </div>
                </div>
                <div className="border-l border-saffron-100 pl-6">
                  <div className="text-xs text-foreground/50">Duration</div>
                  <div className="font-heading text-2xl text-maroon-700">
                    ~{pooja.durationHours} hr
                  </div>
                </div>
                <div className="border-l border-saffron-100 pl-6">
                  <div className="text-xs text-foreground/50">Rating</div>
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
              <BookingForm pooja={pooja} pandits={pandits} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
