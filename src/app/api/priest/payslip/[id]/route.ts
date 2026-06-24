import { NextResponse } from "next/server";

import { getPriestPandit } from "@/lib/priest";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPayslipPdf } from "@/lib/payslip-pdf";

// A priest downloads their OWN payslip. The line must belong to the signed-in
// priest's pandit id, otherwise 404 (no cross-priest access).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const pandit = await getPriestPandit();
  if (!pandit) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const admin = createAdminClient();

  const { data: item } = await admin
    .from("payroll_run_items")
    .select("*, payroll_runs(period_year, period_month)")
    .eq("id", id)
    .eq("pandit_id", pandit.id)
    .maybeSingle();
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const year = item.payroll_runs?.period_year ?? new Date().getFullYear();
  const month = item.payroll_runs?.period_month ?? 1;

  const pdf = await buildPayslipPdf(item, pandit.full_name, year, month);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="payslip-${year}-${month}.pdf"`,
    },
  });
}
