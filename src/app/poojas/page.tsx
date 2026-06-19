import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoojaList from "@/components/PoojaList";
import { poojas } from "@/lib/poojas";

export const metadata: Metadata = {
  title: "Book a Pooja — All Ceremonies",
  description:
    "Browse and book verified Pandits for Satyanarayan Katha, Griha Pravesh, Lakshmi Puja, Navagraha Shanti and more. Transparent pricing, your language, on time.",
};

export default function PoojasPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <nav className="text-sm text-foreground/60">
              <span>Home</span>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">Book a Pooja</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              Book a Pooja
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              Choose a ceremony and we&apos;ll arrange a verified, experienced
              Pandit — in your language, at your home, with authentic samagri.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <PoojaList poojas={poojas} />
        </section>
      </main>
      <Footer />
    </>
  );
}
