// SERVER-ONLY: builds and sends transactional emails for orders and bookings.
// Each function is best-effort and never throws into its caller.

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailLayout } from "@/lib/email";
import { trackingUrl } from "@/lib/carriers";
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

export async function sendBackInStockEmails(productId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: product } = await admin
      .from("products")
      .select("name, slug, stock")
      .eq("id", productId)
      .maybeSingle();
    if (!product || product.stock <= 0) return;

    // Collect unique recipients from wishlists and explicit restock sign-ups.
    const recipients = new Map<string, string>(); // email -> name

    const { data: wishers } = await admin
      .from("wishlists")
      .select("user_id")
      .eq("product_id", productId);
    for (const w of wishers ?? []) {
      const r = await emailForUser(admin, w.user_id);
      if (r) recipients.set(r.email.toLowerCase(), r.name);
    }

    const { data: subs } = await admin
      .from("stock_subscriptions")
      .select("email")
      .eq("product_id", productId)
      .is("notified_at", null);
    for (const s of subs ?? []) {
      const key = s.email.toLowerCase();
      if (!recipients.has(key)) recipients.set(key, "there");
    }

    if (recipients.size === 0) return;

    for (const [email, name] of recipients) {
      const body = `
        <p>Hi ${name}, good news — <strong>${product.name}</strong> is back in stock!</p>
        <a href="${siteUrl}/store/${product.slug}" style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;padding:10px 20px;border-radius:999px;margin-top:8px">Shop now</a>`;
      await sendEmail({
        to: email,
        subject: `${product.name} is back in stock 🛍️`,
        html: emailLayout("Back in stock", body),
      });
    }

    // One-shot: don't email the same sign-up again on the next restock.
    if (subs?.length) {
      await admin
        .from("stock_subscriptions")
        .update({ notified_at: new Date().toISOString() })
        .eq("product_id", productId)
        .is("notified_at", null);
    }
  } catch (err) {
    console.error("sendBackInStockEmails failed:", err);
  }
}

type CartLineItem = { name?: string; price?: number; quantity?: number };

export async function sendAbandonedCartEmail(
  userId: string,
  items: CartLineItem[],
): Promise<void> {
  try {
    const admin = createAdminClient();
    const recipient = await emailForUser(admin, userId);
    if (!recipient) return;

    const rows = items
      .filter((i) => i.name)
      .map(
        (i) =>
          `<li style="margin:6px 0">${i.name} × ${i.quantity ?? 1}</li>`,
      )
      .join("");

    const body = `
      <p>Hi ${recipient.name}, you left some items in your cart. They're still waiting for you!</p>
      <ul style="padding-left:18px">${rows}</ul>
      <a href="${siteUrl}/cart" style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;padding:10px 20px;border-radius:999px;margin-top:8px">Complete your order</a>`;

    await sendEmail({
      to: recipient.email,
      subject: "You left something in your cart 🛒",
      html: emailLayout("Still thinking it over?", body),
    });
  } catch (err) {
    console.error("sendAbandonedCartEmail failed:", err);
  }
}

const ORDER_STATUS_MESSAGE: Record<string, string> = {
  paid: "is confirmed and being prepared",
  packed: "has been packed and is ready to ship",
  shipped: "is on its way to you",
  delivered: "has been delivered — we hope you love it",
  cancelled: "has been cancelled",
};

export async function sendOrderStatusUpdate(
  orderId: string,
  status: string,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("user_id, tracking_number, estimated_delivery, carrier")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return;

    const recipient = await emailForUser(admin, order.user_id);
    if (!recipient) return;

    const message = ORDER_STATUS_MESSAGE[status] ?? `is now ${status}`;
    const details: string[] = [];
    if (order.tracking_number) {
      const url = trackingUrl(order.carrier, order.tracking_number);
      const tracking = url
        ? `<a href="${url}" style="color:#d97706">${order.tracking_number}</a>`
        : `<strong>${order.tracking_number}</strong>`;
      details.push(`<p>Tracking number: ${tracking}</p>`);
    }
    if (order.estimated_delivery) {
      details.push(
        `<p>Estimated delivery: <strong>${order.estimated_delivery}</strong></p>`,
      );
    }
    const body = `
      <p>Hi ${recipient.name}, your order ${message}.</p>
      ${details.join("")}
      <a href="${siteUrl}/account/orders" style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;padding:10px 20px;border-radius:999px;margin-top:8px">Track your order</a>`;

    await sendEmail({
      to: recipient.email,
      subject: `Order update: ${status} 📦`,
      html: emailLayout("Order update", body),
    });
  } catch (err) {
    console.error("sendOrderStatusUpdate failed:", err);
  }
}

// Emails CSV exports to the accounting address (used by the scheduled cron).
export async function sendAccountingExport(
  periodLabel: string,
  files: { filename: string; csv: string }[],
): Promise<void> {
  try {
    const to = process.env.ACCOUNTING_EMAIL;
    if (!to) {
      console.warn("[email] ACCOUNTING_EMAIL not set — skipping export");
      return;
    }
    const body = `
      <p>Attached are the BookMyPoojari accounting exports for ${periodLabel}.</p>
      <ul>${files.map((f) => `<li>${f.filename}</li>`).join("")}</ul>`;
    await sendEmail({
      to,
      subject: `Accounting export — ${periodLabel}`,
      html: emailLayout("Accounting export", body),
      attachments: files.map((f) => ({
        filename: f.filename,
        content: Buffer.from(f.csv, "utf-8").toString("base64"),
      })),
    });
  } catch (err) {
    console.error("sendAccountingExport failed:", err);
  }
}

export async function sendRefundConfirmation(
  orderId: string,
  amountInr: number,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("user_id")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return;

    const recipient = await emailForUser(admin, order.user_id);
    if (!recipient) return;

    const body = `
      <p>Hi ${recipient.name}, we've processed a refund of <strong>${formatINR(amountInr)}</strong> for your order.</p>
      <p>It should reflect in your original payment method within 5–7 business days.</p>`;

    await sendEmail({
      to: recipient.email,
      subject: "Your refund has been processed 💸",
      html: emailLayout("Refund processed", body),
    });
  } catch (err) {
    console.error("sendRefundConfirmation failed:", err);
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
