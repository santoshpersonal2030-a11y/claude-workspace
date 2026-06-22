import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getApprovedMuhuratWindows, type AuspiciousDate } from "@/lib/muhurat-data";
import { tierFromScore } from "@/lib/muhurat-engine";

export const metadata: Metadata = {
  title: "Shubh Muhurat — Auspicious Dates",
  description:
    "Astrologer-verified auspicious muhurat dates and timings for weddings, Griha Pravesh and other ceremonies. Pick a shubh muhurat and book a verified Pandit.",
};

// Approved windows change as the astrologer curates them; refresh hourly.
export const revalidate = 3600;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const wd = new Date(`${date}T00:00:00Z`).getUTCDay();
  return { y, m, d, weekday: WEEKDAYS[wd], monthName: MONTHS[m - 1] };
}

// Customer-friendly phrasing for the computed tier (we show the word, not the raw score).
const TIER_LABEL: Record<string, string> = {
  Excellent: "Most auspicious",
  Good: "Auspicious",
  Fair: "Favourable",
};
const TIER_BADGE: Record<string, string> = {
  Excellent: "bg-emerald-100 text-emerald-800",
  Good: "bg-amber-100 text-amber-800",
  Fair: "bg-stone-100 text-stone-600",
};

export default async function MuhuratPage() {
  const windows = await getApprovedMuhuratWindows();

  // Group by "Month Year" preserving date order.
  const groups: { key: string; items: AuspiciousDate[] }[] = [];
  for (const w of windows) {
    const { monthName, y } = parts(w.date);
    const key = `${monthName} ${y}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(w);
    else groups.push({ key, items: [w] });
  }

  return (
    <>
      <Header />
      <main className="flex-1">
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
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          {groups.length === 0 ? (
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
            <div className="space-y-10">
              {groups.map((group) => (
                <div key={group.key}>
                  <h2 className="font-heading text-2xl text-maroon-800">
                    {group.key}
                  </h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((w) => {
                      const p = parts(w.date);
                      const tier =
                        w.qualityScore != null
                          ? tierFromScore(w.qualityScore)
                          : null;
                      return (
                        <div
                          key={w.id}
                          className="flex flex-col rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-heading text-2xl text-maroon-800">
                                {p.weekday}, {p.d}
                              </div>
                              <div className="text-xs text-foreground/55">
                                {p.monthName} {p.y}
                              </div>
                            </div>
                            {tier && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TIER_BADGE[tier]}`}
                              >
                                {TIER_LABEL[tier]}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 text-sm font-medium text-saffron-700">
                            🕉️ {w.label ?? "Auspicious muhurat"}
                          </div>
                          <div className="mt-1 text-sm text-foreground/70">
                            {w.ceremony} · {w.startTime}–{w.endTime}
                          </div>

                          <Link
                            href={w.poojaSlug ? `/poojas/${w.poojaSlug}` : "/ceremonies"}
                            className="mt-4 w-full rounded-full bg-saffron-600 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-saffron-700"
                          >
                            Book this muhurat
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
