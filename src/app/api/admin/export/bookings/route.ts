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
    .from("bookings")
    .select(
      "invoice_no, id, created_at, status, booking_date, time_slot, language, city, total_amount, poojas(name), assigned:pandits!bookings_pandit_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false });
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

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
  const rows = (data ?? []).map((b) => [
    b.invoice_no ?? "",
    b.id,
    new Date(b.created_at).toISOString().slice(0, 10),
    b.status,
    b.poojas?.name ?? "",
    b.booking_date,
    b.time_slot,
    b.language ?? "",
    b.city,
    b.assigned?.full_name ?? "",
    b.total_amount,
  ]);

  return new Response(toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
