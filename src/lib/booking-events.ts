// SERVER-ONLY append-only audit of a booking's priest lifecycle: the admin
// assigning a priest, and the priest accepting/declining. Survives reassignment
// so the admin can see a booking's full response history. Best-effort — a
// logging failure never breaks the action that triggered it.

import { createAdminClient } from "@/lib/supabase/admin";

export type PriestEventAction =
  | "assigned"
  | "accepted"
  | "declined"
  | "proposed";

export const PRIEST_EVENT_LABEL: Record<PriestEventAction, string> = {
  assigned: "Assigned",
  accepted: "Accepted",
  declined: "Declined",
  proposed: "Proposed a new time",
};

export async function logPriestEvent(args: {
  bookingId: string;
  panditId: string | null;
  action: PriestEventAction;
  reason?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("booking_priest_events").insert({
      booking_id: args.bookingId,
      pandit_id: args.panditId,
      action: args.action,
      reason: args.reason ?? null,
    });
  } catch (err) {
    console.error("logPriestEvent failed:", err);
  }
}
