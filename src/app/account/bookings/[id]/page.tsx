import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingStatusTracker from "@/components/BookingStatusTracker";
import { formatINR } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/server";

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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/bookings/${id}`);

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, status, booking_date, time_slot, language, address, city, pincode, samagri_kit, service_price, samagri_price, total_amount, created_at, notes, poojas(name, emoji, sanskrit_name), preferred:pandits!bookings_preferred_pandit_id_fkey(full_name), assigned:pandits!bookings_pandit_id_fkey(full_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

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

          <div className="mt-3 flex items-start gap-4">
            <div className="text-4xl">{booking.poojas?.emoji ?? "🪔"}</div>
            <div>
              <h1 className="font-heading text-3xl text-maroon-800">
                {booking.poojas?.name ?? "Pooja"}
              </h1>
              <p className="mt-1 text-sm text-foreground/55">
                Booked {formatDate(booking.created_at)} · #{booking.id.slice(0, 8)}
              </p>
            </div>
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
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
