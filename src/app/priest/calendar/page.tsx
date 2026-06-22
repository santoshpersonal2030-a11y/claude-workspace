import Link from "next/link";

import { getPriestPandit } from "@/lib/priest";
import { acceptMyBooking, declineMyBooking } from "@/app/priest/actions";
import { createAdminClient } from "@/lib/supabase/admin";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_RE = /^\d{4}-\d{2}$/;

// Today's date in IST (fixed +05:30). Wrapped in a named helper so reading the
// clock doesn't trip the React-purity lint rule in the render body.
function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

// "YYYY-MM" for a year+month (1-based month), with wraparound.
function ym(year: number, month: number): string {
  const y = year + Math.floor((month - 1) / 12);
  const m = ((((month - 1) % 12) + 12) % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

type CalBooking = {
  id: string;
  booking_date: string;
  time_slot: string;
  status: string;
  priest_response: string;
  city: string | null;
  pincode: string | null;
  language: string | null;
  service_price: number;
  poojas: { name: string; emoji: string | null } | null;
};

const RESPONSE_BADGE: Record<string, string> = {
  accepted: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  declined: "bg-red-100 text-red-700",
};

export default async function PriestCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const pandit = (await getPriestPandit())!;
  const admin = createAdminClient();
  const today = todayIST();

  // Which month to show: ?m=YYYY-MM, else the current IST month.
  const { m } = await searchParams;
  const monthKey = m && MONTH_RE.test(m) ? m : today.slice(0, 7);
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = `${monthKey}-01`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDay = `${monthKey}-${String(daysInMonth).padStart(2, "0")}`;
  const leadingBlanks = new Date(`${firstDay}T00:00:00Z`).getUTCDay();

  // This priest's bookings for the visible month (server-filtered to own id).
  const { data: monthBookings } = await admin
    .from("bookings")
    .select(
      "id, booking_date, time_slot, status, priest_response, city, pincode, language, service_price, poojas(name, emoji)",
    )
    .eq("pandit_id", pandit.id)
    .gte("booking_date", firstDay)
    .lte("booking_date", lastDay)
    .order("booking_date", { ascending: true });

  // Bookings awaiting THIS priest's response (any upcoming date), so a pending
  // assignment is never missed just because it's in another month.
  const { data: pendingRows } = await admin
    .from("bookings")
    .select(
      "id, booking_date, time_slot, status, priest_response, city, pincode, language, service_price, poojas(name, emoji)",
    )
    .eq("pandit_id", pandit.id)
    .eq("priest_response", "pending")
    .gte("booking_date", today)
    .order("booking_date", { ascending: true });

  const byDay = new Map<number, CalBooking[]>();
  for (const b of (monthBookings ?? []) as CalBooking[]) {
    const day = Number(b.booking_date.slice(8, 10));
    const arr = byDay.get(day) ?? [];
    arr.push(b);
    byDay.set(day, arr);
  }

  const pending = (pendingRows ?? []) as CalBooking[];
  const cells = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">My calendar</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Ceremonies assigned to you. Accept the ones you can perform, or decline
        to send them back to the team for reassignment.
      </p>

      {/* Awaiting response */}
      {pending.length > 0 && (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <h2 className="font-heading text-lg text-maroon-800">
            Awaiting your response ({pending.length})
          </h2>
          <div className="mt-3 space-y-3">
            {pending.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-medium text-maroon-700">
                    {b.booking_date}
                  </span>
                  <span className="text-foreground/60">
                    {b.time_slot.slice(0, 5)}
                  </span>
                  <span className="font-semibold text-foreground/85">
                    {b.poojas?.emoji ? `${b.poojas.emoji} ` : ""}
                    {b.poojas?.name ?? "Pooja"}
                  </span>
                  <span className="text-sm text-foreground/55">
                    {b.city ?? ""} {b.pincode ?? ""}
                    {b.language ? ` · ${b.language}` : ""}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <form action={acceptMyBooking}>
                    <input type="hidden" name="booking_id" value={b.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      ✓ Accept
                    </button>
                  </form>
                  <form
                    action={declineMyBooking}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="booking_id" value={b.id} />
                    <input
                      name="reason"
                      placeholder="Reason (optional)"
                      className="w-44 rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-xs outline-none focus:border-saffron-400"
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-red-300 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      ✕ Decline
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Month navigation */}
      <div className="mt-8 flex items-center justify-between">
        <Link
          href={`/priest/calendar?m=${ym(year, month - 1)}`}
          className="rounded-full border border-saffron-200 px-3 py-1.5 text-sm text-foreground/70 hover:bg-saffron-50"
        >
          ← {MONTH_NAMES[(month + 10) % 12]}
        </Link>
        <h2 className="font-heading text-xl text-maroon-800">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <Link
          href={`/priest/calendar?m=${ym(year, month + 1)}`}
          className="rounded-full border border-saffron-200 px-3 py-1.5 text-sm text-foreground/70 hover:bg-saffron-50"
        >
          {MONTH_NAMES[month % 12]} →
        </Link>
      </div>

      {/* Month grid */}
      <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-saffron-100 bg-saffron-100 text-sm">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="bg-white px-2 py-2 text-center text-[11px] font-semibold text-foreground/55"
          >
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`b${i}`} className="min-h-24 bg-cream/40" />;
          }
          const dateStr = `${monthKey}-${String(day).padStart(2, "0")}`;
          const items = byDay.get(day) ?? [];
          const isToday = dateStr === today;
          return (
            <div key={day} className="min-h-24 bg-white p-1.5">
              <div
                className={`text-right text-[11px] ${
                  isToday
                    ? "font-bold text-saffron-700"
                    : "text-foreground/40"
                }`}
              >
                {day}
              </div>
              <div className="mt-0.5 space-y-1">
                {items.map((b) => (
                  <div
                    key={b.id}
                    className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                      RESPONSE_BADGE[b.priest_response] ??
                      "bg-stone-100 text-stone-700"
                    }`}
                    title={`${b.time_slot.slice(0, 5)} ${
                      b.poojas?.name ?? "Pooja"
                    } · ${b.priest_response}`}
                  >
                    {b.time_slot.slice(0, 5)} {b.poojas?.name ?? "Pooja"}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-foreground/55">
        <Legend className="bg-emerald-100 text-emerald-800" label="Accepted" />
        <Legend className="bg-amber-100 text-amber-800" label="Awaiting you" />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded ${className}`} />
      {label}
    </span>
  );
}
