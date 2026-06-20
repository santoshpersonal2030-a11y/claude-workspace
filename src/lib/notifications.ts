// SERVER-ONLY: builds and sends transactional emails for orders and bookings.
// Each function is best-effort and never throws into its caller.

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailLayout } from "@/lib/email";
import { formatINR } from "@/lib/poojas";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookmypoojari.com";

async function emailForUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<{ email: string; name: string } | null> {
  const { data } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (!data?.email) return null;
  return { email: data.email, name: data.full_name?.trim() || "there" };
}

export async function sendOrderConfirmation(orderId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select(
        "id, user_id, total_amount, subtotal, shipping, order_items(product_name, quantity, line_total)",
      )
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return;

    const recipient = await emailForUser(admin, order.user_id);
    if (!recipient) return;

    const rows = order.order_items
      .map(
        (i) =>
          `<tr><td style="padding:4px 0">${i.product_name} × ${i.quantity}</td>` +
          `<td style="padding:4px 0;text-align:right">${formatINR(i.line_total)}</td></tr>`,
      )
      .join("");

    const body = `
      <p>Hi ${recipient.name}, thank you for your order! It's confirmed and being prepared.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        ${rows}
        <tr><td style="padding-top:8px;border-top:1px solid #f3e2cb">Shipping</td>
          <td style="padding-top:8px;border-top:1px solid #f3e2cb;text-align:right">${
            order.shipping === 0 ? "Free" : formatINR(order.shipping)
          }</td></tr>
        <tr><td style="font-weight:600">Total</td>
          <td style="font-weight:600;text-align:right">${formatINR(order.total_amount)}</td></tr>
      </table>
      <a href="${siteUrl}/account/orders" style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;padding:10px 20px;border-radius:999px">View your orders</a>`;

    await sendEmail({
      to: recipient.email,
      subject: "Your BookMyPoojari order is confirmed 🙏",
      html: emailLayout("Order confirmed", body),
    });
  } catch (err) {
    console.error("sendOrderConfirmation failed:", err);
  }
}

export async function sendBookingConfirmation(
  bookingId: string,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: booking } = await admin
      .from("bookings")
      .select(
        "id, user_id, booking_date, time_slot, total_amount, poojas(name)",
      )
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking) return;

    const recipient = await emailForUser(admin, booking.user_id);
    if (!recipient) return;

    const body = `
      <p>Hi ${recipient.name}, your booking is confirmed. We'll assign a verified Pandit and be in touch shortly.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 0;color:#9a8c7a">Pooja</td><td style="padding:4px 0;text-align:right">${booking.poojas?.name ?? "Pooja"}</td></tr>
        <tr><td style="padding:4px 0;color:#9a8c7a">Date</td><td style="padding:4px 0;text-align:right">${booking.booking_date}</td></tr>
        <tr><td style="padding:4px 0;color:#9a8c7a">Time</td><td style="padding:4px 0;text-align:right">${booking.time_slot}</td></tr>
        <tr><td style="font-weight:600">Total</td><td style="font-weight:600;text-align:right">${formatINR(booking.total_amount)}</td></tr>
      </table>
      <a href="${siteUrl}/account/bookings" style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;padding:10px 20px;border-radius:999px">View your bookings</a>`;

    await sendEmail({
      to: recipient.email,
      subject: "Your BookMyPoojari booking is confirmed 🙏",
      html: emailLayout("Booking confirmed", body),
    });
  } catch (err) {
    console.error("sendBookingConfirmation failed:", err);
  }
}

export async function sendReviewRequest(orderId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("id, user_id, order_items(product_name, products(slug))")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return;

    const recipient = await emailForUser(admin, order.user_id);
    if (!recipient) return;

    const links = order.order_items
      .filter((i) => i.products?.slug)
      .map(
        (i) =>
          `<li style="margin:6px 0"><a href="${siteUrl}/store/${i.products!.slug}" style="color:#d97706">${i.product_name}</a></li>`,
      )
      .join("");

    const body = `
      <p>Hi ${recipient.name}, we hope you're enjoying your samagri! Your honest review helps other devotees.</p>
      <ul style="padding-left:18px">${links}</ul>
      <p style="color:#9a8c7a;font-size:13px">It only takes a moment to leave a rating.</p>`;

    await sendEmail({
      to: recipient.email,
      subject: "How was your BookMyPoojari order? 🌟",
      html: emailLayout("Share your experience", body),
    });
  } catch (err) {
    console.error("sendReviewRequest failed:", err);
  }
}
