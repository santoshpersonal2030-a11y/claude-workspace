import { createAdminClient } from "@/lib/supabase/admin";

type CaptureResult = {
  ok: boolean;
  status: "captured" | "already" | "not_found";
};

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
    .select("id, payment_for, booking_id, order_id")
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
    await admin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", payment.booking_id);
  } else if (payment.payment_for === "order" && payment.order_id) {
    await admin
      .from("orders")
      .update({ status: "paid" })
      .eq("id", payment.order_id);
    // Decrement inventory atomically in the database.
    await admin.rpc("decrement_stock_for_order", {
      p_order_id: payment.order_id,
    });
  }

  return { ok: true, status: "captured" };
}
