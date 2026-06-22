// SERVER-ONLY: builds and sends transactional emails for orders and bookings.
// Each function is best-effort and never throws into its caller.

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailLayout } from "@/lib/email";
import { trackingUrl } from "@/lib/carriers";
import { simplePdf } from "@/lib/pdf";
import { buildOrderInvoicePdf } from "@/lib/invoice-pdf";
import { getLogoJpeg } from "@/lib/logo";
import { invoiceNumber } from "@/lib/invoice";
import { amountInWords } from "@/lib/amount-in-words";
import { getCompany } from "@/lib/company-settings";
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
        "id, user_id, invoice_no, invoice_fy, status, irn, ewb_no, created_at, total_amount, subtotal, shipping, delivery_name, delivery_phone, address, city, state, pincode, order_items(id, product_name, quantity, unit_price, line_total, gst_rate, hsn_code)",
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
      <p>Hi ${recipient.name}, thank you for your order! It's confirmed and being prepared. Your tax invoice is attached.</p>
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

    const pdf = buildOrderInvoicePdf(
      order,
      await getLogoJpeg(),
      await getCompany(),
    );
    const invNo = invoiceNumber(order.invoice_no, order.invoice_fy).replace(
      /\//g,
      "-",
    );

    await sendEmail({
      to: recipient.email,
      subject: "Your BookMyPoojari order is confirmed 🙏",
      html: emailLayout("Order confirmed", body),
      attachments: [
        { filename: `${invNo}.pdf`, content: pdf.toString("base64") },
      ],
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

// Notifies the assigned priest (at their login email) that a new ceremony has
// been assigned to them, with a link to accept or decline in their portal.
// Best-effort — never throws into the admin action that triggers it.
export async function notifyPriestAssignment(bookingId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: booking } = await admin
      .from("bookings")
      .select(
        "id, booking_date, time_slot, city, pincode, language, poojas(name), assigned:pandits!bookings_pandit_id_fkey(full_name, login_email)",
      )
      .eq("id", bookingId)
      .maybeSingle();
    const priest = booking?.assigned;
    if (!priest?.login_email) return;

    const body = `
      <p>Namaste ${priest.full_name?.trim() || "Panditji"}, a new ceremony has been assigned to you. Please accept it if you're available, or decline so the team can reassign.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 0;color:#9a8c7a">Pooja</td><td style="padding:4px 0;text-align:right">${booking?.poojas?.name ?? "Pooja"}</td></tr>
        <tr><td style="padding:4px 0;color:#9a8c7a">Date</td><td style="padding:4px 0;text-align:right">${booking?.booking_date}</td></tr>
        <tr><td style="padding:4px 0;color:#9a8c7a">Time</td><td style="padding:4px 0;text-align:right">${(booking?.time_slot ?? "").slice(0, 5)}</td></tr>
        <tr><td style="padding:4px 0;color:#9a8c7a">Location</td><td style="padding:4px 0;text-align:right">${booking?.city ?? ""} ${booking?.pincode ?? ""}</td></tr>
        ${booking?.language ? `<tr><td style="padding:4px 0;color:#9a8c7a">Language</td><td style="padding:4px 0;text-align:right">${booking.language}</td></tr>` : ""}
      </table>
      <a href="${siteUrl}/priest/calendar" style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;padding:10px 20px;border-radius:999px">Accept or decline →</a>`;

    await sendEmail({
      to: priest.login_email,
      subject: "New ceremony assigned — please accept or decline 🙏",
      html: emailLayout("New booking assigned to you", body),
    });
  } catch (err) {
    console.error("notifyPriestAssignment failed:", err);
  }
}

// Notifies the operations inbox (company email, falling back to EMAIL_FROM) that
// a priest declined an assignment, so someone reassigns it. Best-effort.
export async function notifyAdminBookingDeclined(
  bookingId: string,
  panditName: string,
  reason: string | null,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: booking } = await admin
      .from("bookings")
      .select("id, booking_date, time_slot, city, poojas(name)")
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking) return;

    const company = await getCompany();
    const to = company.email || process.env.EMAIL_FROM;
    if (!to) return;

    const body = `
      <p><strong>${panditName}</strong> declined a ceremony. It has been unassigned and is back in the queue — please assign another priest.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 0;color:#9a8c7a">Pooja</td><td style="padding:4px 0;text-align:right">${booking.poojas?.name ?? "Pooja"}</td></tr>
        <tr><td style="padding:4px 0;color:#9a8c7a">Date</td><td style="padding:4px 0;text-align:right">${booking.booking_date}</td></tr>
        <tr><td style="padding:4px 0;color:#9a8c7a">Time</td><td style="padding:4px 0;text-align:right">${(booking.time_slot ?? "").slice(0, 5)}</td></tr>
        <tr><td style="padding:4px 0;color:#9a8c7a">City</td><td style="padding:4px 0;text-align:right">${booking.city ?? ""}</td></tr>
        ${reason ? `<tr><td style="padding:4px 0;color:#9a8c7a">Reason</td><td style="padding:4px 0;text-align:right">${reason}</td></tr>` : ""}
      </table>
      <a href="${siteUrl}/admin/bookings" style="display:inline-block;background:#7a1f1f;color:#fff;text-decoration:none;padding:10px 20px;border-radius:999px">Reassign in admin →</a>`;

    await sendEmail({
      to,
      subject: "A priest declined a booking — reassign needed",
      html: emailLayout("Booking needs reassignment", body),
    });
  } catch (err) {
    console.error("notifyAdminBookingDeclined failed:", err);
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

// Hours of remaining validity at/under which an EWB is considered "expiring".
const EWB_ALERT_WINDOW_HOURS = Number(
  process.env.EWB_ALERT_WINDOW_HOURS ?? 6,
);

// Emails the admin a digest of e-way bills whose validity expires within the
// alert window (and aren't yet delivered). Marks each order as alerted so the
// hourly cron doesn't repeat. Returns the number of consignments flagged.
export async function sendEwbExpiryAlerts(): Promise<number> {
  try {
    const admin = createAdminClient();
    const company = await getCompany();
    const cutoff = new Date(
      Date.now() + EWB_ALERT_WINDOW_HOURS * 3_600_000,
    ).toISOString();

    const { data: orders } = await admin
      .from("orders")
      .select(
        "id, invoice_no, invoice_fy, ewb_no, ewb_valid_until, delivery_name, total_amount",
      )
      .not("ewb_no", "is", null)
      .not("ewb_valid_until", "is", null)
      .lte("ewb_valid_until", cutoff)
      .is("ewb_expiry_alerted_at", null)
      .in("status", ["paid", "packed", "shipped"] as const);

    if (!orders?.length) return 0;

    const to =
      process.env.EWB_ALERT_EMAIL ||
      process.env.ACCOUNTING_EMAIL ||
      company.email;
    if (!to) {
      console.warn("[email] no EWB alert recipient configured — skipping");
      return 0;
    }

    const now = Date.now();
    const rows = orders
      .map((o) => {
        const ms = new Date(o.ewb_valid_until!).getTime() - now;
        const when =
          ms <= 0
            ? "<strong style=\"color:#9f1239\">expired</strong>"
            : `${Math.floor(ms / 3_600_000)}h ${Math.floor(
                (ms % 3_600_000) / 60_000,
              )}m left`;
        return (
          `<tr><td style="padding:6px 12px 6px 0">` +
          `<a href="${siteUrl}/admin/orders/${o.id}" style="color:#d97706">${invoiceNumber(
            o.invoice_no,
            o.invoice_fy,
          )}</a></td>` +
          `<td style="padding:6px 12px 6px 0">EWB ${o.ewb_no}</td>` +
          `<td style="padding:6px 12px 6px 0">${o.delivery_name ?? ""}</td>` +
          `<td style="padding:6px 0">${when}</td></tr>`
        );
      })
      .join("");

    const body = `
      <p>The following e-way bill${orders.length > 1 ? "s" : ""} expire within
      ${EWB_ALERT_WINDOW_HOURS} hours. Extend validity (Part-B) or complete
      delivery before they lapse.</p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px">
        ${rows}
      </table>`;

    await sendEmail({
      to,
      subject: `⚠️ ${orders.length} e-way bill${
        orders.length > 1 ? "s" : ""
      } expiring soon`,
      html: emailLayout("E-way bills expiring", body),
    });

    await admin
      .from("orders")
      .update({ ewb_expiry_alerted_at: new Date().toISOString() })
      .in(
        "id",
        orders.map((o) => o.id),
      );

    return orders.length;
  } catch (err) {
    console.error("sendEwbExpiryAlerts failed:", err);
    return 0;
  }
}

export async function sendCreditNoteEmail(params: {
  orderId: string;
  userId: string | null;
  creditNote: {
    invoice_no: number | null;
    invoice_fy: number | null;
    amount: number;
    reason: string | null;
  };
}): Promise<void> {
  try {
    if (!params.userId) return;
    const admin = createAdminClient();
    const recipient = await emailForUser(admin, params.userId);
    if (!recipient) return;

    const { data: order } = await admin
      .from("orders")
      .select("invoice_no, invoice_fy")
      .eq("id", params.orderId)
      .maybeSingle();

    const cn = params.creditNote;
    const cnNo = invoiceNumber(cn.invoice_no, cn.invoice_fy, "CN");
    const ordNo = order
      ? invoiceNumber(order.invoice_no, order.invoice_fy)
      : "";

    const company = await getCompany();
    const lines = [
      company.name,
      `GSTIN: ${company.gstin}`,
      "",
      `Credit Note: ${cnNo}`,
      `Against Invoice: ${ordNo}`,
      `Date: ${new Date().toLocaleDateString("en-IN")}`,
      "",
      `Refund amount: INR ${cn.amount}`,
      amountInWords(cn.amount),
      ...(cn.reason ? [`Reason: ${cn.reason}`] : []),
      "",
      "Refund processed to your original payment method.",
    ];
    const pdf = simplePdf("Credit Note", lines);

    const body = `
      <p>Hi ${recipient.name}, please find attached your credit note
      <strong>${cnNo}</strong> for a refund of
      <strong>${formatINR(cn.amount)}</strong>.</p>`;

    await sendEmail({
      to: recipient.email,
      subject: `Credit note ${cnNo}`,
      html: emailLayout("Credit note", body),
      attachments: [
        {
          filename: `${cnNo.replace(/\//g, "-")}.pdf`,
          content: pdf.toString("base64"),
        },
      ],
    });
  } catch (err) {
    console.error("sendCreditNoteEmail failed:", err);
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
