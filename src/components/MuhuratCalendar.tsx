"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { tierFromScore } from "@/lib/muhurat-engine";
import type { AuspiciousDate, WindowAvailability } from "@/lib/muhurat-data";

const AVAIL_BADGE: Record<
  WindowAvailability["status"],
  { className: string; label: string }
> = {
  available: { className: "bg-emerald-100 text-emerald-800", label: "✓ Pandits available" },
  limited: { className: "bg-amber-100 text-amber-800", label: "Limited availability" },
  none: { className: "bg-stone-100 text-stone-600", label: "No priest yet — we’ll arrange" },
};

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

export default function MuhuratCalendar({
  windows,
}: {
  windows: AuspiciousDate[];
}) {
  const ceremonies = useMemo(
    () => Array.from(new Set(windows.map((w) => w.ceremony))).sort(),
    [windows],
  );
  const [ceremony, setCeremony] = useState<string>("All");

  // Priest-availability cross-check for a pincode (fetched on demand).
  const [pincode, setPincode] = useState("");
  const [availability, setAvailability] = useState<Record<
    string,
    WindowAvailability
  > | null>(null);
  const [checking, setChecking] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);

  async function checkAvailability(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[1-9][0-9]{5}$/.test(pincode)) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/muhurat-availability?pincode=${pincode}`);
      const data = (await res.json()) as {
        availability?: Record<string, WindowAvailability>;
      };
      setAvailability(data.availability ?? {});
    } catch {
      setAvailability({});
    } finally {
      setChecking(false);
    }
  }

  const visible = windows.filter((w) => {
    if (ceremony !== "All" && w.ceremony !== ceremony) return false;
    if (availableOnly && availability && availability[w.id]?.status === "none")
      return false;
    return true;
  });

  // Group by "Month Year", preserving date order.
  const groups: { key: string; items: AuspiciousDate[] }[] = [];
  for (const w of visible) {
    const { monthName, y } = parts(w.date);
    const key = `${monthName} ${y}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(w);
    else groups.push({ key, items: [w] });
  }

  const chip = (value: string, label: string) => (
    <button
      key={value}
      onClick={() => setCeremony(value)}
      className={
        "rounded-full px-4 py-1.5 text-sm font-medium transition-colors " +
        (ceremony === value
          ? "bg-saffron-600 text-white shadow-sm"
          : "border border-saffron-200 bg-white text-saffron-700 hover:bg-saffron-50")
      }
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Priest-availability check */}
      <form
        onSubmit={checkAvailability}
        className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
      >
        <label className="text-sm font-medium text-foreground/70">
          Your pincode
          <input
            value={pincode}
            onChange={(e) =>
              setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            placeholder="e.g. 411004"
            className="ml-2 w-32 rounded-full border border-saffron-200 bg-cream px-4 py-2 text-sm outline-none focus:border-saffron-400"
          />
        </label>
        <button
          type="submit"
          disabled={checking}
          className="rounded-full bg-saffron-600 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-700 disabled:opacity-60"
        >
          {checking ? "Checking…" : "Check priest availability"}
        </button>
        {availability && (
          <label className="flex items-center gap-2 text-sm text-foreground/70">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            Only dates with a priest near me
          </label>
        )}
      </form>

      {ceremonies.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {chip("All", "All ceremonies")}
          {ceremonies.map((c) => chip(c, c))}
        </div>
      )}

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
                  w.qualityScore != null ? tierFromScore(w.qualityScore) : null;
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

                    {availability && availability[w.id] && (
                      <div
                        className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          AVAIL_BADGE[availability[w.id].status].className
                        }`}
                        title={`${availability[w.id].count} priest(s) near ${pincode}`}
                      >
                        {AVAIL_BADGE[availability[w.id].status].label}
                      </div>
                    )}

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
    </>
  );
}
