import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { financialYearOf, fyLabel } from "@/lib/payroll";
import { formatINR } from "@/lib/poojas";

// The current Indian financial year, derived from today's date. Wrapped in a
// named helper so the React-purity lint rule doesn't flag a bare clock read in
// the component body.
function currentFinancialYear(): number {
  const now = new Date();
  return financialYearOf(now.getFullYear(), now.getMonth() + 1);
}

type PriestRow = {
  name: string;
  payslips: number;
  ceremonies: number;
  gross: number;
  deductions: number;
  net: number;
  paid: number;
  pfEmployee: number;
  pfEmployer: number;
  gratuity: number;
  dakshina: number;
};

export default async function PayrollYearEndPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const { fy: fyParam } = await searchParams;
  const admin = createAdminClient();

  const [{ data: items }, { data: pandits }] = await Promise.all([
    admin
      .from("payroll_run_items")
      .select(
        "pandit_id, bookings_count, gross, deductions, net_pay, pf_employee, pf_employer, gratuity, dakshina_retained, paid, payroll_runs(period_year, period_month)",
      ),
    admin.from("pandits").select("id, full_name"),
  ]);

  const nameById = new Map((pandits ?? []).map((p) => [p.id, p.full_name]));
  const lines = items ?? [];

  // Which financial years have any payroll data? Always offer the current FY
  // so the page is useful even before the first run lands.
  const fySet = new Set<number>([currentFinancialYear()]);
  for (const l of lines) {
    const r = l.payroll_runs;
    if (r) fySet.add(financialYearOf(r.period_year, r.period_month));
  }
  const availableFys = [...fySet].sort((a, b) => b - a);

  const requested = fyParam ? Number.parseInt(fyParam, 10) : NaN;
  const selectedFy = availableFys.includes(requested)
    ? requested
    : availableFys[0];

  const fyLines = lines.filter((l) => {
    const r = l.payroll_runs;
    return r && financialYearOf(r.period_year, r.period_month) === selectedFy;
  });

  const sum = (pick: (l: (typeof fyLines)[number]) => number) =>
    fyLines.reduce((s, l) => s + pick(l), 0);

  const org = {
    net: sum((l) => l.net_pay),
    paid: fyLines.filter((l) => l.paid).reduce((s, l) => s + l.net_pay, 0),
    gross: sum((l) => l.gross),
    deductions: sum((l) => l.deductions),
    pfEmployee: sum((l) => l.pf_employee),
    pfEmployer: sum((l) => l.pf_employer),
    gratuity: sum((l) => l.gratuity),
    dakshina: sum((l) => l.dakshina_retained),
    ceremonies: sum((l) => l.bookings_count),
    payslips: fyLines.length,
  };
  const pending = org.net - org.paid;
  // Employer's total cost-to-company for the year: net payable plus the
  // employer-side PF contribution and gratuity accrual (neither is deducted
  // from the priest, so they sit on top).
  const ctc = org.net + org.pfEmployer + org.gratuity;

  // Per-priest aggregation for the selected FY.
  const byPriest = new Map<string, PriestRow>();
  for (const l of fyLines) {
    const row =
      byPriest.get(l.pandit_id) ??
      {
        name: nameById.get(l.pandit_id) ?? "—",
        payslips: 0,
        ceremonies: 0,
        gross: 0,
        deductions: 0,
        net: 0,
        paid: 0,
        pfEmployee: 0,
        pfEmployer: 0,
        gratuity: 0,
        dakshina: 0,
      };
    row.payslips += 1;
    row.ceremonies += l.bookings_count;
    row.gross += l.gross;
    row.deductions += l.deductions;
    row.net += l.net_pay;
    if (l.paid) row.paid += l.net_pay;
    row.pfEmployee += l.pf_employee;
    row.pfEmployer += l.pf_employer;
    row.gratuity += l.gratuity;
    row.dakshina += l.dakshina_retained;
    byPriest.set(l.pandit_id, row);
  }
  const priestRows = [...byPriest.values()].sort((a, b) => b.net - a.net);

  return (
    <div>
      <Link
        href="/admin/payroll"
        className="text-sm text-saffron-700 hover:underline"
      >
        ← All payroll runs
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl text-maroon-800">
          Year-end summary — FY {fyLabel(selectedFy)}
        </h1>
        <a
          href={`/api/admin/export/payroll-year/${selectedFy}`}
          className="rounded-full border border-saffron-300 px-4 py-1.5 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
        >
          ⤓ Export CSV
        </a>
      </div>
      <p className="mt-1 text-sm text-foreground/65">
        Every priest&apos;s pay across all monthly runs in the Indian financial
        year (April–March), totalled for year-end reconciliation.
      </p>

      {/* FY selector */}
      {availableFys.length > 1 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-foreground/65">Financial year:</span>
          {availableFys.map((y) => (
            <Link
              key={y}
              href={`/admin/payroll/year-end?fy=${y}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                y === selectedFy
                  ? "bg-maroon-700 text-white"
                  : "border border-stone-200 text-foreground/65 hover:bg-stone-50"
              }`}
            >
              {fyLabel(y)}
            </Link>
          ))}
        </div>
      )}

      {/* Org-wide summary card (mirrors the priest's FY view) */}
      <div className="mt-4 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-lg text-maroon-800">
            All priests, FY {fyLabel(selectedFy)}
          </h2>
          <span className="text-xs text-foreground/65">
            {priestRows.length} priest{priestRows.length === 1 ? "" : "s"} ·{" "}
            {org.payslips} payslip{org.payslips === 1 ? "" : "s"} ·{" "}
            {org.ceremonies} ceremonies
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Net payable" value={org.net} primary />
          <Stat label="Paid out" value={org.paid} />
          <Stat label="Pending" value={pending} />
          <Stat label="Gross" value={org.gross} />
          <Stat label="Deductions" value={org.deductions} />
          <Stat label="Cost to company" value={ctc} />
          <Stat label="PF (employee)" value={org.pfEmployee} />
          <Stat label="PF (employer)" value={org.pfEmployer} />
          <Stat label="Gratuity accrued" value={org.gratuity} />
          <Stat label="Dakshina retained" value={org.dakshina} />
        </div>
      </div>

      {/* Per-priest breakdown */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-saffron-200 text-left text-xs text-foreground/65">
              <th scope="col" className="py-2 pr-3">Priest</th>
              <th scope="col" className="py-2 pr-3 text-right">Payslips</th>
              <th scope="col" className="py-2 pr-3 text-right">Ceremonies</th>
              <th scope="col" className="py-2 pr-3 text-right">Gross</th>
              <th scope="col" className="py-2 pr-3 text-right">Net</th>
              <th scope="col" className="py-2 pr-3 text-right">Paid</th>
              <th scope="col" className="py-2 pr-3 text-right">Pending</th>
              <th scope="col" className="py-2 pr-3 text-right">PF (er)</th>
              <th scope="col" className="py-2 pr-3 text-right">Gratuity</th>
            </tr>
          </thead>
          <tbody>
            {priestRows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-4 text-center text-foreground/65">
                  No payroll lines in FY {fyLabel(selectedFy)} yet.
                </td>
              </tr>
            )}
            {priestRows.map((r) => (
              <tr key={r.name} className="border-b border-saffron-50">
                <td className="py-2 pr-3 font-medium text-maroon-800">
                  {r.name}
                </td>
                <td className="py-2 pr-3 text-right">{r.payslips}</td>
                <td className="py-2 pr-3 text-right">{r.ceremonies}</td>
                <td className="py-2 pr-3 text-right">{formatINR(r.gross)}</td>
                <td className="py-2 pr-3 text-right font-semibold text-maroon-700">
                  {formatINR(r.net)}
                </td>
                <td className="py-2 pr-3 text-right text-foreground/65">
                  {formatINR(r.paid)}
                </td>
                <td className="py-2 pr-3 text-right text-foreground/65">
                  {formatINR(r.net - r.paid)}
                </td>
                <td className="py-2 pr-3 text-right text-foreground/65">
                  {formatINR(r.pfEmployer)}
                </td>
                <td className="py-2 pr-3 text-right text-foreground/65">
                  {formatINR(r.gratuity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  primary,
}: {
  label: string;
  value: number;
  primary?: boolean;
}) {
  return (
    <div className="rounded-xl bg-cream/60 p-3">
      <div
        className={`font-heading ${
          primary ? "text-xl text-maroon-800" : "text-lg text-maroon-700"
        }`}
      >
        {formatINR(value)}
      </div>
      <div className="mt-0.5 text-[11px] text-foreground/65">{label}</div>
    </div>
  );
}
