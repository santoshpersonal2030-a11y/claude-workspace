import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatINR } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/server";
import { nextStepNote } from "@/lib/booking-status";

export const metadata = { title: "My Bookings" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending payment",
  confirmed: "Confirmed",
  assigned: "Pandit assigned",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account/bookings");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, booking_date, time_slot, status, total_amount, city, mode, priest_response, proposed_date, proposed_time, poojas(name, emoji, slug), preferred:pandits!bookings_preferred_pandit_id_fkey(full_name), assigned:pandits!bookings_pandit_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-heading text-3xl text-maroon-800">My bookings</h1>
            <Link
              href="/account/subscriptions"
              className="rounded-full border border-saffron-300 px-4 py-1.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
            >
              🔁 Recurring poojas
            </Link>
          </div>

          {!bookings || bookings.length === 0 ? (
            <p className="mt-4 text-foreground/65">
              You haven&apos;t booked a pooja yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start gap-4 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
                >
                  <div className="text-3xl">{booking.poojas?.emoji ?? "🪔"}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-heading text-lg text-maroon-700">
                        {booking.poojas?.name ?? "Pooja"}
                      </h3>
                      <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-medium text-saffron-700">
                        {STATUS_LABEL[booking.status] ?? booking.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground/65">
                      {new Date(booking.booking_date).toLocaleDateString(
                        "en-IN",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}{" "}
                      · {booking.time_slot}
                      {booking.city ? ` · ${booking.city}` : ""}
                    </p>
                    {booking.assigned?.full_name ? (
                      <p className="mt-1 text-xs text-green-700">
                        Pandit assigned: {booking.assigned.full_name}
                      </p>
                    ) : booking.preferred?.full_name ? (
                      <p className="mt-1 text-xs text-foreground/65">
                        Preferred Pandit: {booking.preferred.full_name}
                      </p>
                    ) : null}
                    {(() => {
                      const next = nextStepNote(booking);
                      return next ? (
                        <p className="mt-2 text-xs font-medium text-saffron-700">
                          {next}
                        </p>
                      ) : null;
                    })()}
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                      {booking.mode === "online" &&
                        booking.status !== "pending" &&
                        booking.status !== "cancelled" && (
                          <Link
                            href={`/account/bookings/${booking.id}/live`}
                            className="rounded-full bg-saffron-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-saffron-800"
                          >
                            🎥 Join live pooja
                          </Link>
                        )}
                      <Link
                        href={`/account/bookings/${booking.id}`}
                        className="text-sm font-semibold text-saffron-700 hover:text-saffron-800"
                      >
                        View details →
                      </Link>
                      {booking.poojas?.slug && (
                        <Link
                          href={`/poojas/${booking.poojas.slug}`}
                          className="text-sm font-semibold text-saffron-700 hover:text-saffron-800"
                        >
                          🔁 Book again
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="font-semibold text-saffron-700">
                    {formatINR(booking.total_amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
