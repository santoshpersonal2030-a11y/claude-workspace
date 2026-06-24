import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import MuhuratCalendar from "@/components/MuhuratCalendar";
import { getApprovedMuhuratWindows } from "@/lib/muhurat-data";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.muhurat.title"), description: t("meta.muhurat.desc") };
}

// Approved windows change as the astrologer curates them; refresh hourly.
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookmypoojari.com";

export default async function MuhuratPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
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
          <JsonLd data={eventsLd} />
        )}
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{t("nav.muhurat")}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("muh.h1")}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              {t("muh.subtitle")}
            </p>
            <Link
              href="/panchang"
              className="mt-4 inline-block text-sm font-semibold text-saffron-700 hover:text-saffron-800"
            >
              {t("muh.checkPanchang")}
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          {windows.length === 0 ? (
            <div className="rounded-2xl border border-saffron-100 bg-white p-8 text-center shadow-sm">
              <div className="text-4xl">🗓️</div>
              <h2 className="mt-3 font-heading text-xl text-maroon-800">
                {t("muh.emptyTitle")}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-foreground/65">
                {t("muh.emptyText")}
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-block rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
              >
                {t("muh.askMuhurat")}
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
