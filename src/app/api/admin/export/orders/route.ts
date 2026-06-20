import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select(
      "invoice_no, id, created_at, status, delivery_name, delivery_phone, city, pincode, subtotal, shipping, total_amount, carrier, tracking_number, estimated_delivery",
    )
    .order("created_at", { ascending: false });
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

  const { data } = await query;

  const headers = [
    "Invoice",
    "Order ID",
    "Date",
    "Status",
    "Customer",
    "Phone",
    "City",
    "Pincode",
    "Subtotal",
    "Shipping",
    "Total",
    "Carrier",
    "Tracking",
    "ETA",
  ];
  const rows = (data ?? []).map((o) => [
    o.invoice_no ?? "",
    o.id,
    new Date(o.created_at).toISOString().slice(0, 10),
    o.status,
    o.delivery_name ?? "",
    o.delivery_phone ?? "",
    o.city ?? "",
    o.pincode ?? "",
    o.subtotal,
    o.shipping,
    o.total_amount,
    o.carrier ?? "",
    o.tracking_number ?? "",
    o.estimated_delivery ?? "",
  ]);

  return new Response(toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
