import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  assignPandit,
  bulkGenerateEInvoicesAction,
  confirmBookingTime,
  nudgePriest,
  updateBookingStatus,
  updateOrderStatus,
} from "@/app/[locale]/admin/actions";
import { Constants } from "@/lib/database.types";
import { CARRIERS } from "@/lib/carriers";
import EwbValidity from "@/components/EwbValidity";
import { formatINR } from "@/lib/poojas";
import { nudgeState } from "@/lib/nudge";

const selectClass =
  "rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatConfirmedTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ presp?: string }>;
}) {
  const { presp } = await searchParams;
  const admin = createAdminClient();
  const [bookings, orders, roster] = await Promise.all([
    admin
      .from("bookings")
      // Two FKs point at pandits, so disambiguate with explicit constraint hints.
      .select(
        "id, booking_date, time_slot, starts_at, status, priest_response, decline_reason, last_nudged_at, total_amount, city, pandit_id, poojas(name), preferred:pandits!bookings_preferred_pandit_id_fkey(full_name), assigned:pandits!bookings_pandit_id_fkey(full_name), declined_by:pandits!bookings_declined_by_pandit_id_fkey(full_name)",
      )
      .order("created_at", { ascending: false }),
    admin
      .from("orders")
      .select(
        "id, status, total_amount, created_at, delivery_name, delivery_phone, tracking_number, estimated_delivery, carrier, ewb_no, ewb_valid_until, order_items(product_name, quantity)",
      )
      .order("created_at", { ascending: false }),
    admin
      .from("pandits")
      .select("id, full_name")
      .eq("active", true)
      .order("full_name", { ascending: true }),
  ]);

  const pandits = roster.data ?? [];

  const bookingStatuses = Constants.public.Enums.booking_status;
  const orderStatuses = Constants.public.Enums.order_status;

  // Priest-response triage: awaiting the assigned priest, accepted, or declined
  // and now unassigned (needs reassignment).
  type Resp = "awaiting" | "accepted" | "proposed" | "reassign" | "other";
  const respState = (b: {
    pandit_id: string | null;
    priest_response: string;
    declined_by: { full_name: string } | null;
  }): Resp => {
    if (b.pandit_id && b.priest_response === "pending") return "awaiting";
    if (b.pandit_id && b.priest_response === "accepted") return "accepted";
    if (b.pandit_id && b.priest_response === "proposed") return "proposed";
    if (!b.pandit_id && b.declined_by?.full_name) return "reassign";
    return "other";
  };
  const allBookings = bookings.data ?? [];
  const counts = { awaiting: 0, accepted: 0, proposed: 0, reassign: 0 };
  for (const b of allBookings) {
    const s = respState(b);
    if (s !== "other") counts[s] += 1;
  }
  const RESP_FILTERS = ["awaiting", "accepted", "proposed", "reassign"] as const;
  const activeResp = (RESP_FILTERS as readonly string[]).includes(presp ?? "")
    ? (presp as Resp)
    : null;
  const shownBookings = activeResp
    ? allBookings.filter((b) => respState(b) === activeResp)
    : allBookings;

  const respChips: { key: string | null; label: string }[] = [
    { key: null, label: `All (${allBookings.length})` },
    { key: "awaiting", label: `⏳ Awaiting (${counts.awaiting})` },
    { key: "accepted", label: `✓ Accepted (${counts.accepted})` },
    { key: "proposed", label: `💬 Proposed (${counts.proposed})` },
    { key: "reassign", label: `✕ Needs reassign (${counts.reassign})` },
  ];

  return (
    <div className="space-y-10">
      {/* Bookings */}
      <section>
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl text-maroon-800">Bookings</h1>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler download, not a page */}
          <a
            href="/api/admin/export/bookings"
            className="rounded-full border border-saffron-300 px-4 py-1.5 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
          >
            ⬇ Export CSV
          </a>
        </div>

        {/* Priest-response triage filter */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {respChips.map((c) => (
            <Link
              key={c.label}
              href={c.key ? `/admin/bookings?presp=${c.key}` : "/admin/bookings"}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                activeResp === c.key || (!activeResp && c.key === null)
                  ? "bg-maroon-700 text-white"
                  : "border border-stone-200 text-foreground/65 hover:bg-stone-50"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {shownBookings.length ? (
            shownBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-saffron-100 bg-white p-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-48 flex-1">
                    <div className="font-medium text-maroon-700">
                      {b.poojas?.name ?? "Pooja"}
                    </div>
                    <div className="text-xs text-foreground/65">
                      {formatDate(b.booking_date)} · {b.time_slot}
                      {b.city ? ` · ${b.city}` : ""}
                      {b.preferred?.full_name
                        ? ` · prefers ${b.preferred.full_name}`
                        : ""}
                      {b.assigned?.full_name
                        ? ` · assigned ${b.assigned.full_name}`
                        : ""}
                      {b.starts_at
                        ? ` · ⏰ confirmed ${formatConfirmedTime(b.starts_at)}`
                        : ""}
                    </div>
                    {b.pandit_id && b.priest_response === "proposed" && (
                      <div className="text-xs font-medium text-sky-700">
                        💬 {b.assigned?.full_name ?? "Priest"} proposed a new
                        time — review
                      </div>
                    )}
                    {b.pandit_id && b.priest_response === "accepted" && (
                      <div className="text-xs font-medium text-emerald-700">
                        ✓ Accepted by {b.assigned?.full_name ?? "priest"}
                      </div>
                    )}
                    {b.pandit_id &&
                      b.priest_response === "pending" &&
                      (() => {
                        const { canNudge, agoLabel } = nudgeState(
                          b.last_nudged_at,
                        );
                        return (
                          <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
                            <span>
                              ⏳ Awaiting {b.assigned?.full_name ?? "priest"}
                              &apos;s response
                            </span>
                            {canNudge ? (
                              <form action={nudgePriest}>
                                <input type="hidden" name="id" value={b.id} />
                                <button
                                  type="submit"
                                  className="rounded-full border border-saffron-300 px-2 py-0.5 text-[11px] font-semibold text-saffron-700 hover:bg-saffron-50"
                                  title="Re-send the accept/decline request"
                                >
                                  🔔 Nudge
                                </button>
                              </form>
                            ) : (
                              <span className="text-[11px] font-normal text-foreground/65">
                                nudged {agoLabel}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    {!b.pandit_id && b.declined_by?.full_name && (
                      <div className="text-xs font-medium text-red-600">
                        ✕ Declined by {b.declined_by.full_name} — reassign
                        {b.decline_reason ? ` · "${b.decline_reason}"` : ""}
                      </div>
                    )}
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="text-xs font-semibold text-saffron-700 hover:text-saffron-800"
                    >
                      Edit details →
                    </Link>
                  </div>
                  <div className="font-medium text-saffron-700">
                    {formatINR(b.total_amount)}
                  </div>
                  <form action={updateBookingStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={b.id} />
                    <select
                      name="status"
                      defaultValue={b.status}
                      className={selectClass}
                    >
                      {bookingStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-full bg-saffron-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-saffron-800"
                    >
                      Update
                    </button>
                  </form>
                </div>

                {/* Assign the actual pandit */}
                <form
                  action={assignPandit}
                  className="mt-2 flex items-center gap-2 border-t border-saffron-50 pt-2"
                >
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="current_status" value={b.status} />
                  <span className="text-xs font-medium text-foreground/65">
                    Assign Pandit
                  </span>
                  <select
                    name="pandit_id"
                    defaultValue={b.pandit_id ?? ""}
                    className={selectClass}
                  >
                    <option value="">— Unassigned —</option>
                    {pandits.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-full border border-saffron-300 px-4 py-1.5 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
                  >
                    Assign
                  </button>
                </form>

                {/* Confirm the agreed time (e.g. muhurat) — anchors the slot so
                    it blocks the priest's calendar and engages the overlap guard. */}
                <form
                  action={confirmBookingTime}
                  className="mt-2 flex flex-wrap items-center gap-2 border-t border-saffron-50 pt-2"
                >
                  <input type="hidden" name="id" value={b.id} />
                  <span className="text-xs font-medium text-foreground/65">
                    Confirm time
                  </span>
                  <select
                    name="pandit_id"
                    defaultValue={b.pandit_id ?? ""}
                    required
                    className={selectClass}
                  >
                    <option value="" disabled>
                      — Pandit —
                    </option>
                    {pandits.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    name="confirm_date"
                    defaultValue={b.booking_date}
                    required
                    className={selectClass}
                  />
                  <input
                    type="time"
                    name="confirm_time"
                    required
                    className={selectClass}
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-saffron-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-saffron-800"
                  >
                    Confirm
                  </button>
                </form>
              </div>
            ))
          ) : (
            <p className="text-sm text-foreground/65">
              {activeResp ? "No bookings in this state." : "No bookings yet."}
            </p>
          )}
        </div>
      </section>

      {/* Orders */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl text-maroon-800">Orders</h2>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler download, not a page */}
          <a
            href="/api/admin/export/orders"
            className="rounded-full border border-saffron-300 px-4 py-1.5 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
          >
            ⬇ Export CSV
          </a>
        </div>

        {/* Bulk e-invoice/EWB toolbar. Checkboxes in the rows below are
            associated with this form via their `form` attribute, so they post
            here rather than with each row's status form. */}
        <form
          id="bulk-orders"
          action={bulkGenerateEInvoicesAction}
          className="mt-4 flex items-center gap-3 rounded-xl border border-saffron-100 bg-saffron-50/40 px-3 py-2"
        >
          <span className="text-xs text-foreground/65">
            Select orders, then:
          </span>
          <button
            type="submit"
            className="rounded-full bg-maroon-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-maroon-800"
          >
            Generate e-invoice + e-way bill for selected
          </button>
        </form>

        <div className="mt-4 space-y-3">
          {orders.data?.length ? (
            orders.data.map((o) => (
              <form
                key={o.id}
                action={updateOrderStatus}
                className="rounded-xl border border-saffron-100 bg-white p-3 shadow-sm"
              >
                <input type="hidden" name="id" value={o.id} />
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="checkbox"
                    form="bulk-orders"
                    name="order_ids"
                    value={o.id}
                    aria-label="Select order for bulk action"
                    className="h-4 w-4 accent-maroon-700"
                  />
                  <div className="min-w-48 flex-1">
                    <div className="font-medium text-maroon-700">
                      {o.delivery_name ?? "Customer"}
                      {o.delivery_phone ? (
                        <span className="ml-2 text-xs text-foreground/65">
                          {o.delivery_phone}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-foreground/65">
                      {formatDate(o.created_at)} ·{" "}
                      {o.order_items
                        .map((i) => `${i.product_name} ×${i.quantity}`)
                        .join(", ")}
                    </div>
                  </div>
                  <div className="font-medium text-saffron-700">
                    {formatINR(o.total_amount)}
                  </div>
                  {o.ewb_no && o.ewb_valid_until && (
                    <EwbValidity validUntil={o.ewb_valid_until} />
                  )}
                  <select
                    name="status"
                    defaultValue={o.status}
                    className={selectClass}
                  >
                    {orderStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-full bg-saffron-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-saffron-800"
                  >
                    Update
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-saffron-50 pt-2 text-xs text-foreground/65">
                  <select
                    name="carrier"
                    defaultValue={o.carrier ?? ""}
                    className={selectClass}
                  >
                    <option value="">Carrier…</option>
                    {CARRIERS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="tracking_number"
                    defaultValue={o.tracking_number ?? ""}
                    placeholder="Tracking no."
                    className={selectClass}
                  />
                  <span>ETA</span>
                  <input
                    name="estimated_delivery"
                    type="date"
                    defaultValue={o.estimated_delivery ?? ""}
                    className={selectClass}
                  />
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="ml-auto font-semibold text-saffron-700 hover:text-saffron-800"
                  >
                    Details →
                  </Link>
                </div>
              </form>
            ))
          ) : (
            <p className="text-sm text-foreground/65">No orders yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
