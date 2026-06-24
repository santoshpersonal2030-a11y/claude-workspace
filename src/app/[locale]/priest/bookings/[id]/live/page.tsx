import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getPriestPandit } from "@/lib/priest";
import { createAdminClient } from "@/lib/supabase/admin";
import VideoRoom from "@/components/VideoRoom";
import { poojaRoomName } from "@/lib/video";

export const metadata = { title: "Live pooja", robots: { index: false } };

export default async function PriestLivePoojaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pandit = await getPriestPandit();
  if (!pandit) redirect("/login?next=/priest/calendar");

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, mode, status, pandit_id, booking_date, time_slot, poojas(name, emoji)")
    .eq("id", id)
    .maybeSingle();

  // Only the assigned priest may open the room, and only for online poojas.
  if (!booking || booking.pandit_id !== pandit.id || booking.mode !== "online") {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl text-maroon-800">
            {booking.poojas?.emoji} {booking.poojas?.name}
          </h1>
          <p className="mt-1 text-sm text-foreground/65">
            {booking.booking_date} · {booking.time_slot}
          </p>
        </div>
        <Link
          href="/priest/calendar"
          className="text-sm font-semibold text-saffron-700 hover:text-saffron-800"
        >
          ← My calendar
        </Link>
      </div>
      <div className="mt-6">
        <VideoRoom
          room={poojaRoomName(booking.id)}
          displayName={
            pandit.full_name ? `${pandit.full_name} (Pandit)` : "Pandit"
          }
        />
      </div>
    </div>
  );
}
