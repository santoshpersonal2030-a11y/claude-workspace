import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { popularPoojas, formatINR } from "@/lib/poojas";

const trustStats = [
  { value: "500+", label: "Verified Pandits" },
  { value: "50,000+", label: "Poojas Performed" },
  { value: "4.9★", label: "Average Rating" },
  { value: "20+", label: "Languages" },
];

const steps = [
  {
    icon: "📿",
    title: "Choose your pooja",
    text: "Pick the ceremony you need and tell us your date, time and location.",
  },
  {
    icon: "🧑🏽‍🦱",
    title: "We match a Pandit",
    text: "A verified, experienced Pandit who speaks your language is assigned to you.",
  },
  {
    icon: "🛍️",
    title: "Samagri delivered",
    text: "Order an authentic samagri kit and we deliver everything needed to your door.",
  },
  {
    icon: "🙏",
    title: "Pooja, done right",
    text: "Relax while the rituals are performed traditionally and on time.",
  },
];

const reasons = [
  {
    icon: "✅",
    title: "Verified & experienced",
    text: "Every Pandit is background-checked, knowledgeable and rated by real families.",
  },
  {
    icon: "💰",
    title: "Transparent pricing",
    text: "Clear, upfront dakshina and samagri prices. No haggling, no surprises.",
  },
  {
    icon: "🗣️",
    title: "Your language, your tradition",
    text: "Pandits across regions and languages who respect your family's customs.",
  },
  {
    icon: "📦",
    title: "Everything in one place",
    text: "Book the priest and order the samagri kit together — fully arranged for you.",
  },
];

export default function Home() {
  return (
    <>
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-temple-gradient">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-saffron-200 bg-saffron-50 px-4 py-1.5 text-sm font-medium text-saffron-700">
                🪔 Verified Pandits • Authentic Samagri
              </span>
              <h1 className="mt-5 text-balance font-heading text-4xl leading-tight text-maroon-800 sm:text-5xl">
                Book a trusted Pandit for every sacred occasion
              </h1>
              <p className="mt-5 max-w-lg text-lg text-foreground/75">
                From Griha Pravesh to Satyanarayan Katha — experienced, verified
                Poojaris at your home, with authentic samagri kits delivered to
                your door.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/poojas"
                  className="rounded-full bg-saffron-600 px-7 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700"
                >
                  Book a Pooja
                </Link>
                <Link
                  href="/store"
                  className="rounded-full border border-saffron-300 bg-white px-7 py-3 text-base font-semibold text-saffron-700 transition-colors hover:bg-saffron-50"
                >
                  Shop Samagri
                </Link>
              </div>
              <p className="mt-4 text-sm text-foreground/60">
                ⭐ Rated 4.9/5 by thousands of families across India
              </p>
            </div>

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
                      <div className="mt-1 text-xs text-foreground/60">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular poojas */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-3xl text-maroon-800">
                Popular Poojas
              </h2>
              <p className="mt-2 text-foreground/70">
                Our most-booked ceremonies, performed by verified Pandits.
              </p>
            </div>
            <Link
              href="/poojas"
              className="hidden whitespace-nowrap text-sm font-semibold text-saffron-700 hover:text-saffron-800 sm:block"
            >
              View all poojas →
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
                  <span className="text-sm text-foreground/60">
                    Starts at{" "}
                    <span className="font-semibold text-foreground">
                      {formatINR(pooja.startingPrice)}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-saffron-700 group-hover:translate-x-0.5">
                    Book →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-cream-100/60 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center font-heading text-3xl text-maroon-800">
              How it works
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-foreground/70">
              A peaceful, hassle-free experience from booking to blessings.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <div key={step.title} className="relative text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm ring-1 ring-saffron-100">
                    {step.icon}
                  </div>
                  <div className="mt-3 font-heading text-sm text-saffron-700">
                    Step {i + 1}
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
            Why families trust BookMyPoojari
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

        {/* Samagri store teaser */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-saffron-600 px-8 py-12 text-center shadow-lg sm:px-12">
            <div className="text-5xl">🛍️</div>
            <h2 className="mt-4 font-heading text-3xl text-white">
              Authentic Pooja Samagri, delivered
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-saffron-50">
              Ready-made kits with everything you need — diyas, agarbatti,
              roli, kalava, idols and more — sourced fresh and delivered to your
              home.
            </p>
            <Link
              href="/store"
              className="mt-6 inline-block rounded-full bg-white px-7 py-3 text-base font-semibold text-saffron-700 transition-colors hover:bg-saffron-50"
            >
              Visit the Samagri Store
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <h2 className="font-heading text-3xl text-maroon-800">
              Ready to book your pooja?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-foreground/70">
              Tell us the occasion and we&apos;ll take care of the rest — the
              Pandit, the rituals and the samagri.
            </p>
            <Link
              href="/poojas"
              className="mt-7 inline-block rounded-full bg-saffron-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700"
            >
              Book a Pooja Now
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
