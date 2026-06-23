import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PanchangView from "@/components/PanchangView";
import { CITY_COORDS, fullPanchanga } from "@/lib/muhurat-engine";

export const metadata: Metadata = {
  title: "Panchang — Tithi, Nakshatra, Muhurat & Rahu Kalam",
  description:
    "Daily Hindu panchang for any date and city: tithi, nakshatra, yoga, karana, sunrise/sunset, the auspicious Abhijit Muhurat, and Rahu Kalam / Yamaganda / Gulika to avoid.",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function PanchangPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; city?: string }>;
}) {
  const sp = await searchParams;
  const date = sp.date && DATE_RE.test(sp.date) ? sp.date : todayIST();
  const cities = Object.keys(CITY_COORDS);
  const city = sp.city && cities.includes(sp.city) ? sp.city : "New Delhi";
  const coords = CITY_COORDS[city];

  const pan = fullPanchanga(date, coords.lat, coords.lng);
  const [y, m, d] = date.split("-").map(Number);
  const prettyDate = `${d} ${MONTHS[m - 1]} ${y}`;

  const inputClass =
    "rounded-lg border border-saffron-200 bg-white px-3 py-2 text-sm outline-none focus:border-saffron-400";

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
              <span className="text-saffron-700">Panchang</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              Panchang
            </h1>
            <p className="mt-2 text-lg text-foreground/70">
              {pan ? `${pan.weekday}, ${prettyDate} · ${city}` : prettyDate}
            </p>

            {/* Date + city picker (no JS needed) */}
            <form method="get" className="mt-5 flex flex-wrap items-end gap-3">
              <label className="text-xs text-foreground/60">
                Date
                <input
                  type="date"
                  name="date"
                  defaultValue={date}
                  className={`block ${inputClass}`}
                />
              </label>
              <label className="text-xs text-foreground/60">
                City
                <select name="city" defaultValue={city} className={`block ${inputClass}`}>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded-full bg-saffron-600 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-700"
              >
                Show panchang
              </button>
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          {!pan ? (
            <p className="text-foreground/60">
              Couldn&apos;t compute the panchang for that date. Please try another.
            </p>
          ) : (
            <PanchangView pan={pan} city={city} />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
