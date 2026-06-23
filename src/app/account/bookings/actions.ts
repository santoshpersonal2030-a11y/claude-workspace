"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRefund, razorpayConfigured } from "@/lib/razorpay";
import {
  notifyBookingCancelled,
  notifyBookingRescheduled,
  notifyPriestAssignment,
} from "@/lib/notifications";
import { SELF_SERVE_HOURS } from "@/lib/booking-policy";

function str(value: FormDataEntryValue | null): string {
  return ((value as string) ?? "").trim();
}

const CANCELLABLE = ["pending", "confirmed", "assigned"];

function hoursUntil(dateStr: string): number {
  return (
    (new Date(`${dateStr}T00:00:00+05:30`).getTime() - Date.now()) / 3_600_000
  );
}

// Customer cancels their own booking. Refunds the captured payment in full when
// cancelled at least SELF_SERVE_HOURS before the date; later cancellations are
// allowed but the refund is left to support.
export async function cancelBooking(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/bookings");

  const id = str(formData.get("id"));
  if (!id) return;

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, booking_date")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!booking || !CANCELLABLE.includes(booking.status)) {
    redirect(`/account/bookings/${id}`);
  }

  let refundInr = 0;
  if (hoursUntil(booking.booking_date) >= SELF_SERVE_HOURS && razorpayConfigured()) {
    const { data: payment } = await admin
      .from("payments")
      .select("id, amount, refunded_amount, razorpay_payment_id")
      .eq("booking_id", id)
      .eq("payment_for", "booking")
      .eq("status", "captured")
      .maybeSingle();
    const remaining = payment
      ? payment.amount - payment.refunded_amount
      : 0;
    if (payment?.razorpay_payment_id && remaining > 0) {
      try {
        await createRefund({
          paymentId: payment.razorpay_payment_id,
          notes: { booking_id: id },
        });
        refundInr = remaining;
        await admin
          .from("payments")
          .update({ refunded_amount: payment.amount, status: "refunded" })
          .eq("id", payment.id);
      } catch (err) {
        console.error("cancelBooking refund failed:", err);
      }
    }
  }

  await admin.from("bookings").update({ status: "cancelled" }).eq("id", id);
  await notifyBookingCancelled(id, refundInr);

  revalidatePath("/account/bookings");
  revalidatePath(`/account/bookings/${id}`);
  redirect(`/account/bookings/${id}`);
}

// Customer reschedules their own booking to a new date/time (≥ SELF_SERVE_HOURS
// before the current date). Un-anchors the slot and, if a Pandit was assigned,
// resets their response so they re-accept the new time.
export async function rescheduleBooking(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/bookings");

  const id = str(formData.get("id"));
  const newDate = str(formData.get("booking_date"));
  const newSlot = str(formData.get("time_slot"));
  if (!id || !newDate || !newSlot) return;

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, booking_date, pandit_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!booking || !CANCELLABLE.includes(booking.status)) {
    redirect(`/account/bookings/${id}`);
  }
  if (hoursUntil(booking.booking_date) < SELF_SERVE_HOURS) {
    redirect(`/account/bookings/${id}?late=1`);
  }

  const update: {
    booking_date: string;
    time_slot: string;
    starts_at: null;
    ends_at: null;
    priest_response?: "pending";
    priest_responded_at?: null;
  } = {
    booking_date: newDate,
    time_slot: newSlot,
    starts_at: null,
    ends_at: null,
  };
  if (booking.pandit_id) {
    update.priest_response = "pending";
    update.priest_responded_at = null;
  }

  await admin.from("bookings").update(update).eq("id", id);
  if (booking.pandit_id) await notifyPriestAssignment(id);
  await notifyBookingRescheduled(id);

  revalidatePath("/account/bookings");
  revalidatePath(`/account/bookings/${id}`);
  redirect(`/account/bookings/${id}`);
}

// Customer reviews the Pandit from a COMPLETED booking. Upsert (one per booking)
// via the anon client so RLS confines it to their own user_id; a DB trigger
// refreshes the Pandit's average rating + count.
export async function submitPanditReview(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/bookings");

  const bookingId = str(formData.get("booking_id"));
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating")) || 0));
  if (!bookingId || rating < 1) return;

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, pandit_id, status")
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!booking?.pandit_id || booking.status !== "completed") return;

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  await supabase.from("pandit_reviews").upsert(
    {
      user_id: user.id,
      booking_id: bookingId,
      pandit_id: booking.pandit_id,
      rating,
      title: str(formData.get("title")) || null,
      body: str(formData.get("body")) || null,
      reviewer_name: profile?.full_name?.trim() || "A devotee",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,booking_id" },
  );

  revalidatePath(`/account/bookings/${bookingId}`);
  revalidatePath("/pandits");
  redirect(`/account/bookings/${bookingId}`);
}

// Raises a dispute on the customer's own booking. Inserts via the user session
// (RLS verifies ownership); the partial unique index prevents a second open
// dispute on the same booking.
export async function raiseBookingDispute(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const bookingId = str(formData.get("booking_id"));
  const category = str(formData.get("category"));
  const details = str(formData.get("details"));
  const allowed = ["no_show", "quality", "payment", "reschedule", "other"];
  if (!bookingId || !allowed.includes(category)) return;

  // Confirm the booking is the caller's before inserting.
  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!booking) return;

  await supabase.from("booking_disputes").insert({
    booking_id: bookingId,
    user_id: user.id,
    category,
    details: details.slice(0, 2000),
  });

  revalidatePath(`/account/bookings/${bookingId}`);
}
