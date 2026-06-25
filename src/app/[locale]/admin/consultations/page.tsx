import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/poojas";
import { updateConsultation } from "@/app/[locale]/admin/actions";
import type { Database } from "@/lib/database.types";

type ConsultationStatus =
  Database["public"]["Enums"]["consultation_status"];

export const metadata = { title: "Consultations — Admin" };

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-sky-100 text-sky-800",
  cancelled: "bg-stone-200 text-stone-600",
};

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

export default async function AdminConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status ?? "confirmed";
  const admin = createAdminClient();

  let query = admin
    .from("consultation_bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (filter !== "all") {
    query = query.eq("status", filter as ConsultationStatus);
  }
  const [{ data: consults }, { data: pandits }] = await Promise.all([
    query,
    admin
      .from("pandits")
      .select("id, full_name")
      .eq("active", true)
      .order("full_name"),
  ]);

  const tabs = ["confirmed", "pending", "completed", "cancelled", "all"];

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Consultations</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Assign an astrologer, share the video link, and mark consultations
        complete. Paid consultations arrive as “confirmed”.
      </p>

      <div className="mt-4 flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/admin/consultations?status=${tab}`}
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

      {(consults ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-foreground/55">
          No {filter === "all" ? "" : filter} consultations.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {consults!.map((c) => (
            <form
              key={c.id}
              action={updateConsultation}
              className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
            >
              <input type="hidden" name="id" value={c.id} />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-lg text-maroon-700">
                    {c.service_name}
                  </h2>
                  <p className="mt-1 text-sm text-foreground/65">
                    {c.name} · {c.phone}
                    {c.email ? ` · ${c.email}` : ""}
                  </p>
                  <p className="text-sm text-foreground/65">
                    {c.mode === "video" ? "🎥 Video" : "📞 Phone"} ·{" "}
                    {c.preferred_date} · {c.preferred_time}
                  </p>
                  {(c.birth_date || c.birth_place) && (
                    <p className="mt-1 text-xs text-foreground/55">
                      Birth: {c.birth_date ?? "—"}
                      {c.birth_time ? ` ${c.birth_time}` : ""}
                      {c.birth_place ? ` · ${c.birth_place}` : ""}
                    </p>
                  )}
                  {c.notes && (
                    <p className="mt-2 rounded-lg bg-cream p-2 text-xs text-foreground/70">
                      {c.notes}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      STATUS_STYLE[c.status] ?? "bg-stone-100"
                    }`}
                  >
                    {c.status}
                  </span>
                  <p className="mt-2 font-heading text-lg text-saffron-700">
                    {formatINR(c.amount)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-saffron-50 pt-4 sm:grid-cols-3">
                <label className="text-xs text-foreground/65">
                  Astrologer
                  <select
                    name="assigned_pandit_id"
                    defaultValue={c.assigned_pandit_id ?? ""}
                    className="mt-1 w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm text-foreground outline-none focus:border-saffron-400"
                  >
                    <option value="">— Unassigned —</option>
                    {(pandits ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-foreground/65">
                  Status
                  <select
                    name="status"
                    defaultValue={c.status}
                    className="mt-1 w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm text-foreground outline-none focus:border-saffron-400"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-foreground/65">
                  Meeting link (video)
                  <input
                    name="meeting_link"
                    type="url"
                    defaultValue={c.meeting_link ?? ""}
                    placeholder="https://meet…"
                    className="mt-1 w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm text-foreground outline-none focus:border-saffron-400"
                  />
                </label>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <input
                  name="admin_notes"
                  defaultValue={c.admin_notes ?? ""}
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
