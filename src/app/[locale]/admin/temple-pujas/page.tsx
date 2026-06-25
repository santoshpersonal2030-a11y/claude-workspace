import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/poojas";
import { updateTemplePuja } from "@/app/[locale]/admin/actions";
import type { Database } from "@/lib/database.types";

type TemplePujaStatus = Database["public"]["Enums"]["temple_puja_status"];

export const metadata = { title: "Temple Pujas — Admin" };

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  performed: "bg-sky-100 text-sky-800",
  shipped: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-stone-200 text-stone-600",
};

const STATUSES = [
  "pending",
  "confirmed",
  "performed",
  "shipped",
  "completed",
  "cancelled",
];

export default async function AdminTemplePujasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status ?? "confirmed";
  const admin = createAdminClient();

  let query = admin
    .from("temple_puja_bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (filter !== "all") {
    query = query.eq("status", filter as TemplePujaStatus);
  }
  const { data: pujas } = await query;

  const tabs = [
    "confirmed",
    "pending",
    "performed",
    "shipped",
    "completed",
    "cancelled",
    "all",
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Temple pujas</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Perform the puja in the devotee&apos;s name &amp; gotra, share the ritual
        video, and add prasad tracking. Paid bookings arrive as “confirmed”.
      </p>

      <div className="mt-4 flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/admin/temple-pujas?status=${tab}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              filter === tab
                ? "bg-saffron-700 text-white"
                : "border border-saffron-200 text-foreground/70 hover:bg-saffron-50"
            }`}
          >
            {tab}
          </Link>
        ))}
      </div>

      {(pujas ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-foreground/55">
          No {filter === "all" ? "" : filter} temple pujas.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {pujas!.map((p) => (
            <form
              key={p.id}
              action={updateTemplePuja}
              className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
            >
              <input type="hidden" name="id" value={p.id} />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-lg text-maroon-700">
                    {p.puja_name}
                  </h2>
                  <p className="text-sm font-medium text-saffron-700">
                    {p.temple_name}
                  </p>
                  <p className="mt-1 text-sm text-foreground/65">
                    {p.devotee_name}
                    {p.gotra ? ` · gotra ${p.gotra}` : ""} · {p.phone}
                    {p.email ? ` · ${p.email}` : ""}
                  </p>
                  {p.sankalp && (
                    <p className="mt-1 text-xs text-foreground/55">
                      Sankalp: {p.sankalp}
                    </p>
                  )}
                  {p.family_names && (
                    <p className="text-xs text-foreground/55">
                      Also include: {p.family_names}
                    </p>
                  )}
                  {p.preferred_date && (
                    <p className="text-xs text-foreground/55">
                      Preferred: {p.preferred_date}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      STATUS_STYLE[p.status] ?? "bg-stone-100"
                    }`}
                  >
                    {p.status}
                  </span>
                  <p className="mt-2 font-heading text-lg text-saffron-700">
                    {formatINR(p.amount)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-saffron-50 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-xs text-foreground/65">
                  Status
                  <select
                    name="status"
                    defaultValue={p.status}
                    className="mt-1 w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm text-foreground outline-none focus:border-saffron-400"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-foreground/65 lg:col-span-2">
                  Video URL
                  <input
                    name="video_url"
                    type="url"
                    defaultValue={p.video_url ?? ""}
                    placeholder="https://…"
                    className="mt-1 w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm text-foreground outline-none focus:border-saffron-400"
                  />
                </label>
                <label className="text-xs text-foreground/65">
                  Prasad carrier
                  <input
                    name="prasad_carrier"
                    defaultValue={p.prasad_carrier ?? ""}
                    placeholder="e.g. India Post"
                    className="mt-1 w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm text-foreground outline-none focus:border-saffron-400"
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  name="prasad_tracking"
                  defaultValue={p.prasad_tracking ?? ""}
                  placeholder="Prasad tracking number"
                  className="w-48 rounded-lg border border-saffron-200 bg-cream px-3 py-1.5 text-xs outline-none focus:border-saffron-400"
                />
                <input
                  name="admin_notes"
                  defaultValue={p.admin_notes ?? ""}
                  placeholder="Internal notes (optional)"
                  className="flex-1 rounded-lg border border-saffron-200 bg-cream px-3 py-1.5 text-xs outline-none focus:border-saffron-400"
                />
                <button
                  type="submit"
                  className="rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
                >
                  Save
                </button>
              </div>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
