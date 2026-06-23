import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingStatusTracker from "@/components/BookingStatusTracker";
import PayPendingBooking from "@/components/PayPendingBooking";
import { formatINR, timeSlots } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/server";
import {
  cancelBooking,
  rescheduleBooking,
  submitPanditReview,
} from "@/app/account/bookings/actions";
import { SELF_SERVE_HOURS } from "@/lib/booking-policy";

const CANCELLABLE = ["pending", "confirmed", "assigned"];

export const metadata = { title: "Booking details" };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ late?: string }>;
}) {
  const { id } = await params;
  const { late } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/bookings/${id}`);

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, status, booking_date, time_slot, language, address, city, pincode, pandit_id, package_id, samagri_kit, service_price, samagri_price, total_amount, created_at, notes, poojas(name, emoji, sanskrit_name), preferred:pandits!bookings_preferred_pandit_id_fkey(full_name), assigned:pandits!bookings_pandit_id_fkey(full_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  // Existing Pandit review for this booking, to prefill/edit the form.
  const myReview =
    booking.status === "completed" && booking.pandit_id
      ? (
          await supabase
            .from("pandit_reviews")
            .select("rating, title, body")
            .eq("booking_id", id)
            .maybeSingle()
        ).data
      : null;

  const rows: { label: string; value: string }[] = [
    { label: "Date", value: formatDate(booking.booking_date) },
    { label: "Time", value: booking.time_slot },
    ...(booking.language
      ? [{ label: "Language", value: booking.language }]
      : []),
    ...(booking.assigned?.full_name
      ? [{ label: "Assigned Pandit", value: booking.assigned.full_name }]
      : booking.preferred?.full_name
        ? [{ label: "Preferred Pandit", value: booking.preferred.full_name }]
        : []),
  ];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <Link
            href="/account/bookings"
            className="text-sm text-foreground/60 hover:text-saffron-700"
          >
            ← All bookings
          </Link>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{booking.poojas?.emoji ?? "🪔"}</div>
              <div>
                <h1 className="font-heading text-3xl text-maroon-800">
                  {booking.poojas?.name ?? "Pooja"}
                </h1>
                <p className="mt-1 text-sm text-foreground/55">
                  Booked {formatDate(booking.created_at)} · #
                  {booking.id.slice(0, 8)}
                </p>
              </div>
            </div>
            <Link
              href={`/account/bookings/${booking.id}/invoice`}
              className="whitespace-nowrap text-sm font-semibold text-saffron-700 hover:text-saffron-800"
            >
              Receipt
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
            <BookingStatusTracker status={booking.status} />
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-lg text-maroon-700">Details</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {rows.map((r) => (
                  <div key={r.label} className="flex justify-between gap-3">
                    <dt className="text-foreground/55">{r.label}</dt>
                    <dd className="text-right font-medium text-foreground">
                      {r.value}
                    </dd>
                  </div>
                ))}
              </dl>
              {booking.notes && (
                <p className="mt-3 border-t border-saffron-50 pt-3 text-sm text-foreground/70">
                  <span className="text-foreground/55">Notes: </span>
                  {booking.notes}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-lg text-maroon-700">
                Venue & charges
              </h2>
              <div className="mt-3 text-sm text-foreground/75">
                {booking.address}
                <div>
                  {[booking.city, booking.pincode].filter(Boolean).join(" · ")}
                </div>
              </div>
              <dl className="mt-4 space-y-1 border-t border-saffron-50 pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-foreground/60">Service (dakshina)</dt>
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
              {booking.status === "pending" && !booking.package_id && (
                <PayPendingBooking
                  bookingId={booking.id}
                  amount={booking.total_amount}
                />
              )}
              {booking.status === "pending" && booking.package_id && (
                <p className="mt-3 border-t border-saffron-50 pt-3 text-xs text-foreground/55">
                  Part of a package — paid together with the other ceremonies.
                </p>
              )}
            </div>
          </div>

          {CANCELLABLE.includes(booking.status) && (
            <div className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-lg text-maroon-700">
                Manage booking
              </h2>
              <p className="mt-1 text-xs text-foreground/55">
                Free reschedule or full refund up to {SELF_SERVE_HOURS} hours
                before the ceremony. Closer to the date, please contact support.
              </p>
              {late && (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                  That&apos;s within {SELF_SERVE_HOURS} hours of the ceremony —
                  please contact us to reschedule.
                </p>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* Reschedule */}
                <form
                  action={rescheduleBooking}
                  className="rounded-xl border border-saffron-100 bg-cream/40 p-4"
                >
                  <input type="hidden" name="id" value={booking.id} />
                  <h3 className="text-sm font-semibold text-maroon-700">
                    Reschedule
                  </h3>
                  <label className="mt-2 block text-xs text-foreground/60">
                    New date
                    <input
                      type="date"
                      name="booking_date"
                      required
                      defaultValue={booking.booking_date}
                      className="mt-1 w-full rounded-lg border border-saffron-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-saffron-400"
                    />
                  </label>
                  <label className="mt-2 block text-xs text-foreground/60">
                    New time
                    <select
                      name="time_slot"
                      required
                      defaultValue={booking.time_slot}
                      className="mt-1 w-full rounded-lg border border-saffron-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-saffron-400"
                    >
                      {timeSlots.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="mt-3 w-full rounded-full border border-saffron-300 py-2 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
                  >
                    Reschedule
                  </button>
                </form>

                {/* Cancel */}
                <form
                  action={cancelBooking}
                  className="flex flex-col rounded-xl border border-red-100 bg-red-50/40 p-4"
                >
                  <input type="hidden" name="id" value={booking.id} />
                  <h3 className="text-sm font-semibold text-red-700">
                    Cancel booking
                  </h3>
                  <p className="mt-1 flex-1 text-xs text-foreground/60">
                    Cancelling a paid booking refunds it in full when done at
                    least {SELF_SERVE_HOURS} hours ahead.
                  </p>
                  <button
                    type="submit"
                    className="mt-3 w-full rounded-full border border-red-300 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Cancel this booking
                  </button>
                </form>
              </div>
            </div>
          )}

          {booking.status === "completed" && booking.pandit_id && (
            <div className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-lg text-maroon-700">
                {myReview ? "Your review" : "Rate your Pandit"}
              </h2>
              <p className="mt-1 text-xs text-foreground/55">
                {booking.assigned?.full_name
                  ? `How was your ceremony with ${booking.assigned.full_name}?`
                  : "How was your ceremony?"}
              </p>
              <form action={submitPanditReview} className="mt-4 space-y-3">
                <input type="hidden" name="booking_id" value={booking.id} />
                <label className="block text-xs text-foreground/60">
                  Rating
                  <select
                    name="rating"
                    defaultValue={String(myReview?.rating ?? 5)}
                    className="mt-1 w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400 sm:w-48"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {"★".repeat(n)}
                        {"☆".repeat(5 - n)} ({n})
                      </option>
                    ))}
                  </select>
                </label>
                <input
                  name="title"
                  defaultValue={myReview?.title ?? ""}
                  placeholder="Headline (optional)"
                  className="w-full rounded-lg border border-saffron-200 bg-cream px-3 py-2 text-sm outline-none focus:border-saffron-400"
                />
                <textarea
                  name="body"
                  rows={3}
                  defaultValue={myReview?.body ?? ""}
                  placeholder="Share a few words about your experience (optional)"
                  className="w-full rounded-lg border border-saffron-200 bg-cream px-3 py-2 text-sm outline-none focus:border-saffron-400"
                />
                <button
                  type="submit"
                  className="rounded-full bg-saffron-600 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-700"
                >
                  {myReview ? "Update review" : "Submit review"}
                </button>
              </form>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
