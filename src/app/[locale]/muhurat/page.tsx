import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MuhuratCalendar from "@/components/MuhuratCalendar";
import { getApprovedMuhuratWindows } from "@/lib/muhurat-data";

export const metadata: Metadata = {
  title: "Shubh Muhurat — Auspicious Dates",
  description:
    "Astrologer-verified auspicious muhurat dates and timings for weddings, Griha Pravesh and other ceremonies. Pick a shubh muhurat and book a verified Pandit.",
};

// Approved windows change as the astrologer curates them; refresh hourly.
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookmypoojari.com";

export default async function MuhuratPage() {
  const windows = await getApprovedMuhuratWindows();

  // schema.org Event markup for the upcoming auspicious dates (capped).
  const eventsLd = {
    "@context": "https://schema.org",
    "@graph": windows.slice(0, 50).map((w) => ({
      "@type": "Event",
      name: `${w.label ?? "Auspicious Muhurat"} — ${w.ceremony}`,
      startDate: `${w.date}T${w.startTime}:00+05:30`,
      endDate: `${w.date}T${w.endTime}:00+05:30`,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: "At your venue",
        address: { "@type": "PostalAddress", addressCountry: "IN" },
      },
      organizer: {
        "@type": "Organization",
        name: "BookMyPoojari",
        url: SITE_URL,
      },
      url: w.poojaSlug ? `${SITE_URL}/poojas/${w.poojaSlug}` : `${SITE_URL}/muhurat`,
    })),
  };

  return (
    <>
      <Header />
      <main className="flex-1">
        {windows.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsLd) }}
          />
        )}
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="hover:text-saffron-700">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">Shubh Muhurat</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              Shubh Muhurat — Auspicious Dates
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              Hand-verified auspicious dates and timings for your ceremony, set
              by our astrologers as per the panchang. Choose a muhurat and we&apos;ll
              arrange a verified Pandit.
            </p>
            <Link
              href="/panchang"
              className="mt-4 inline-block text-sm font-semibold text-saffron-700 hover:text-saffron-800"
            >
              Check the panchang for any date →
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          {windows.length === 0 ? (
            <div className="rounded-2xl border border-saffron-100 bg-white p-8 text-center shadow-sm">
              <div className="text-4xl">🗓️</div>
              <h2 className="mt-3 font-heading text-xl text-maroon-800">
                Auspicious dates are being curated
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-foreground/65">
                Our astrologers are finalising the muhurat calendar. Meanwhile,
                tell us your ceremony and we&apos;ll suggest the next shubh muhurat
                for your family.
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-block rounded-full bg-saffron-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-700"
              >
                Ask for a muhurat
              </Link>
            </div>
          ) : (
            <MuhuratCalendar windows={windows} />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
