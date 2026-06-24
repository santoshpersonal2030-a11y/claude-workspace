import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { buildGstr1Csv } from "@/lib/exports";

export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const csv = await buildGstr1Csv(
    searchParams.get("from"),
    searchParams.get("to"),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gstr1-b2cs-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
