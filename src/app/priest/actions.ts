"use server";

import { revalidatePath } from "next/cache";

import { assertPriest } from "@/lib/priest";
import { createAdminClient } from "@/lib/supabase/admin";

function str(value: FormDataEntryValue | null): string {
  return ((value as string) ?? "").trim();
}

function csvToArray(value: FormDataEntryValue | null): string[] {
  return str(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// A priest updates their OWN working hours + blackout dates. The pandit is
// resolved from the session — no id is taken from the form, so a priest can
// only ever edit their own availability.
export async function updateMyAvailability(formData: FormData): Promise<void> {
  const pandit = await assertPriest();
  const admin = createAdminClient();

  await admin
    .from("pandits")
    .update({
      work_start: str(formData.get("work_start")) || "06:00",
      work_end: str(formData.get("work_end")) || "21:00",
      blackout_dates: csvToArray(formData.get("blackout_dates")),
    })
    .eq("id", pandit.id);

  revalidatePath("/priest/availability");
  revalidatePath("/priest");
}
