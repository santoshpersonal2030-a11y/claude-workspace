// Dependency-free payslip PDF for a single priest's payroll line, built on the
// shared PdfDoc engine (same one that renders invoices). ASCII-safe rupees.

import { PdfDoc } from "@/lib/pdf";
import { getCompany } from "@/lib/company-settings";
import { compModelLabel, periodLabel, type CompModel } from "@/lib/payroll";
import type { Database } from "@/lib/database.types";

type ItemRow = Database["public"]["Tables"]["payroll_run_items"]["Row"];

const rs = (n: number) => `Rs. ${new Intl.NumberFormat("en-IN").format(n)}`;
const L = 40;
const R = 555;

export async function buildPayslipPdf(
  item: ItemRow,
  panditName: string,
  year: number,
  month: number,
): Promise<Buffer> {
  const company = await getCompany();
  const doc = new PdfDoc();
  const yt = (o: number) => doc.fromTop(o);

  // Header
  doc.text(L, yt(44), company.name || "BookMyPoojari", {
    size: 15,
    bold: true,
  });
  doc.text(R, yt(50), "PAYSLIP", { size: 13, bold: true, align: "right" });
  let ay = 64;
  for (const line of company.addressLines) {
    doc.text(L, yt(ay), line, { size: 8 });
    ay += 11;
  }
  if (company.gstin) {
    doc.text(L, yt(ay), `GSTIN: ${company.gstin}`, { size: 8 });
  }
  doc.text(R, yt(64), `Period: ${periodLabel(year, month)}`, {
    size: 9,
    align: "right",
  });
  doc.line(L, yt(96), R, yt(96));

  // Employee block
  doc.text(L, yt(114), "Priest", { size: 8 });
  doc.text(L, yt(127), panditName, { size: 12, bold: true });
  doc.text(R, yt(114), "Compensation model", { size: 8, align: "right" });
  doc.text(R, yt(127), compModelLabel(item.model as CompModel), {
    size: 10,
    align: "right",
  });
  doc.text(L, yt(146), `Completed bookings this period: ${item.bookings_count}`, {
    size: 8,
  });
  doc.line(L, yt(160), R, yt(160));

  // Earnings vs deductions, two stacked sections.
  doc.text(L, yt(180), "Earnings", { size: 10, bold: true });
  doc.text(R, yt(180), "Amount", { size: 8, align: "right" });
  let y = 198;
  const row = (label: string, amount: number, bold = false) => {
    doc.text(L, yt(y), label, { size: 9, bold });
    doc.text(R, yt(y), rs(amount), { size: 9, bold, align: "right" });
    y += 15;
  };
  if (item.base_salary) row("Basic salary", item.base_salary);
  if (item.travel_allowance) row("Travel allowance", item.travel_allowance);
  if (item.commission) row("Commission", item.commission);
  if (item.consultant_fee) row("Consultant fee", item.consultant_fee);
  if (item.incentive) row("Incentive", item.incentive);
  if (
    !item.base_salary &&
    !item.travel_allowance &&
    !item.commission &&
    !item.consultant_fee &&
    !item.incentive
  ) {
    row("No platform-paid earnings", 0);
  }
  doc.line(L, yt(y), R, yt(y));
  y += 16;
  row("Gross earnings", item.gross, true);

  y += 12;
  doc.text(L, yt(y), "Deductions", { size: 10, bold: true });
  y += 18;
  if (item.pf_employee) row("Provident Fund (employee)", item.pf_employee);
  if (!item.pf_employee) row("No deductions", 0);
  doc.line(L, yt(y), R, yt(y));
  y += 16;
  row("Total deductions", item.deductions, true);

  // Net pay highlight
  y += 14;
  doc.line(L, yt(y), R, yt(y));
  y += 18;
  doc.text(L, yt(y), "NET PAYABLE", { size: 12, bold: true });
  doc.text(R, yt(y), rs(item.net_pay), { size: 12, bold: true, align: "right" });
  y += 26;

  // Employer-cost / informational footer.
  doc.line(L, yt(y), R, yt(y));
  y += 16;
  doc.text(L, yt(y), "For reference (not part of net pay):", { size: 8 });
  y += 13;
  if (item.pf_employer) {
    doc.text(L, yt(y), `Employer PF contribution: ${rs(item.pf_employer)}`, {
      size: 8,
    });
    y += 12;
  }
  if (item.gratuity) {
    doc.text(L, yt(y), `Gratuity accrual: ${rs(item.gratuity)}`, { size: 8 });
    y += 12;
  }
  if (item.dakshina_retained) {
    doc.text(
      L,
      yt(y),
      `Dakshina retained directly by priest: ${rs(item.dakshina_retained)}`,
      { size: 8 },
    );
    y += 12;
  }
  doc.text(
    L,
    yt(y + 6),
    item.paid
      ? `Status: PAID${item.payment_ref ? ` (ref ${item.payment_ref})` : ""}`
      : "Status: Pending payment",
    { size: 8, bold: true },
  );

  doc.text(
    L,
    yt(810),
    "This is a system-generated payslip and does not require a signature.",
    { size: 7 },
  );

  return doc.render();
}
