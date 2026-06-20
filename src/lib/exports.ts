// SERVER-ONLY: builds CSV exports of orders and bookings, optionally filtered
// by a created_at date range. Shared by the admin export routes and the
// scheduled accounting email.

import { createAdminClient } from "@/lib/supabase/admin";
import { toCsv } from "@/lib/csv";
import { invoiceNumber } from "@/lib/invoice";
import { placeOfSupply } from "@/lib/india";

const PAID_ORDER_STATUSES = [
  "paid",
  "packed",
  "shipped",
  "delivered",
] as const;

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

// GSTR-1 B2C (B2CS) summary: paid-order taxable value & tax aggregated by
// place of supply (state) and GST rate.
export async function buildGstr1Csv(
  from?: string | null,
  to?: string | null,
): Promise<string> {
  const admin = createAdminClient();
  const b = dayBounds(from, to);
  let query = admin
    .from("order_items")
    .select("line_total, gst_rate, orders!inner(state, status, created_at)")
    .in("orders.status", PAID_ORDER_STATUSES);
  if (b.from) query = query.gte("orders.created_at", b.from);
  if (b.to) query = query.lte("orders.created_at", b.to);
  const { data } = await query;

  const agg = new Map<
    string,
    { state: string; rate: number; taxable: number; tax: number }
  >();
  for (const i of data ?? []) {
    const state = i.orders?.state ?? "Unknown";
    const rate = Number(i.gst_rate) || 0;
    const taxable = Math.round(i.line_total / (1 + rate / 100));
    const tax = i.line_total - taxable;
    const key = `${state}|${rate}`;
    const e = agg.get(key) ?? { state, rate, taxable: 0, tax: 0 };
    e.taxable += taxable;
    e.tax += tax;
    agg.set(key, e);
  }

  const headers = [
    "Type",
    "Place Of Supply",
    "Rate",
    "Taxable Value",
    "Tax Amount",
    "Cess",
  ];
  const rows = [...agg.values()]
    .sort((a, b2) => a.state.localeCompare(b2.state) || a.rate - b2.rate)
    .map((r) => [
      "OE",
      placeOfSupply(r.state) ?? r.state,
      r.rate,
      r.taxable,
      r.tax,
      0,
    ]);
  return toCsv(headers, rows);
}
