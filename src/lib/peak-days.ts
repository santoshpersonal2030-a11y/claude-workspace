// SERVER-ONLY: peak-day premium pricing. Certain festival / high-demand dates
// carry a percentage surcharge on the dakshina (service price). The premium is
// resolved server-side so the charge is always authoritative; the booking form
// fetches the upcoming list via /api/peak-days only to preview it.

import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";

export type PeakDay = {
  date: string;
  label: string;
  surchargePct: number;
};

// Whole-rupee premium for a base service price at a given percentage.
export function peakSurchargeAmount(base: number, pct: number): number {
  return Math.max(0, Math.round((base * pct) / 100));
}

// Resolves the active peak day for a date (YYYY-MM-DD), or null. Deduped per
// request. Returns null on any DB error so booking never breaks over pricing.
export const getPeakDay = cache(
  async (date: string): Promise<PeakDay | null> => {
    if (!date) return null;
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("peak_days")
        .select("date, label, surcharge_pct")
        .eq("date", date)
        .eq("active", true)
        .maybeSingle();
      if (!data) return null;
      return {
        date: data.date,
        label: data.label,
        surchargePct: Number(data.surcharge_pct),
      };
    } catch (err) {
      console.warn("getPeakDay failed:", err);
      return null;
    }
  },
);

// Active peak days from today onward — for the public preview API.
export async function upcomingPeakDays(): Promise<PeakDay[]> {
  try {
    const admin = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await admin
      .from("peak_days")
      .select("date, label, surcharge_pct")
      .eq("active", true)
      .gte("date", today)
      .order("date", { ascending: true });
    return (data ?? []).map((d) => ({
      date: d.date,
      label: d.label,
      surchargePct: Number(d.surcharge_pct),
    }));
  } catch (err) {
    console.warn("upcomingPeakDays failed:", err);
    return [];
  }
}
