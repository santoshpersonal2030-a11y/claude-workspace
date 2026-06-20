import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPanditBySlug, getPanditSlugs } from "@/lib/queries";

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

function initials(name: string) {
  return name
    .replace(/^(Pandit|Acharya)\s+/i, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function PanditDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pandit = await getPanditBySlug(slug);
  if (!pandit) notFound();

  const facts = [
    { label: "Experience", value: `${pandit.experienceYears}+ years` },
    { label: "Rating", value: `${pandit.rating.toFixed(1)} ★ (${pandit.reviewCount})` },
    { label: "Languages", value: pandit.languages.join(", ") },
    { label: "Serves", value: pandit.regions.join(", ") },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="hover:text-saffron-700">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href="/pandits" className="hover:text-saffron-700">
                Our Pandits
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{pandit.fullName}</span>
            </nav>

            <div className="mt-5 flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-saffron-100 font-heading text-2xl text-saffron-700">
                {initials(pandit.fullName)}
              </div>
              <div>
                <h1 className="font-heading text-3xl text-maroon-800">
                  {pandit.fullName}
                </h1>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <span className="text-gold-600">
                    ★ {pandit.rating.toFixed(1)}
                  </span>
                  <span className="text-foreground/45">
                    ({pandit.reviewCount} reviews)
                  </span>
                  {pandit.verified && (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <h2 className="font-heading text-2xl text-maroon-800">About</h2>
              <p className="mt-3 leading-relaxed text-foreground/75">
                {pandit.bio}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                {facts.map((f) => (
                  <div
                    key={f.label}
                    className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
                  >
                    <div className="text-xs text-foreground/50">{f.label}</div>
                    <div className="mt-1 font-medium text-maroon-700">
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-saffron-100 bg-cream-100/60 p-6 text-center shadow-sm">
                <h3 className="font-heading text-lg text-maroon-700">
                  Book a ceremony
                </h3>
                <p className="mt-2 text-sm text-foreground/65">
                  Choose your pooja and we&apos;ll assign {pandit.fullName} or
                  another verified priest for your date and location.
                </p>
                <Link
                  href="/poojas"
                  className="mt-5 block w-full rounded-full bg-saffron-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-saffron-700"
                >
                  Browse poojas
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
