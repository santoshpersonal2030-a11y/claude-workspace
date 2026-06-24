import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { buildBookingsCsv } from "@/lib/exports";

export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const csv = await buildBookingsCsv(
    searchParams.get("from"),
    searchParams.get("to"),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
