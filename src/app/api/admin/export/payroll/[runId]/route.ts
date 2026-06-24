import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { buildPayrollRunCsv } from "@/lib/exports";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { runId } = await params;
  const csv = await buildPayrollRunCsv(runId);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payroll-${runId.slice(
        0,
        8,
      )}.csv"`,
    },
  });
}
