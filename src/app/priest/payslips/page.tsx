import { getPriestPandit } from "@/lib/priest";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  periodLabel,
  compModelLabel,
  financialYearOf,
  fyLabel,
  type CompModel,
} from "@/lib/payroll";
import { formatINR } from "@/lib/poojas";

export default async function PriestPayslipsPage() {
  const pandit = (await getPriestPandit())!;
  const admin = createAdminClient();

  // This priest's payroll lines (server-filtered to their own id), with the
  // run period for each.
  const { data: items } = await admin
    .from("payroll_run_items")
    .select(
      "id, model, gross, deductions, net_pay, paid, paid_at, bookings_count, pf_employee, pf_employer, gratuity, dakshina_retained, payroll_runs(period_year, period_month)",
    )
    .eq("pandit_id", pandit.id);

  const lines = (items ?? []).slice().sort((a, b) => {
    const ay = a.payroll_runs?.period_year ?? 0;
    const by = b.payroll_runs?.period_year ?? 0;
    if (ay !== by) return by - ay;
    return (b.payroll_runs?.period_month ?? 0) - (a.payroll_runs?.period_month ?? 0);
  });

  // Financial year (India: Apr–Mar). Sum this priest's pay for the current FY.
  const now = new Date();
  const currentFy = financialYearOf(now.getFullYear(), now.getMonth() + 1);
  const fyLines = lines.filter((l) => {
    const r = l.payroll_runs;
    return r && financialYearOf(r.period_year, r.period_month) === currentFy;
  });
  const sum = (pick: (l: (typeof lines)[number]) => number) =>
    fyLines.reduce((s, l) => s + pick(l), 0);
  const fy = {
    label: fyLabel(currentFy),
    net: sum((l) => l.net_pay),
    paid: fyLines.filter((l) => l.paid).reduce((s, l) => s + l.net_pay, 0),
    gross: sum((l) => l.gross),
    pf: sum((l) => l.pf_employee + l.pf_employer),
    gratuity: sum((l) => l.gratuity),
    dakshina: sum((l) => l.dakshina_retained),
    ceremonies: sum((l) => l.bookings_count),
    payslips: fyLines.length,
  };

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">My payslips</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Your monthly pay, computed from your compensation and completed
        ceremonies. Download a payslip for your records.
      </p>

      {lines.length === 0 ? (
        <p className="mt-6 text-sm text-foreground/55">
          No payslips yet. They appear once the admin runs payroll for a month.
        </p>
      ) : (
        <>
          {fy.payslips > 0 && (
            <div className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-heading text-lg text-maroon-800">
                  This financial year (FY {fy.label})
                </h2>
                <span className="text-xs text-foreground/55">
                  {fy.payslips} payslip{fy.payslips === 1 ? "" : "s"} ·{" "}
                  {fy.ceremonies} ceremonies
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Stat label="Net earned" value={fy.net} primary />
                <Stat label="Paid out" value={fy.paid} />
                <Stat label="Gross" value={fy.gross} />
                <Stat label="PF (you + employer)" value={fy.pf} />
                <Stat label="Gratuity accrued" value={fy.gratuity} />
                {fy.dakshina > 0 ? (
                  <Stat label="Dakshina kept" value={fy.dakshina} />
                ) : (
                  <Stat label="Pending" value={fy.net - fy.paid} />
                )}
              </div>
            </div>
          )}

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-saffron-200 text-left text-xs text-foreground/60">
                <th className="py-2 pr-3">Period</th>
                <th className="py-2 pr-3">Model</th>
                <th className="py-2 pr-3 text-right">Ceremonies</th>
                <th className="py-2 pr-3 text-right">Gross</th>
                <th className="py-2 pr-3 text-right">Deductions</th>
                <th className="py-2 pr-3 text-right">Net pay</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-b border-saffron-50">
                  <td className="py-2 pr-3 font-medium text-maroon-700">
                    {l.payroll_runs
                      ? periodLabel(
                          l.payroll_runs.period_year,
                          l.payroll_runs.period_month,
                        )
                      : "—"}
                  </td>
                  <td className="py-2 pr-3 text-xs text-foreground/60">
                    {compModelLabel(l.model as CompModel)}
                  </td>
                  <td className="py-2 pr-3 text-right">{l.bookings_count}</td>
                  <td className="py-2 pr-3 text-right">{formatINR(l.gross)}</td>
                  <td className="py-2 pr-3 text-right text-foreground/60">
                    {formatINR(l.deductions)}
                  </td>
                  <td className="py-2 pr-3 text-right font-semibold text-maroon-700">
                    {formatINR(l.net_pay)}
                  </td>
                  <td className="py-2 pr-3">
                    {l.paid ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                        Paid
                      </span>
                    ) : (
                      <span className="text-[11px] text-foreground/40">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <a
                      href={`/api/priest/payslip/${l.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-saffron-200 px-3 py-1 text-[11px] font-semibold text-saffron-700 hover:bg-saffron-50"
                    >
                      Payslip
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
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
      <div className="mt-0.5 text-[11px] text-foreground/55">{label}</div>
    </div>
  );
}
