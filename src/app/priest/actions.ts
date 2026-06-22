"use server";

import { revalidatePath } from "next/cache";

import { assertPriest } from "@/lib/priest";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdminBookingDeclined } from "@/lib/notifications";

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

// A priest ACCEPTS a booking the admin assigned to them. The update is filtered
// to the priest's own pandit id (resolved from the session) and to bookings
// still awaiting a response, so a priest can only ever accept their own pending
// assignment. Status is left untouched — acceptance is recorded separately so
// the admin/customer see the priest has confirmed.
export async function acceptMyBooking(formData: FormData): Promise<void> {
  const pandit = await assertPriest();
  const admin = createAdminClient();
  const id = str(formData.get("booking_id"));
  if (!id) return;

  await admin
    .from("bookings")
    .update({
      priest_response: "accepted",
      priest_responded_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("pandit_id", pandit.id)
    .eq("priest_response", "pending");

  revalidatePath("/priest/calendar");
  revalidatePath("/priest");
}

// A priest DECLINES a booking. We first verify the booking is theirs and still
// open, then record who declined (+ reason) and auto-unassign: clear pandit_id
// and revert the status to "confirmed" so it returns to the admin's queue for
// reassignment. Filtering the update to the priest's own id keeps a priest from
// touching anyone else's booking.
export async function declineMyBooking(formData: FormData): Promise<void> {
  const pandit = await assertPriest();
  const admin = createAdminClient();
  const id = str(formData.get("booking_id"));
  if (!id) return;
  const reason = str(formData.get("reason")) || null;

  const { data: updated } = await admin
    .from("bookings")
    .update({
      priest_response: "declined",
      decline_reason: reason,
      declined_by_pandit_id: pandit.id,
      priest_responded_at: new Date().toISOString(),
      pandit_id: null,
      status: "confirmed",
    })
    .eq("id", id)
    .eq("pandit_id", pandit.id)
    .in("status", ["assigned", "confirmed"] as const)
    .select("id");

  // Only alert the team if a booking was actually declined (it was theirs+open).
  if (updated && updated.length > 0) {
    await notifyAdminBookingDeclined(id, pandit.full_name, reason);
  }

  revalidatePath("/priest/calendar");
  revalidatePath("/priest");
}
