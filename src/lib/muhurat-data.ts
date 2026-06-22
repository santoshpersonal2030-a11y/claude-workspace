// SERVER-ONLY: public read of APPROVED muhurat windows for the customer-facing
// auspicious-dates page. muhurat_windows is service-role only; reads go through
// the admin client and are strictly filtered to approved = true so unvetted
// candidates never leak.

import { createAdminClient } from "@/lib/supabase/admin";

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
