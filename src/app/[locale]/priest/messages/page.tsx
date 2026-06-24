import Link from "next/link";
import { redirect } from "next/navigation";

import { getPriestPandit } from "@/lib/priest";
import { createAdminClient } from "@/lib/supabase/admin";
import BookingChat from "@/components/BookingChat";

export const metadata = { title: "Messages — Priest Portal" };

export default async function PriestMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ b?: string }>;
}) {
  const pandit = await getPriestPandit();
  if (!pandit) redirect("/login?next=/priest/messages");
  const { b } = await searchParams;
  const admin = createAdminClient();

  // The priest's bookings (assigned or preferred), newest ceremony first.
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, booking_date, city, status, poojas(name)")
    .or(`pandit_id.eq.${pandit.id},preferred_pandit_id.eq.${pandit.id}`)
    .order("booking_date", { ascending: false })
    .limit(50);

  const list = bookings ?? [];
  const selected = b && list.some((x) => x.id === b) ? b : list[0]?.id;

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Messages</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Chat with customers about your assigned ceremonies.
      </p>

      {list.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/65">
          No bookings assigned to you yet.
        </p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-1">
            {list.map((bk) => (
              <Link
                key={bk.id}
                href={`/priest/messages?b=${bk.id}`}
                className={`block rounded-xl border px-3 py-2 text-sm ${
                  bk.id === selected
                    ? "border-saffron-300 bg-saffron-50"
                    : "border-saffron-100 bg-white hover:bg-cream"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-maroon-700">
                    {bk.poojas?.name ?? "Booking"}
                  </span>
                  <span className="text-[10px] text-foreground/65">
                    {new Date(bk.booking_date).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <p className="text-xs text-foreground/65">
                  {bk.city ?? ""} · {bk.status}
                </p>
              </Link>
            ))}
          </div>

          {selected && <BookingChat bookingId={selected} />}
        </div>
      )}
    </div>
  );
}
