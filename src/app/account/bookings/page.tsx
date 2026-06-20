import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatINR } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/server";

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
    .select("id, booking_date, time_slot, status, total_amount, city, poojas(name, emoji), pandits(full_name)")
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <h1 className="font-heading text-3xl text-maroon-800">My bookings</h1>

          {!bookings || bookings.length === 0 ? (
            <p className="mt-8 text-foreground/60">
              You haven&apos;t booked a pooja yet.
            </p>
          ) : (
            <div className="mt-8 space-y-4">
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
                    <p className="mt-1 text-sm text-foreground/60">
                      {new Date(booking.booking_date).toLocaleDateString(
                        "en-IN",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}{" "}
                      · {booking.time_slot}
                      {booking.city ? ` · ${booking.city}` : ""}
                    </p>
                    {booking.pandits?.full_name && (
                      <p className="mt-1 text-xs text-foreground/50">
                        Preferred Pandit: {booking.pandits.full_name}
                      </p>
                    )}
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
