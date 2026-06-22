import Link from "next/link";

import { CITY_COORDS, fullPanchanga } from "@/lib/muhurat-engine";

function to12h(mins: number): string {
  const t = Math.round(mins);
  let h = Math.floor(t / 60) % 24;
  const m = t % 60;
  const ap = h < 12 ? "AM" : "PM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

// Compact "today's panchang" strip for the homepage. Computed (New Delhi),
// always renders. Deep-links to the full per-date panchang page.
export default function TodayPanchang() {
  const today = todayIST();
  const coords = CITY_COORDS["New Delhi"];
  const pan = fullPanchanga(today, coords.lat, coords.lng);
  if (!pan) return null;

  const [y, m, d] = today.split("-").map(Number);
  const facts = [
    { label: "Tithi", value: pan.tithi.name },
    { label: "Nakshatra", value: pan.nakshatra.name },
    { label: "Abhijit", value: `${to12h(pan.abhijit.start)}–${to12h(pan.abhijit.end)}` },
    { label: "Rahu Kalam", value: `${to12h(pan.rahu.start)}–${to12h(pan.rahu.end)}` },
  ];

  return (
    <section className="border-y border-saffron-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗓️</span>
          <div>
            <div className="text-xs text-foreground/50">
              Today&apos;s Panchang · New Delhi
            </div>
            <div className="font-heading text-maroon-800">
              {pan.weekday}, {d} {MONTHS[m - 1]} {y}
            </div>
          </div>
        </div>
        <dl className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          {facts.map((f) => (
            <div key={f.label} className="flex items-baseline gap-1.5">
              <dt className="text-xs text-foreground/50">{f.label}</dt>
              <dd className="font-medium text-maroon-700">{f.value}</dd>
            </div>
          ))}
        </dl>
        <Link
          href={`/panchang/${today}`}
          className="ml-auto whitespace-nowrap text-sm font-semibold text-saffron-700 hover:text-saffron-800"
        >
          Full panchang →
        </Link>
      </div>
    </section>
  );
}
