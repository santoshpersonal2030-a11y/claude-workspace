// SERVER-ONLY: public read of APPROVED muhurat windows for the customer-facing
// auspicious-dates page. muhurat_windows is service-role only; reads go through
// the admin client and are strictly filtered to approved = true so unvetted
// candidates never leak.

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTravelBand, servesNearby, isValidPincode } from "@/lib/travel";

export type AuspiciousDate = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  ceremony: string; // pooja name, else category, else "All ceremonies"
  poojaSlug: string | null;
  label: string | null;
  note: string | null;
  qualityScore: number | null;
};

// Upcoming approved windows (today onward), earliest first. Resolves the pooja
// name from the slug. Returns [] on any error so the page degrades gracefully.
export async function getApprovedMuhuratWindows(
  limit = 200,
): Promise<AuspiciousDate[]> {
  try {
    const admin = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: windows }, { data: poojas }] = await Promise.all([
      admin
        .from("muhurat_windows")
        .select(
          "id, date, start_time, end_time, category, pooja_slug, label, note, quality_score",
        )
        .eq("approved", true)
        .gte("date", today)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(limit),
      admin.from("poojas").select("slug, name"),
    ]);

    const nameBySlug = new Map((poojas ?? []).map((p) => [p.slug, p.name]));

    return (windows ?? []).map((w) => ({
      id: w.id,
      date: w.date,
      startTime: w.start_time.slice(0, 5),
      endTime: w.end_time.slice(0, 5),
      ceremony: w.pooja_slug
        ? (nameBySlug.get(w.pooja_slug) ?? w.pooja_slug)
        : (w.category ?? "All ceremonies"),
      poojaSlug: w.pooja_slug,
      label: w.label,
      note: w.note,
      qualityScore: w.quality_score,
    }));
  } catch (err) {
    console.warn("getApprovedMuhuratWindows failed:", err);
    return [];
  }
}

// Per-window priest availability for a customer pincode.
export type WindowAvailability = {
  count: number;
  status: "available" | "limited" | "none";
};

function statusFor(count: number): WindowAvailability["status"] {
  if (count >= 3) return "available";
  if (count >= 1) return "limited";
  return "none";
}

// Cross-checks every upcoming approved muhurat window against the priest roster
// for a pincode: counts active priests who serve the area (exact or nearby),
// perform the ceremony (specialists or generalists), and are free on the date
// (not on blackout, not already booked). Returns a map keyed by window id.
export async function getMuhuratAvailability(
  pincode: string,
): Promise<Record<string, WindowAvailability>> {
  const result: Record<string, WindowAvailability> = {};
  if (!isValidPincode(pincode)) return result;

  try {
    const admin = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: windows }, { data: pandits }, { data: poojas }] =
      await Promise.all([
        admin
          .from("muhurat_windows")
          .select("id, date, category, pooja_slug")
          .eq("approved", true)
          .gte("date", today)
          .order("date", { ascending: true }),
        admin
          .from("pandits")
          .select(
            "id, home_pincode, service_pincodes, blackout_dates, specializations",
          )
          .eq("active", true),
        admin.from("poojas").select("slug, category"),
      ]);

    if (!windows || windows.length === 0) return result;
    const roster = pandits ?? [];
    const categoryBySlug = new Map(
      (poojas ?? []).map((p) => [p.slug, p.category]),
    );

    // Priests already committed on a date (assigned/confirmed bookings).
    const lastDate = windows[windows.length - 1].date;
    const { data: bookings } = await admin
      .from("bookings")
      .select("pandit_id, booking_date, status")
      .gte("booking_date", today)
      .lte("booking_date", lastDate)
      .in("status", ["confirmed", "assigned"] as const)
      .not("pandit_id", "is", null);

    const busyByDate = new Map<string, Set<string>>();
    for (const b of bookings ?? []) {
      if (!b.pandit_id) continue;
      const set = busyByDate.get(b.booking_date) ?? new Set<string>();
      set.add(b.pandit_id);
      busyByDate.set(b.booking_date, set);
    }

    for (const w of windows) {
      const cat = w.pooja_slug
        ? (categoryBySlug.get(w.pooja_slug) ?? null)
        : w.category;
      const busy = busyByDate.get(w.date);

      const count = roster.filter((p) => {
        // Performs this ceremony? (generalists with no specialities qualify.)
        if (
          cat &&
          (p.specializations?.length ?? 0) > 0 &&
          !p.specializations.includes(cat)
        ) {
          return false;
        }
        // Serves the area (exact band or a nearby pincode).
        const sa = {
          homePincode: p.home_pincode,
          servicePincodes: p.service_pincodes ?? [],
        };
        if (!resolveTravelBand(pincode, sa) && !servesNearby(pincode, sa)) {
          return false;
        }
        // Free on the date.
        if ((p.blackout_dates ?? []).includes(w.date)) return false;
        if (busy?.has(p.id)) return false;
        return true;
      }).length;

      result[w.id] = { count, status: statusFor(count) };
    }
    return result;
  } catch (err) {
    console.warn("getMuhuratAvailability failed:", err);
    return result;
  }
}
