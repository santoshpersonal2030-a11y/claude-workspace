"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertPriest } from "@/lib/priest";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  notifyAdminBookingDeclined,
  notifyCustomerPriestAccepted,
  notifyCustomerReassigning,
} from "@/lib/notifications";
import { logPriestEvent } from "@/lib/booking-events";

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
// assignment. Before accepting we guard against double-booking: any OTHER
// already-accepted booking on the same day that overlaps blocks it (and the
// priest is bounced back with ?clash=1). Status is left untouched — acceptance
// is recorded separately so the admin/customer see the priest has confirmed.
export async function acceptMyBooking(formData: FormData): Promise<void> {
  const pandit = await assertPriest();
  const admin = createAdminClient();
  const id = str(formData.get("booking_id"));
  if (!id) return;

  // Load the target and confirm it's this priest's still-pending assignment.
  const { data: target } = await admin
    .from("bookings")
    .select("id, booking_date, time_slot, starts_at, ends_at, priest_response")
    .eq("id", id)
    .eq("pandit_id", pandit.id)
    .maybeSingle();
  if (!target || target.priest_response !== "pending") return;

  // Other bookings this priest has already accepted on the same date.
  const { data: sameDay } = await admin
    .from("bookings")
    .select("id, time_slot, starts_at, ends_at")
    .eq("pandit_id", pandit.id)
    .eq("priest_response", "accepted")
    .eq("booking_date", target.booking_date)
    .neq("id", id)
    .neq("status", "cancelled");

  // Clash if the anchored time windows overlap, or — when times aren't yet
  // anchored — if it's the very same slot on that day.
  const clash = (sameDay ?? []).some((b) => {
    if (target.starts_at && target.ends_at && b.starts_at && b.ends_at) {
      return (
        new Date(target.starts_at) < new Date(b.ends_at) &&
        new Date(b.starts_at) < new Date(target.ends_at)
      );
    }
    return b.time_slot === target.time_slot;
  });

  if (clash) {
    revalidatePath("/priest/calendar");
    redirect("/priest/calendar?clash=1");
  }

  const { data: accepted } = await admin
    .from("bookings")
    .update({
      priest_response: "accepted",
      priest_responded_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("pandit_id", pandit.id)
    .eq("priest_response", "pending")
    .select("id");

  // Log the acceptance and let the customer know their Pandit is confirmed.
  if (accepted && accepted.length > 0) {
    await logPriestEvent({
      bookingId: id,
      panditId: pandit.id,
      action: "accepted",
    });
    await notifyCustomerPriestAccepted(id);
  }

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
  const reason = str(formData.get("reason"));

  // A reason is required so the team (and audit trail) knows why it bounced.
  if (!reason) {
    revalidatePath("/priest/calendar");
    redirect("/priest/calendar?needreason=1");
  }

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

  // Only act if a booking was actually declined (it was theirs + open): log it,
  // alert the team to reassign, and reassure the customer.
  if (updated && updated.length > 0) {
    await logPriestEvent({
      bookingId: id,
      panditId: pandit.id,
      action: "declined",
      reason,
    });
    await notifyAdminBookingDeclined(id, pandit.full_name, reason);
    await notifyCustomerReassigning(id);
  }

  revalidatePath("/priest/calendar");
  revalidatePath("/priest");
}
