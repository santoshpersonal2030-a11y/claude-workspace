import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendOrderConfirmation,
  sendBookingConfirmation,
  sendConsultationConfirmation,
} from "@/lib/notifications";
import {
  grantLoyalty,
  grantReferralReward,
  settleRedemption,
} from "@/lib/wallet";

type CaptureResult = {
  ok: boolean;
  status: "captured" | "already" | "not_found";
};

// Side effects when an order becomes paid: stock, confirmation email, and
// wallet rewards (settle any credit redeemed, earn loyalty, pay out referral).
// Guarded on the order status so it runs exactly once whether triggered by a
// Razorpay capture or by a fully-credit-covered checkout.
export async function finalizeOrderPaid(orderId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .neq("status", "paid")
    .select("id, user_id, total_amount, wallet_used")
    .maybeSingle();
  if (!order) return; // already finalised, or not found

  await admin.rpc("decrement_stock_for_order", { p_order_id: orderId });
  await sendOrderConfirmation(orderId);

  await settleRedemption(order.user_id, order.wallet_used ?? 0, {
    orderId: order.id,
  });
  await grantLoyalty(
    order.user_id,
    order.total_amount - (order.wallet_used ?? 0),
    { orderId: order.id },
  );
  await grantReferralReward(order.user_id, { orderId: order.id });
}

// Rewards for a freshly-confirmed booking (and any package siblings): settle
// redeemed credit, earn loyalty on the cash paid, and pay out a pending
// referral once.
async function rewardConfirmedBookings(
  rows: { id: string; user_id: string; total_amount: number; wallet_used: number }[],
): Promise<void> {
  for (const b of rows) {
    await settleRedemption(b.user_id, b.wallet_used ?? 0, { bookingId: b.id });
    await grantLoyalty(b.user_id, b.total_amount - (b.wallet_used ?? 0), {
      bookingId: b.id,
    });
  }
  const userId = rows[0]?.user_id;
  if (userId) await grantReferralReward(userId, { bookingId: rows[0].id });
}

// Marks a payment (and its parent booking/order) as paid, exactly once.
//
// Both the client-side verify route and the Razorpay webhook call this, so the
// status transition is the idempotency guard: only the first caller to flip the
// payment from a non-captured state to "captured" performs the side effects
// (confirming the booking / marking the order paid + decrementing stock).
//
// Callers MUST verify the Razorpay signature before calling this.
export async function capturePaymentByRazorpayOrder(params: {
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  signature?: string;
}): Promise<CaptureResult> {
  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("payments")
    .select("id, payment_for, booking_id, order_id, consultation_id")
    .eq("razorpay_order_id", params.razorpayOrderId)
    .maybeSingle();

  if (!payment) return { ok: false, status: "not_found" };

  const update: {
    status: "captured";
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  } = { status: "captured" };
  if (params.razorpayPaymentId) {
    update.razorpay_payment_id = params.razorpayPaymentId;
  }
  if (params.signature) update.razorpay_signature = params.signature;

  // Atomic guard: the `.neq("status", "captured")` filter means concurrent
  // verify + webhook calls can't both pass — only one update affects a row.
  const { data: updated } = await admin
    .from("payments")
    .update(update)
    .eq("id", payment.id)
    .neq("status", "captured")
    .select("id");

  if (!updated || updated.length === 0) {
    return { ok: true, status: "already" };
  }

  if (payment.payment_for === "booking" && payment.booking_id) {
    const { data: confirmed } = await admin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", payment.booking_id)
      .select("package_id")
      .maybeSingle();
    // A package payment confirms all of its ceremonies together.
    if (confirmed?.package_id) {
      await admin
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("package_id", confirmed.package_id)
        .eq("status", "pending");
    }
    await sendBookingConfirmation(payment.booking_id);

    // Reward the booking (plus any package siblings) once it's confirmed.
    const rewardQuery = admin
      .from("bookings")
      .select("id, user_id, total_amount, wallet_used");
    const { data: rows } = confirmed?.package_id
      ? await rewardQuery.eq("package_id", confirmed.package_id)
      : await rewardQuery.eq("id", payment.booking_id);
    if (rows) await rewardConfirmedBookings(rows);
  } else if (payment.payment_for === "order" && payment.order_id) {
    await finalizeOrderPaid(payment.order_id);
  } else if (
    payment.payment_for === "consultation" &&
    payment.consultation_id
  ) {
    // Confirm the consultation; an admin then assigns an astrologer and (for
    // video) shares the meeting link. Guarded so it runs once.
    const { data: confirmed } = await admin
      .from("consultation_bookings")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", payment.consultation_id)
      .neq("status", "confirmed")
      .select("id")
      .maybeSingle();
    if (confirmed) await sendConsultationConfirmation(payment.consultation_id);
  }

  return { ok: true, status: "captured" };
}
