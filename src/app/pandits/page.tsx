import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PanditDirectory from "@/components/PanditDirectory";
import { getPandits } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Our Pandits — Verified Hindu Priests",
  description:
    "Meet our hand-verified Pandits and Poojaris — experienced, multilingual priests who perform ceremonies with devotion and authenticity.",
};

export const revalidate = 300;

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
          <PanditDirectory pandits={pandits} />
        </section>
      </main>
      <Footer />
    </>
  );
}
