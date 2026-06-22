import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
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

function to12h(mins: number): string {
  const t = Math.round(mins);
  let h = Math.floor(t / 60) % 24;
  const m = t % 60;
  const ap = h < 12 ? "AM" : "PM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

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

  const limbs = pan
    ? [
        { label: "Tithi", value: pan.tithi.name },
        { label: "Nakshatra", value: pan.nakshatra.name },
        { label: "Yoga", value: pan.yoga.name },
        { label: "Karana", value: pan.karana.name },
        { label: "Vaara", value: pan.weekday },
        { label: "Sun sign", value: pan.sunRashi },
      ]
    : [];

  const avoid = pan
    ? [
        { label: "Rahu Kalam", p: pan.rahu },
        { label: "Yamaganda", p: pan.yamaganda },
        { label: "Gulika Kalam", p: pan.gulika },
      ]
    : [];

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
            <div className="space-y-8">
              {/* Panch-anga */}
              <div>
                <h2 className="font-heading text-2xl text-maroon-800">
                  The five limbs (Panchang)
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {limbs.map((l) => (
                    <div
                      key={l.label}
                      className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
                    >
                      <div className="text-xs text-foreground/50">{l.label}</div>
                      <div className="mt-1 font-heading text-lg text-maroon-700">
                        {l.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Sun */}
                <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
                  <h3 className="font-heading text-lg text-maroon-700">Sun</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-foreground/60">Sunrise</dt>
                      <dd className="font-medium">{to12h(pan.sunrise)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-foreground/60">Sunset</dt>
                      <dd className="font-medium">{to12h(pan.sunset)}</dd>
                    </div>
                  </dl>
                </div>

                {/* Auspicious */}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
                  <h3 className="font-heading text-lg text-emerald-800">
                    Auspicious
                  </h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-foreground/60">Abhijit Muhurat</dt>
                      <dd className="font-medium text-emerald-800">
                        {to12h(pan.abhijit.start)} – {to12h(pan.abhijit.end)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Inauspicious */}
                <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5 shadow-sm">
                  <h3 className="font-heading text-lg text-red-800">
                    Inauspicious (avoid)
                  </h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    {avoid.map((a) => (
                      <div key={a.label} className="flex justify-between">
                        <dt className="text-foreground/60">{a.label}</dt>
                        <dd className="font-medium text-red-800">
                          {to12h(a.p.start)} – {to12h(a.p.end)}
                        </dd>
                      </div>
                    ))}
                    {pan.karana.isVishti && (
                      <p className="pt-1 text-xs text-red-700">
                        Vishti (Bhadra) karana today — avoid auspicious work.
                      </p>
                    )}
                  </dl>
                </div>
              </div>

              <p className="text-xs text-foreground/45">
                Times are computed for {city} (IST) from astronomical formulae and
                are indicative; for a ceremony muhurat our astrologers confirm the
                exact timing.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm">
                <Link
                  href="/muhurat"
                  className="rounded-full bg-saffron-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-700"
                >
                  See auspicious ceremony dates
                </Link>
                <Link
                  href="/poojas"
                  className="rounded-full border border-saffron-300 px-6 py-2.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
                >
                  Book a Pandit
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
