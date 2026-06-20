// SERVER-ONLY: builds CSV exports of orders and bookings, optionally filtered
// by a created_at date range. Shared by the admin export routes and the
// scheduled accounting email.

import { createAdminClient } from "@/lib/supabase/admin";
import { toCsv } from "@/lib/csv";
import { invoiceNumber } from "@/lib/invoice";
import { placeOfSupply, STATE_CODES } from "@/lib/india";
import { COMPANY } from "@/lib/company";

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

// GSTR-1 offline-tool JSON (B2CS section), aggregated by place of supply + rate.
export async function buildGstr1Json(
  from?: string | null,
  to?: string | null,
  period?: string | null,
): Promise<unknown> {
  const admin = createAdminClient();
  const b = dayBounds(from, to);
  let query = admin
    .from("order_items")
    .select(
      "line_total, gst_rate, quantity, hsn_code, orders!inner(state, status, created_at)",
    )
    .in("orders.status", PAID_ORDER_STATUSES);
  if (b.from) query = query.gte("orders.created_at", b.from);
  if (b.to) query = query.lte("orders.created_at", b.to);
  const { data } = await query;

  const companyCode = STATE_CODES[COMPANY.state] ?? "";

  // B2CS: by place of supply + rate.
  const b2csAgg = new Map<
    string,
    { state: string; rate: number; taxable: number; tax: number }
  >();
  // HSN: by HSN code + rate, with tax split by intra/inter per line.
  const hsnAgg = new Map<
    string,
    {
      hsn: string;
      rate: number;
      qty: number;
      txval: number;
      iamt: number;
      camt: number;
      samt: number;
    }
  >();

  for (const i of data ?? []) {
    const state = i.orders?.state ?? "";
    const rate = Number(i.gst_rate) || 0;
    const taxable = Math.round(i.line_total / (1 + rate / 100));
    const tax = i.line_total - taxable;
    const pos = STATE_CODES[state] ?? "";
    const intra = pos !== "" && pos === companyCode;
    const cgst = intra ? Math.floor(tax / 2) : 0;

    const bKey = `${state}|${rate}`;
    const be = b2csAgg.get(bKey) ?? { state, rate, taxable: 0, tax: 0 };
    be.taxable += taxable;
    be.tax += tax;
    b2csAgg.set(bKey, be);

    const hsn = i.hsn_code ?? "";
    const hKey = `${hsn}|${rate}`;
    const he =
      hsnAgg.get(hKey) ??
      { hsn, rate, qty: 0, txval: 0, iamt: 0, camt: 0, samt: 0 };
    he.qty += i.quantity;
    he.txval += taxable;
    he.iamt += intra ? 0 : tax;
    he.camt += cgst;
    he.samt += intra ? tax - cgst : 0;
    hsnAgg.set(hKey, he);
  }

  const b2cs = [...b2csAgg.values()].map((r) => {
    const pos = STATE_CODES[r.state] ?? "";
    const intra = pos !== "" && pos === companyCode;
    const camt = intra ? Math.floor(r.tax / 2) : 0;
    return {
      sply_ty: intra ? "INTRA" : "INTER",
      pos,
      typ: "OE",
      rt: r.rate,
      txval: r.taxable,
      iamt: intra ? 0 : r.tax,
      camt,
      samt: intra ? r.tax - camt : 0,
      csamt: 0,
    };
  });

  const hsn = {
    data: [...hsnAgg.values()].map((h, idx) => ({
      num: idx + 1,
      hsn_sc: h.hsn,
      uqc: "NOS",
      qty: h.qty,
      rt: h.rate,
      txval: h.txval,
      iamt: h.iamt,
      camt: h.camt,
      samt: h.samt,
      csamt: 0,
    })),
  };

  // B2B: orders that carry a buyer GSTIN, grouped by counterparty GSTIN.
  let b2bQuery = admin
    .from("orders")
    .select(
      "invoice_no, invoice_fy, created_at, customer_gstin, state, total_amount, order_items(line_total, gst_rate)",
    )
    .not("customer_gstin", "is", null)
    .in("status", PAID_ORDER_STATUSES);
  if (b.from) b2bQuery = b2bQuery.gte("created_at", b.from);
  if (b.to) b2bQuery = b2bQuery.lte("created_at", b.to);
  const { data: b2bOrders } = await b2bQuery;

  const byCtin = new Map<string, unknown[]>();
  for (const o of b2bOrders ?? []) {
    if (!o.customer_gstin) continue;
    const rateMap = new Map<number, { txval: number; tax: number }>();
    for (const it of o.order_items) {
      const rate = Number(it.gst_rate) || 0;
      const tv = Math.round(it.line_total / (1 + rate / 100));
      const e = rateMap.get(rate) ?? { txval: 0, tax: 0 };
      e.txval += tv;
      e.tax += it.line_total - tv;
      rateMap.set(rate, e);
    }
    const pos = STATE_CODES[o.state ?? ""] ?? "";
    const intra = pos !== "" && pos === companyCode;
    const itms = [...rateMap.entries()].map(([rate, v], idx) => ({
      num: idx + 1,
      itm_det: {
        rt: rate,
        txval: v.txval,
        iamt: intra ? 0 : v.tax,
        camt: intra ? Math.floor(v.tax / 2) : 0,
        samt: intra ? v.tax - Math.floor(v.tax / 2) : 0,
        csamt: 0,
      },
    }));
    const inv = {
      inum: invoiceNumber(o.invoice_no, o.invoice_fy),
      idt: new Date(o.created_at).toLocaleDateString("en-GB"),
      val: o.total_amount,
      pos,
      rchrg: "N",
      inv_typ: "R",
      itms,
    };
    const arr = byCtin.get(o.customer_gstin) ?? [];
    arr.push(inv);
    byCtin.set(o.customer_gstin, arr);
  }
  const b2b = [...byCtin.entries()].map(([ctin, inv]) => ({ ctin, inv }));

  const fpDate = b.to ? new Date(b.to) : new Date();
  const fp =
    period ||
    `${String(fpDate.getMonth() + 1).padStart(2, "0")}${fpDate.getFullYear()}`;

  return { gstin: COMPANY.gstin, fp, b2b, b2cs, hsn };
}

const ACTIVE_BOOKING_STATUSES = [
  "confirmed",
  "assigned",
  "completed",
] as const;

export type Gstr3bSummary = {
  taxable: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  exempt: number;
};

// GSTR-3B 3.1 summary: outward taxable supplies (store) and exempt supplies
// (religious services / bookings) for the period.
export async function buildGstr3b(
  from?: string | null,
  to?: string | null,
): Promise<Gstr3bSummary> {
  const admin = createAdminClient();
  const b = dayBounds(from, to);

  let itemsQ = admin
    .from("order_items")
    .select("line_total, gst_rate, orders!inner(state, status, created_at)")
    .in("orders.status", PAID_ORDER_STATUSES);
  if (b.from) itemsQ = itemsQ.gte("orders.created_at", b.from);
  if (b.to) itemsQ = itemsQ.lte("orders.created_at", b.to);
  const { data: items } = await itemsQ;

  const companyCode = STATE_CODES[COMPANY.state] ?? "";
  let taxable = 0;
  let igst = 0;
  let cgst = 0;
  let sgst = 0;
  for (const i of items ?? []) {
    const rate = Number(i.gst_rate) || 0;
    const tv = Math.round(i.line_total / (1 + rate / 100));
    const tax = i.line_total - tv;
    taxable += tv;
    const pos = i.orders?.state ? (STATE_CODES[i.orders.state] ?? "") : "";
    if (pos && pos === companyCode) {
      const c = Math.floor(tax / 2);
      cgst += c;
      sgst += tax - c;
    } else {
      igst += tax;
    }
  }

  let bookingsQ = admin
    .from("bookings")
    .select("total_amount, created_at")
    .in("status", ACTIVE_BOOKING_STATUSES);
  if (b.from) bookingsQ = bookingsQ.gte("created_at", b.from);
  if (b.to) bookingsQ = bookingsQ.lte("created_at", b.to);
  const { data: bookings } = await bookingsQ;
  const exempt = (bookings ?? []).reduce((s, x) => s + x.total_amount, 0);

  return { taxable, igst, cgst, sgst, cess: 0, exempt };
}
