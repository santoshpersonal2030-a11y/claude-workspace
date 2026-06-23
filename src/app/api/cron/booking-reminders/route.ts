import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingReminder } from "@/lib/notifications";

// Reminds the customer (and assigned priest) the day before each confirmed or
// assigned ceremony. Scheduled via Vercel Cron; guarded by CRON_SECRET.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  // Tomorrow in IST (fixed +05:30).
  const tomorrow = new Date(Date.now() + 5.5 * 3600 * 1000 + 86_400_000)
    .toISOString()
    .slice(0, 10);

  const { data: bookings } = await admin
    .from("bookings")
    .select("id")
    .eq("booking_date", tomorrow)
    .in("status", ["confirmed", "assigned"] as const);

  for (const b of bookings ?? []) {
    await sendBookingReminder(b.id);
  }

  return NextResponse.json({
    ok: true,
    date: tomorrow,
    reminded: bookings?.length ?? 0,
  });
}
