import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "BookMyPoojari connects families with verified Hindu priests and authentic pooja samagri, making it easy to perform ceremonies the right way.",
};

const values = [
  {
    title: "Authenticity",
    body: "Every Pandit is verified for scriptural knowledge and experience, and rituals are performed as per Vedic tradition.",
  },
  {
    title: "Convenience",
    body: "Book a ceremony and order samagri in minutes — we handle the coordination so you can focus on the occasion.",
  },
  {
    title: "Trust",
    body: "Transparent pricing, secure payments, and a quality promise on every booking and order.",
  },
];

export default function AboutPage() {
  return (
    <ContentPage
      title="About BookMyPoojari"
      intro="Devotion, delivered — making authentic Hindu ceremonies accessible to every family."
    >
      <div className="space-y-4 text-foreground/75 leading-relaxed">
        <p>
          BookMyPoojari was founded on a simple idea: finding a trustworthy,
          knowledgeable priest for an important ceremony should not be stressful.
          Families often spend days asking around for a Pandit, negotiating
          dakshina, and then separately running around to gather samagri.
        </p>
        <p>
          We bring it all together in one place. Choose from a curated catalog
          of poojas, book a verified Pandit for your date and language, and add a
          ready-made samagri kit — all online, with secure payment and a clear
          receipt.
        </p>
        <p>
          Our mission is to preserve the authenticity of tradition while making
          it effortless to honour it, wherever you are.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {values.map((v) => (
          <div
            key={v.title}
            className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
          >
            <h2 className="font-heading text-lg text-maroon-700">{v.title}</h2>
            <p className="mt-2 text-sm text-foreground/65">{v.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/pandits"
          className="rounded-full bg-saffron-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-700"
        >
          Meet our Pandits
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-saffron-300 px-6 py-2.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
        >
          Get in touch
        </Link>
      </div>
    </ContentPage>
  );
}
