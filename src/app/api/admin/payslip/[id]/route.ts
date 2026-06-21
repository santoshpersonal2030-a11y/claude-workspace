import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPayslipPdf } from "@/lib/payslip-pdf";

// Streams a single priest's payslip PDF for one payroll line. Admin-only;
// payroll tables are service-role, so this reads via the admin client.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const admin = createAdminClient();

  const { data: item } = await admin
    .from("payroll_run_items")
    .select("*, pandits(full_name), payroll_runs(period_year, period_month)")
    .eq("id", id)
    .maybeSingle();
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const panditName = item.pandits?.full_name ?? "Priest";
  const year = item.payroll_runs?.period_year ?? new Date().getFullYear();
  const month = item.payroll_runs?.period_month ?? 1;

  const pdf = await buildPayslipPdf(item, panditName, year, month);
  const safe = panditName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="payslip-${safe}-${year}-${month}.pdf"`,
    },
  });
}
