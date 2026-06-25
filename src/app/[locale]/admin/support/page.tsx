import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/admin";
import BookingChat from "@/components/BookingChat";

export const metadata = { title: "Support inbox — Admin" };

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ b?: string }>;
}) {
  await requireCapability("messages");
  const { b } = await searchParams;
  const admin = createAdminClient();

  // Most recent message per booking → the thread list.
  const { data: recent } = await admin
    .from("booking_messages")
    .select("booking_id, body, created_at, sender_role")
    .order("created_at", { ascending: false })
    .limit(300);

  const threads = new Map<
    string,
    { booking_id: string; body: string; created_at: string; sender_role: string }
  >();
  for (const m of recent ?? []) {
    if (!threads.has(m.booking_id)) threads.set(m.booking_id, m);
  }
  const ids = [...threads.keys()];

  const { data: bookings } = ids.length
    ? await admin
        .from("bookings")
        .select("id, booking_date, city, poojas(name)")
        .in("id", ids)
    : { data: [] };
  const bookingById = new Map((bookings ?? []).map((x) => [x.id, x]));

  const selected = b && threads.has(b) ? b : ids[0];

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Support inbox</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Booking conversations with customers and pandits.
      </p>

      {ids.length === 0 ? (
        <p className="mt-6 text-sm text-foreground/65">No conversations yet.</p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-1">
            {ids.map((id) => {
              const t = threads.get(id)!;
              const bk = bookingById.get(id);
              return (
                <Link
                  key={id}
                  href={`/admin/support?b=${id}`}
                  className={`block rounded-xl border px-3 py-2 text-sm ${
                    id === selected
                      ? "border-saffron-300 bg-saffron-50"
                      : "border-saffron-100 bg-white hover:bg-cream"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-maroon-700">
                      {bk?.poojas?.name ?? "Booking"}
                    </span>
                    <span className="text-[10px] text-foreground/65">
                      {new Date(t.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-xs text-foreground/65">
                    <span className="capitalize">{t.sender_role}</span>: {t.body}
                  </p>
                </Link>
              );
            })}
          </div>

          {selected && <BookingChat bookingId={selected} />}
        </div>
      )}
    </div>
  );
}
