import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/admin";
import { resolveBookingDispute } from "@/app/[locale]/admin/actions";

export const metadata = { title: "Disputes — Admin" };

const CATEGORY_LABEL: Record<string, string> = {
  no_show: "Pandit no-show",
  quality: "Service quality",
  payment: "Payment / billing",
  reschedule: "Reschedule issue",
  other: "Other",
};

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-100 text-amber-800",
  resolved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-stone-200 text-stone-600",
};

const inputClass =
  "rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireCapability("disputes");
  const { status } = await searchParams;
  const filter = status ?? "open";
  const admin = createAdminClient();

  let query = admin
    .from("booking_disputes")
    .select("*, bookings(booking_date, poojas(name))")
    .order("created_at", { ascending: false });
  if (filter !== "all") query = query.eq("status", filter);
  const { data: disputes } = await query;

  const tabs = ["open", "resolved", "rejected", "all"];

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Disputes</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Customer-raised issues on bookings. Resolve or reject with a note; for a
        goodwill refund use &ldquo;Refund as store credit&rdquo; on the order.
      </p>

      <div className="mt-4 flex gap-1">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/admin/disputes?status=${t}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              filter === t
                ? "bg-saffron-600 text-white"
                : "border border-saffron-200 text-foreground/70 hover:bg-saffron-50"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {(disputes ?? []).length === 0 ? (
        <p className="mt-8 text-sm text-foreground/55">No {filter === "all" ? "" : filter} disputes.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {disputes!.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-maroon-700">
                  {CATEGORY_LABEL[d.category] ?? d.category}
                </span>
                <span className="text-sm text-foreground/55">
                  {d.bookings?.poojas?.name ?? "Booking"}
                  {d.bookings?.booking_date
                    ? ` · ${new Date(d.bookings.booking_date).toLocaleDateString("en-IN")}`
                    : ""}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                    STATUS_STYLE[d.status] ?? "bg-stone-100"
                  }`}
                >
                  {d.status}
                </span>
                <Link
                  href={`/admin/bookings`}
                  className="ml-auto text-xs text-saffron-700 hover:underline"
                >
                  Booking #{d.booking_id.slice(0, 8)}
                </Link>
              </div>

              {d.details && (
                <p className="mt-2 rounded-lg bg-cream p-3 text-sm text-foreground/75">
                  {d.details}
                </p>
              )}
              {d.resolution_notes && (
                <p className="mt-2 text-xs text-foreground/55">
                  Resolution: {d.resolution_notes}
                </p>
              )}

              {d.status === "open" && (
                <form
                  action={resolveBookingDispute}
                  className="mt-3 flex flex-wrap items-center gap-2 border-t border-saffron-50 pt-3"
                >
                  <input type="hidden" name="id" value={d.id} />
                  <input
                    name="resolution_notes"
                    placeholder="Resolution note"
                    className={`${inputClass} min-w-56 flex-1`}
                  />
                  <button
                    type="submit"
                    name="status"
                    value="resolved"
                    className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Mark resolved
                  </button>
                  <button
                    type="submit"
                    name="status"
                    value="rejected"
                    className="rounded-full border border-stone-200 px-4 py-1.5 text-sm text-foreground/60 hover:border-red-300 hover:text-red-600"
                  >
                    Reject
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
