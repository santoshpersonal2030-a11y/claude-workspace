import Link from "next/link";
import { notFound } from "next/navigation";

import {
  updateBookingDetails,
  nudgePriest,
  acceptProposal,
  refundBookingToCredit,
} from "@/app/[locale]/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { Constants } from "@/lib/database.types";
import { PRIEST_EVENT_LABEL, type PriestEventAction } from "@/lib/booking-events";
import { nudgeState } from "@/lib/nudge";
import { languages, timeSlots, formatINR } from "@/lib/poojas";

function formatStamp(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EVENT_DOT: Record<PriestEventAction, string> = {
  assigned: "bg-amber-400",
  accepted: "bg-emerald-500",
  declined: "bg-red-500",
  proposed: "bg-sky-400",
};

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: booking }, { data: roster }, { data: events }] =
    await Promise.all([
      admin
        .from("bookings")
        .select(
          "id, status, booking_date, time_slot, language, address, city, pincode, notes, pandit_id, priest_response, priest_responded_at, proposed_date, proposed_time, last_nudged_at, samagri_kit, service_price, samagri_price, total_amount, created_at, poojas(name, emoji), preferred:pandits!bookings_preferred_pandit_id_fkey(full_name), assigned:pandits!bookings_pandit_id_fkey(full_name)",
        )
        .eq("id", id)
        .maybeSingle(),
      admin
        .from("pandits")
        .select("id, full_name")
        .eq("active", true)
        .order("full_name", { ascending: true }),
      admin
        .from("booking_priest_events")
        .select("id, action, reason, created_at, pandit:pandits(full_name)")
        .eq("booking_id", id)
        .order("created_at", { ascending: true }),
    ]);

  if (!booking) notFound();
  const pandits = roster ?? [];
  const history = events ?? [];

  return (
    <div>
      <Link
        href="/admin/bookings"
        className="text-sm text-foreground/65 hover:text-saffron-700"
      >
        ← Bookings & orders
      </Link>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{booking.poojas?.emoji ?? "🪔"}</span>
          <div>
            <h1 className="font-heading text-2xl text-maroon-800">
              {booking.poojas?.name ?? "Pooja"}
            </h1>
            <p className="text-sm text-foreground/65">
              #{booking.id.slice(0, 8)} ·{" "}
              {new Date(booking.created_at).toLocaleDateString("en-IN")}
              {booking.preferred?.full_name
                ? ` · prefers ${booking.preferred.full_name}`
                : ""}
            </p>
          </div>
        </div>
        <Link
          href={`/admin/bookings/${booking.id}/invoice`}
          className="whitespace-nowrap text-sm font-semibold text-saffron-700 hover:text-saffron-800"
        >
          Receipt →
        </Link>
      </div>

      <form
        action={updateBookingDetails}
        className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]"
      >
        <input type="hidden" name="id" value={booking.id} />

        <div className="space-y-4 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg text-maroon-700">
            Ceremony details
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-foreground/65">
              Date
              <input
                name="booking_date"
                type="date"
                defaultValue={booking.booking_date}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-foreground/65">
              Time
              <select
                name="time_slot"
                defaultValue={booking.time_slot}
                className={`mt-1 ${inputClass}`}
              >
                {timeSlots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-foreground/65">
              Language
              <select
                name="language"
                defaultValue={booking.language ?? ""}
                className={`mt-1 ${inputClass}`}
              >
                <option value="">—</option>
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-foreground/65">
              Status
              <select
                name="status"
                defaultValue={booking.status}
                className={`mt-1 ${inputClass}`}
              >
                {Constants.public.Enums.booking_status.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-foreground/65 sm:col-span-2">
              Assigned Pandit
              <select
                name="pandit_id"
                defaultValue={booking.pandit_id ?? ""}
                className={`mt-1 ${inputClass}`}
              >
                <option value="">— Unassigned —</option>
                {pandits.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs text-foreground/65">
            Address
            <textarea
              name="address"
              rows={2}
              defaultValue={booking.address}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-foreground/65">
              City
              <input
                name="city"
                defaultValue={booking.city}
                className={`mt-1 ${inputClass}`}
              />
            </label>
          </div>
          <label className="block text-xs text-foreground/65">
            Notes
            <textarea
              name="notes"
              rows={2}
              defaultValue={booking.notes ?? ""}
              className={`mt-1 ${inputClass}`}
            />
          </label>

          <button
            type="submit"
            className="rounded-full bg-saffron-600 px-6 py-2 text-sm font-semibold text-white hover:bg-saffron-700"
          >
            Save changes
          </button>
        </div>

        <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg text-maroon-700">Charges</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-foreground/65">Service</dt>
              <dd>{formatINR(booking.service_price)}</dd>
            </div>
            {booking.samagri_kit && (
              <div className="flex justify-between">
                <dt className="text-foreground/65">Samagri kit</dt>
                <dd>{formatINR(booking.samagri_price)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-saffron-50 pt-1 text-base font-semibold">
              <dt>Total</dt>
              <dd className="text-saffron-700">
                {formatINR(booking.total_amount)}
              </dd>
            </div>
          </dl>
        </div>
      </form>

      {/* Refund as store credit (separate form — not nested in the details form) */}
      <form
        action={refundBookingToCredit}
        className="mt-6 flex flex-wrap items-end gap-2 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
      >
        <input type="hidden" name="id" value={booking.id} />
        <div className="text-sm font-medium text-maroon-700">
          Refund as store credit
        </div>
        <input
          name="amount"
          type="number"
          min={1}
          placeholder={`₹ (blank = full ${formatINR(booking.total_amount)})`}
          className="rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400"
        />
        <input
          name="reason"
          placeholder="Reason (optional)"
          className="min-w-48 flex-1 rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400"
        />
        <button
          type="submit"
          className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Refund to wallet
        </button>
      </form>

      {/* Priest response & history */}
      <div className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg text-maroon-700">
            Priest response
          </h2>
          {booking.pandit_id &&
            booking.priest_response === "pending" &&
            (() => {
              const { canNudge, agoLabel } = nudgeState(booking.last_nudged_at);
              return canNudge ? (
                <form action={nudgePriest}>
                  <input type="hidden" name="id" value={booking.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-saffron-300 px-4 py-1.5 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
                    title="Re-send the accept/decline request to the assigned priest"
                  >
                    🔔 Nudge priest
                  </button>
                </form>
              ) : (
                <span className="text-xs text-foreground/65">
                  Nudged {agoLabel}
                </span>
              );
            })()}
        </div>

        <p className="mt-2 text-sm text-foreground/70">
          {!booking.pandit_id ? (
            "No priest currently assigned."
          ) : booking.priest_response === "accepted" ? (
            <span className="text-emerald-700">
              ✓ Accepted by {booking.assigned?.full_name ?? "priest"}
              {booking.priest_responded_at
                ? ` · ${formatStamp(booking.priest_responded_at)}`
                : ""}
            </span>
          ) : booking.priest_response === "proposed" ? (
            <span className="text-sky-700">
              💬 {booking.assigned?.full_name ?? "priest"} proposed a new time
            </span>
          ) : (
            <span className="text-amber-700">
              ⏳ Awaiting {booking.assigned?.full_name ?? "priest"}&apos;s
              response
            </span>
          )}
        </p>

        {booking.priest_response === "proposed" && booking.proposed_date && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
            <span className="text-sm text-sky-900">
              Proposed:{" "}
              <strong>
                {booking.proposed_date} · {(booking.proposed_time ?? "").slice(0, 5)}
              </strong>
            </span>
            <form action={acceptProposal}>
              <input type="hidden" name="id" value={booking.id} />
              <button
                type="submit"
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                ✓ Accept proposed time
              </button>
            </form>
            <span className="text-xs text-foreground/65">
              …or reassign the Pandit above.
            </span>
          </div>
        )}

        {history.length > 0 && (
          <ol className="mt-4 space-y-3 border-l border-saffron-100 pl-4">
            {history.map((e) => (
              <li key={e.id} className="relative">
                <span
                  className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${
                    EVENT_DOT[e.action as PriestEventAction] ?? "bg-stone-300"
                  }`}
                />
                <div className="text-sm">
                  <span className="font-medium text-maroon-700">
                    {PRIEST_EVENT_LABEL[e.action as PriestEventAction] ??
                      e.action}
                  </span>
                  {e.pandit?.full_name ? ` · ${e.pandit.full_name}` : ""}
                  <span className="text-foreground/65">
                    {" "}
                    · {formatStamp(e.created_at)}
                  </span>
                </div>
                {e.reason && (
                  <div className="text-xs text-foreground/65">
                    “{e.reason}”
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
