import Link from "next/link";
import { notFound } from "next/navigation";

import { updateBookingDetails } from "@/app/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { Constants } from "@/lib/database.types";
import { languages, timeSlots, formatINR } from "@/lib/poojas";

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: booking }, { data: roster }] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "id, status, booking_date, time_slot, language, address, city, pincode, notes, pandit_id, samagri_kit, service_price, samagri_price, total_amount, created_at, poojas(name, emoji), preferred:pandits!bookings_preferred_pandit_id_fkey(full_name)",
      )
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("pandits")
      .select("id, full_name")
      .eq("active", true)
      .order("full_name", { ascending: true }),
  ]);

  if (!booking) notFound();
  const pandits = roster ?? [];

  return (
    <div>
      <Link
        href="/admin/bookings"
        className="text-sm text-foreground/60 hover:text-saffron-700"
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
            <p className="text-sm text-foreground/55">
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
            <label className="text-xs text-foreground/60">
              Date
              <input
                name="booking_date"
                type="date"
                defaultValue={booking.booking_date}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="text-xs text-foreground/60">
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
            <label className="text-xs text-foreground/60">
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
            <label className="text-xs text-foreground/60">
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
            <label className="text-xs text-foreground/60 sm:col-span-2">
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

          <label className="block text-xs text-foreground/60">
            Address
            <textarea
              name="address"
              rows={2}
              defaultValue={booking.address}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-foreground/60">
              City
              <input
                name="city"
                defaultValue={booking.city}
                className={`mt-1 ${inputClass}`}
              />
            </label>
          </div>
          <label className="block text-xs text-foreground/60">
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
              <dt className="text-foreground/60">Service</dt>
              <dd>{formatINR(booking.service_price)}</dd>
            </div>
            {booking.samagri_kit && (
              <div className="flex justify-between">
                <dt className="text-foreground/60">Samagri kit</dt>
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
    </div>
  );
}
