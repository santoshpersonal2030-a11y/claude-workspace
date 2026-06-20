// SERVER-ONLY: builds CSV exports of orders and bookings, optionally filtered
// by a created_at date range. Shared by the admin export routes and the
// scheduled accounting email.

import { createAdminClient } from "@/lib/supabase/admin";
import { toCsv } from "@/lib/csv";
import { invoiceNumber } from "@/lib/invoice";

function dayBounds(from?: string | null, to?: string | null) {
  return { from: from || null, to: to ? `${to}T23:59:59` : null };
}

export async function buildOrdersCsv(
  from?: string | null,
  to?: string | null,
): Promise<string> {
  const admin = createAdminClient();
  const b = dayBounds(from, to);
  let query = admin
    .from("orders")
    .select(
      "invoice_no, invoice_fy, id, created_at, status, delivery_name, delivery_phone, city, state, pincode, subtotal, shipping, total_amount, carrier, tracking_number, estimated_delivery",
    )
    .order("created_at", { ascending: false });
  if (b.from) query = query.gte("created_at", b.from);
  if (b.to) query = query.lte("created_at", b.to);
  const { data } = await query;

  const headers = [
    "Invoice",
    "Order ID",
    "Date",
    "Status",
    "Customer",
    "Phone",
    "City",
    "State",
    "Pincode",
    "Subtotal",
    "Shipping",
    "Total",
    "Carrier",
    "Tracking",
    "ETA",
  ];
  const rows = (data ?? []).map((o) => [
    invoiceNumber(o.invoice_no, o.invoice_fy),
    o.id,
    new Date(o.created_at).toISOString().slice(0, 10),
    o.status,
    o.delivery_name ?? "",
    o.delivery_phone ?? "",
    o.city ?? "",
    o.state ?? "",
    o.pincode ?? "",
    o.subtotal,
    o.shipping,
    o.total_amount,
    o.carrier ?? "",
    o.tracking_number ?? "",
    o.estimated_delivery ?? "",
  ]);
  return toCsv(headers, rows);
}

export async function buildBookingsCsv(
  from?: string | null,
  to?: string | null,
): Promise<string> {
  const admin = createAdminClient();
  const b = dayBounds(from, to);
  let query = admin
    .from("bookings")
    .select(
      "invoice_no, invoice_fy, id, created_at, status, booking_date, time_slot, language, city, total_amount, poojas(name), assigned:pandits!bookings_pandit_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false });
  if (b.from) query = query.gte("created_at", b.from);
  if (b.to) query = query.lte("created_at", b.to);
  const { data } = await query;

  const headers = [
    "Receipt",
    "Booking ID",
    "Booked on",
    "Status",
    "Pooja",
    "Date",
    "Time",
    "Language",
    "City",
    "Pandit",
    "Total",
  ];
  const rows = (data ?? []).map((b2) => [
    invoiceNumber(b2.invoice_no, b2.invoice_fy, "BKG"),
    b2.id,
    new Date(b2.created_at).toISOString().slice(0, 10),
    b2.status,
    b2.poojas?.name ?? "",
    b2.booking_date,
    b2.time_slot,
    b2.language ?? "",
    b2.city,
    b2.assigned?.full_name ?? "",
    b2.total_amount,
  ]);
  return toCsv(headers, rows);
}
