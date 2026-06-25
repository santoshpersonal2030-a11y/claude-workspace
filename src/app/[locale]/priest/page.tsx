import Link from "next/link";

import { getPriestPandit } from "@/lib/priest";
import { createAdminClient } from "@/lib/supabase/admin";
import { panditTierInfo } from "@/lib/pandit-tier";
import { formatINR } from "@/lib/poojas";

const STATUS_BADGE: Record<string, string> = {
  confirmed: "bg-sky-100 text-sky-800",
  assigned: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  pending: "bg-stone-100 text-stone-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function PriestDashboard() {
  const pandit = (await getPriestPandit())!;
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  // Bookings assigned to this priest (server-filtered to their own id).
  const { data: bookings } = await admin
    .from("bookings")
    .select(
      "id, booking_date, time_slot, status, priest_response, city, pincode, service_price, total_amount, language, poojas(name)",
    )
    .eq("pandit_id", pandit.id)
    .order("booking_date", { ascending: true });

  const all = bookings ?? [];
  const upcoming = all.filter(
    (b) => b.booking_date >= today && b.status !== "cancelled",
  );
  const awaiting = upcoming.filter((b) => b.priest_response === "pending");
  const past = all.filter(
    (b) => b.booking_date < today || b.status === "completed",
  );
  const tier = panditTierInfo(pandit.experience_years ?? 0);

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">
        Namaste, {pandit.full_name}
      </h1>
      <p className="mt-1 text-sm text-foreground/65">
        {tier.tier} · {pandit.experience_years ?? 0} years · Home pincode{" "}
        {pandit.home_pincode ?? "—"}
      </p>

      {awaiting.length > 0 && (
        <Link
          href="/priest/calendar"
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm hover:bg-amber-100"
        >
          <span className="font-medium text-maroon-800">
            {awaiting.length} booking{awaiting.length === 1 ? "" : "s"} awaiting
            your accept / decline
          </span>
          <span className="font-semibold text-saffron-700">Review →</span>
        </Link>
      )}

      {/* Quick stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Upcoming" value={upcoming.length} />
        <Stat
          label="Completed"
          value={all.filter((b) => b.status === "completed").length}
        />
        <Stat label="Total assigned" value={all.length} />
      </div>

      <h2 className="mt-6 font-heading text-xl text-maroon-800">
        Upcoming ceremonies
      </h2>
      {upcoming.length === 0 ? (
        <p className="mt-3 text-sm text-foreground/65">
          No upcoming bookings assigned yet.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {upcoming.map((b) => (
            <BookingRow key={b.id} b={b} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mt-6 font-heading text-xl text-maroon-800">History</h2>
          <div className="mt-3 space-y-2">
            {past.slice(0, 20).map((b) => (
              <BookingRow key={b.id} b={b} muted />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm">
      <div className="font-heading text-2xl text-maroon-700">{value}</div>
      <div className="text-xs text-foreground/65">{label}</div>
    </div>
  );
}

type BookingLite = {
  id: string;
  booking_date: string;
  time_slot: string;
  status: string;
  city: string | null;
  pincode: string | null;
  service_price: number;
  total_amount: number;
  language: string | null;
  poojas: { name: string } | null;
};

function BookingRow({ b, muted }: { b: BookingLite; muted?: boolean }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-saffron-100 bg-white p-3 text-sm shadow-sm ${
        muted ? "opacity-75" : ""
      }`}
    >
      <span className="font-medium text-maroon-700">{b.booking_date}</span>
      <span className="text-foreground/65">{b.time_slot}</span>
      <span className="font-medium text-foreground/80">
        {b.poojas?.name ?? "Pooja"}
      </span>
      <span className="text-foreground/65">
        {b.city ?? ""} {b.pincode ?? ""}
      </span>
      {b.language && (
        <span className="text-xs text-foreground/65">· {b.language}</span>
      )}
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          STATUS_BADGE[b.status] ?? "bg-stone-100 text-stone-700"
        }`}
      >
        {b.status}
      </span>
      <span className="ml-auto font-medium text-foreground/70">
        {formatINR(b.service_price)}
      </span>
    </div>
  );
}
