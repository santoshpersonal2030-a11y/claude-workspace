import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { timeSlots } from "@/lib/poojas";
import { availableStartTimes, type DayJob } from "@/lib/scheduling";

// India has no DST, so a fixed +05:30 offset converts a UTC instant to the
// priest's local minutes-from-midnight.
const IST_OFFSET_MIN = 330;

function istMinutes(iso: string): number {
  const d = new Date(iso);
  const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes();
  return (utcMin + IST_OFFSET_MIN + 1440) % 1440;
}

// A `time` column comes back as "HH:MM:SS"; the engine wants "HH:MM".
function hhmm(t: string | null, fallback: string): string {
  return t ? t.slice(0, 5) : fallback;
}

// Returns the bookable start times for a pooja with a specific priest on a
// given date. Muhurat poojas return a flag instead of hard slots (the timing
// is proposed by the customer and confirmed by the priest). Falls back to the
// standard slots if the database is unreachable, so the form never dead-ends.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const panditSlug = url.searchParams.get("panditSlug");
  const poojaSlug = url.searchParams.get("poojaSlug");
  const date = url.searchParams.get("date");
  const pincode = url.searchParams.get("pincode");

  if (!panditSlug || !poojaSlug || !date) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    const { data: pooja } = await admin
      .from("poojas")
      .select("duration_hours, requires_muhurat")
      .eq("slug", poojaSlug)
      .maybeSingle();

    if (!pooja) {
      return NextResponse.json({ error: "Pooja not found" }, { status: 404 });
    }

    if (pooja.requires_muhurat) {
      return NextResponse.json({ muhurat: true, slots: timeSlots });
    }

    const { data: pandit } = await admin
      .from("pandits")
      .select("id, work_start, work_end, max_travel_mins, blackout_dates")
      .eq("slug", panditSlug)
      .maybeSingle();

    if (!pandit) {
      return NextResponse.json({ muhurat: false, slots: timeSlots });
    }

    if ((pandit.blackout_dates ?? []).includes(date)) {
      return NextResponse.json({ muhurat: false, slots: [], blackout: true });
    }

    // The priest's already-booked jobs that day (service role bypasses RLS so
    // we see every customer's booking, not just the caller's).
    const dayStart = `${date}T00:00:00+05:30`;
    const dayEnd = `${date}T23:59:59+05:30`;
    const { data: rows } = await admin
      .from("bookings")
      .select("starts_at, ends_at, pincode")
      .eq("pandit_id", pandit.id)
      .neq("status", "cancelled")
      .not("starts_at", "is", null)
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd);

    const existing: DayJob[] = (rows ?? [])
      .filter((r) => r.starts_at && r.ends_at)
      .map((r) => {
        const startMin = istMinutes(r.starts_at as string);
        const durationMin = Math.round(
          (new Date(r.ends_at as string).getTime() -
            new Date(r.starts_at as string).getTime()) /
            60000,
        );
        return { startMin, durationMin, pincode: r.pincode };
      });

    const slots = availableStartTimes({
      workStart: hhmm(pandit.work_start, "06:00"),
      workEnd: hhmm(pandit.work_end, "21:00"),
      durationMin: Math.round(Number(pooja.duration_hours) * 60),
      pincode: pincode || null,
      existing,
      maxTravelMins: pandit.max_travel_mins ?? 30,
    });

    return NextResponse.json({ muhurat: false, slots });
  } catch {
    // DB unreachable (e.g. sandbox build/egress-blocked) — degrade to the
    // standard slot list so booking still works.
    return NextResponse.json({ muhurat: false, slots: timeSlots });
  }
}
