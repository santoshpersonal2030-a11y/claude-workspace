import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { buildPayrollYearCsv } from "@/lib/exports";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fy: string }> },
) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { fy } = await params;
  const fyStart = Number.parseInt(fy, 10);
  if (!Number.isFinite(fyStart)) {
    return NextResponse.json({ error: "Bad financial year" }, { status: 400 });
  }
  const csv = await buildPayrollYearCsv(fyStart);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payroll-fy-${fyStart}-${
        (fyStart + 1) % 100
      }.csv"`,
    },
  });
}
