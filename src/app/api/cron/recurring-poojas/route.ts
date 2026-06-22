import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { nextRunDate, type Cadence } from "@/lib/recurrence";
import { sendRecurringScheduled } from "@/lib/notifications";

// Creates the next booking for every due recurring-pooja subscription and
// advances its next_run. Scheduled via Vercel Cron; guarded by CRON_SECRET.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  // Today in IST (fixed +05:30).
  const today = new Date(Date.now() + 5.5 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: subs } = await admin
    .from("pooja_subscriptions")
    .select(
      "id, user_id, pooja_id, cadence, anchor_day, time_slot, address, city, pincode, language, samagri_kit, next_run, poojas(name, starting_price, samagri_kit_price)",
    )
    .eq("active", true)
    .lte("next_run", today);

  let created = 0;
  for (const s of subs ?? []) {
    const pooja = s.poojas;
    if (!pooja) continue;

    const service = pooja.starting_price;
    const samagri = s.samagri_kit ? (pooja.samagri_kit_price ?? 0) : 0;

    const { data: booking } = await admin
      .from("bookings")
      .insert({
        user_id: s.user_id,
        pooja_id: s.pooja_id,
        booking_date: s.next_run,
        time_slot: s.time_slot,
        address: s.address,
        city: s.city,
        pincode: s.pincode,
        language: s.language,
        samagri_kit: s.samagri_kit,
        samagri_price: samagri,
        service_price: service,
        total_amount: service + samagri,
        status: "pending",
      })
      .select("id")
      .maybeSingle();

    // Advance one cycle from the date we just scheduled.
    const next = nextRunDate(s.cadence as Cadence, s.anchor_day, s.next_run);
    await admin
      .from("pooja_subscriptions")
      .update({
        next_run: next,
        last_booking_id: booking?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", s.id);

    if (booking?.id) {
      await sendRecurringScheduled(booking.id);
      created += 1;
    }
  }

  return NextResponse.json({ ok: true, created });
}
