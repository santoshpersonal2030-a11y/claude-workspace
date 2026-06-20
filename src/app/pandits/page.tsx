import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPandits } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Our Pandits — Verified Hindu Priests",
  description:
    "Meet our hand-verified Pandits and Poojaris — experienced, multilingual priests who perform ceremonies with devotion and authenticity.",
};

export const revalidate = 300;

function initials(name: string) {
  return name
    .replace(/^(Pandit|Acharya)\s+/i, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function PanditsPage() {
  const pandits = await getPandits();

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="hover:text-saffron-700">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">Our Pandits</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              Our Verified Pandits
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              Every priest on BookMyPoojari is personally verified for
              authenticity, scriptural knowledge and experience — so you can book
              with complete peace of mind.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pandits.map((pandit) => (
              <div
                key={pandit.slug}
                className="flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-saffron-100 font-heading text-lg text-saffron-700">
                    {initials(pandit.fullName)}
                  </div>
                  <div>
                    <Link
                      href={`/pandits/${pandit.slug}`}
                      className="font-heading text-lg text-maroon-700 hover:text-saffron-700"
                    >
                      {pandit.fullName}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-sm">
                      <span className="text-gold-600">
                        ★ {pandit.rating.toFixed(1)}
                      </span>
                      <span className="text-foreground/45">
                        ({pandit.reviewCount})
                      </span>
                      {pandit.verified && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-4 flex-1 text-sm text-foreground/65">
                  {pandit.bio}
                </p>

                <dl className="mt-4 space-y-1 text-xs text-foreground/60">
                  <div className="flex gap-2">
                    <dt className="font-medium text-foreground/50">
                      Experience
                    </dt>
                    <dd>{pandit.experienceYears}+ years</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium text-foreground/50">Languages</dt>
                    <dd>{pandit.languages.join(", ")}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium text-foreground/50">Serves</dt>
                    <dd>{pandit.regions.join(", ")}</dd>
                  </div>
                </dl>

                <Link
                  href="/poojas"
                  className="mt-5 w-full rounded-full bg-saffron-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-saffron-700"
                >
                  Book a Pooja
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
