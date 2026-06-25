import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingStatusTracker from "@/components/BookingStatusTracker";
import BookingTimeline, {
  type TimelineItem,
} from "@/components/BookingTimeline";
import BookingChat from "@/components/BookingChat";
import PayPendingBooking from "@/components/PayPendingBooking";
import { formatINR, timeSlots } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  cancelBooking,
  rescheduleBooking,
  submitPanditReview,
  raiseBookingDispute,
} from "@/app/[locale]/account/bookings/actions";
import { SELF_SERVE_HOURS } from "@/lib/booking-policy";
import { nextStepNote } from "@/lib/booking-status";

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
      "id, status, mode, booking_date, time_slot, language, address, city, pincode, pandit_id, package_id, priest_response, proposed_date, proposed_time, samagri_kit, service_price, samagri_price, total_amount, created_at, notes, poojas(name, emoji, sanskrit_name), preferred:pandits!bookings_preferred_pandit_id_fkey(full_name), assigned:pandits!bookings_pandit_id_fkey(full_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  // The RLS-scoped fetch above already proved this booking belongs to the user,
  // so we can read its (service-only) priest event log with the admin client.
  const { data: events } = await createAdminClient()
    .from("booking_priest_events")
    .select("action, created_at, pandits(full_name)")
    .eq("booking_id", id)
    .order("created_at", { ascending: true });

  const timeline = buildTimeline(booking, events ?? []);
  const nextStep = nextStepNote(booking);

  // Any dispute the customer raised on this booking (latest first).
  const { data: dispute } = await supabase
    .from("booking_disputes")
    .select("category, status, details, resolution_notes, created_at")
    .eq("booking_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
        <section className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <Link
            href="/account/bookings"
            className="text-sm text-foreground/65 hover:text-saffron-700"
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
                <p className="mt-1 text-sm text-foreground/65">
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

          <div className="mt-4 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
            <BookingStatusTracker status={booking.status} />
            {nextStep && (
              <p className="mt-4 rounded-xl bg-saffron-50 px-3 py-2 text-sm text-saffron-800">
                {nextStep}
              </p>
            )}
            {timeline.length > 1 && (
              <div className="mt-5 border-t border-saffron-50 pt-5">
                <h2 className="mb-4 font-heading text-sm text-maroon-700">
                  Activity
                </h2>
                <BookingTimeline items={timeline} />
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-lg text-maroon-700">Details</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {rows.map((r) => (
                  <div key={r.label} className="flex justify-between gap-3">
                    <dt className="text-foreground/65">{r.label}</dt>
                    <dd className="text-right font-medium text-foreground">
                      {r.value}
                    </dd>
                  </div>
                ))}
              </dl>
              {booking.notes && (
                <p className="mt-3 border-t border-saffron-50 pt-3 text-sm text-foreground/70">
                  <span className="text-foreground/65">Notes: </span>
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
                  <dt className="text-foreground/65">Service (dakshina)</dt>
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
              {booking.status === "pending" && !booking.package_id && (
                <PayPendingBooking
                  bookingId={booking.id}
                  amount={booking.total_amount}
                />
              )}
              {booking.status === "pending" && booking.package_id && (
                <p className="mt-3 border-t border-saffron-50 pt-3 text-xs text-foreground/65">
                  Part of a package — paid together with the other ceremonies.
                </p>
              )}
            </div>
          </div>

          {CANCELLABLE.includes(booking.status) && (
            <div className="mt-4 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-lg text-maroon-700">
                Manage booking
              </h2>
              <p className="mt-1 text-xs text-foreground/65">
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
                  <label className="mt-2 block text-xs text-foreground/65">
                    New date
                    <input
                      type="date"
                      name="booking_date"
                      required
                      defaultValue={booking.booking_date}
                      className="mt-1 w-full rounded-lg border border-saffron-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-saffron-400"
                    />
                  </label>
                  <label className="mt-2 block text-xs text-foreground/65">
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
                  <p className="mt-1 flex-1 text-xs text-foreground/65">
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
            <div className="mt-4 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-lg text-maroon-700">
                {myReview ? "Your review" : "Rate your Pandit"}
              </h2>
              <p className="mt-1 text-xs text-foreground/65">
                {booking.assigned?.full_name
                  ? `How was your ceremony with ${booking.assigned.full_name}?`
                  : "How was your ceremony?"}
              </p>
              <form action={submitPanditReview} className="mt-4 space-y-3">
                <input type="hidden" name="booking_id" value={booking.id} />
                <label className="block text-xs text-foreground/65">
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
                  className="rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
                >
                  {myReview ? "Update review" : "Submit review"}
                </button>
              </form>
            </div>
          )}

          <div className="mt-4">
            <BookingChat bookingId={booking.id} />
          </div>

          {/* Dispute / report an issue */}
          {booking.status !== "cancelled" && (
            <div className="mt-4 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
              <h3 className="font-heading text-lg text-maroon-700">
                Report an issue
              </h3>
              {dispute ? (
                <div className="mt-2 text-sm">
                  <p className="text-foreground/70">
                    You raised a{" "}
                    <span className="font-medium">{dispute.category.replace("_", " ")}</span>{" "}
                    issue —{" "}
                    <span
                      className={
                        dispute.status === "resolved"
                          ? "text-emerald-700"
                          : dispute.status === "rejected"
                            ? "text-foreground/65"
                            : "text-amber-600"
                      }
                    >
                      {dispute.status}
                    </span>
                    .
                  </p>
                  {dispute.resolution_notes && (
                    <p className="mt-1 text-xs text-foreground/65">
                      Our response: {dispute.resolution_notes}
                    </p>
                  )}
                </div>
              ) : (
                <form action={raiseBookingDispute} className="mt-3 space-y-3">
                  <input type="hidden" name="booking_id" value={booking.id} />
                  <select
                    name="category"
                    required
                    className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400"
                  >
                    <option value="">What went wrong?</option>
                    <option value="no_show">Pandit didn&apos;t show up</option>
                    <option value="quality">Service quality</option>
                    <option value="payment">Payment / billing</option>
                    <option value="reschedule">Reschedule problem</option>
                    <option value="other">Something else</option>
                  </select>
                  <textarea
                    name="details"
                    rows={3}
                    required
                    placeholder="Tell us what happened…"
                    className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400"
                  />
                  <button
                    type="submit"
                    className="rounded-full border border-maroon-300 px-5 py-2 text-sm font-semibold text-maroon-700 hover:bg-maroon-50"
                  >
                    Submit issue
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

type EventRow = {
  action: string;
  created_at: string;
  pandits: { full_name: string } | null;
};

// Builds the customer-facing activity timeline: booking placed → payment →
// priest events (assigned/confirmed/reassigning/proposed) → completed/cancelled.
function buildTimeline(
  booking: { created_at: string; status: string },
  events: EventRow[],
): TimelineItem[] {
  const items: TimelineItem[] = [
    {
      key: "placed",
      emoji: "📝",
      title: "Booking placed",
      at: booking.created_at,
      tone: "done",
    },
  ];

  if (booking.status !== "pending") {
    items.push({
      key: "confirmed",
      emoji: "💳",
      title: "Payment confirmed",
      tone: "done",
    });
  }

  events.forEach((e, i) => {
    const name = e.pandits?.full_name ?? "your Pandit";
    const base = { key: `e${i}`, at: e.created_at };
    if (e.action === "assigned") {
      items.push({ ...base, emoji: "👤", title: `${name} assigned`, tone: "done" });
    } else if (e.action === "accepted") {
      items.push({
        ...base,
        emoji: "✅",
        title: `${name} confirmed your booking`,
        tone: "done",
      });
    } else if (e.action === "declined") {
      items.push({
        ...base,
        emoji: "🔄",
        title: "Reassigning to another Pandit",
        tone: "muted",
      });
    } else if (e.action === "proposed") {
      items.push({
        ...base,
        emoji: "🕑",
        title: `${name} proposed a new time`,
        tone: "active",
      });
    }
  });

  if (booking.status === "completed") {
    items.push({
      key: "completed",
      emoji: "🎉",
      title: "Ceremony completed",
      tone: "done",
    });
  } else if (booking.status === "cancelled") {
    items.push({
      key: "cancelled",
      emoji: "✖️",
      title: "Booking cancelled",
      tone: "alert",
    });
  }

  return items;
}
