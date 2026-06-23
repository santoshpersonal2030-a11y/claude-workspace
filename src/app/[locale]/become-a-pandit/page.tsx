import type { Metadata } from "next";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PanditApplicationForm from "@/components/PanditApplicationForm";

export const metadata: Metadata = {
  title: "Become a Pandit — Join BookMyPoojari",
  description:
    "Are you a qualified Pandit or Poojari? Join BookMyPoojari to receive verified ceremony bookings, grow your practice and get paid on time.",
  alternates: { canonical: "/become-a-pandit" },
};

const PERKS = [
  { emoji: "📅", title: "Steady bookings", body: "Receive ceremony requests that match your skills and area." },
  { emoji: "✅", title: "Verified profile", body: "A trusted, verified listing that devotees can find and book." },
  { emoji: "💸", title: "On-time payouts", body: "Transparent dakshina and timely settlement after every ceremony." },
];

export default function BecomeAPanditPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-saffron-700">
            For priests
          </p>
          <h1 className="mt-1 font-heading text-3xl text-maroon-800 sm:text-4xl">
            Join BookMyPoojari as a verified Pandit
          </h1>
          <p className="mt-3 text-foreground/70">
            Share your details and qualifications below. After a quick
            verification, your profile goes live and you start receiving
            ceremony bookings near you.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PERKS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
              >
                <div className="text-2xl">{p.emoji}</div>
                <h3 className="mt-2 font-medium text-maroon-700">{p.title}</h3>
                <p className="mt-1 text-sm text-foreground/60">{p.body}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-10 font-heading text-2xl text-maroon-800">
            Apply now
          </h2>
          <div className="mt-4">
            <PanditApplicationForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
