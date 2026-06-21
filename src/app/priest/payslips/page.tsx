import { getPriestPandit } from "@/lib/priest";
import { createAdminClient } from "@/lib/supabase/admin";
import { periodLabel, compModelLabel, type CompModel } from "@/lib/payroll";
import { formatINR } from "@/lib/poojas";

export default async function PriestPayslipsPage() {
  const pandit = (await getPriestPandit())!;
  const admin = createAdminClient();

  // This priest's payroll lines (server-filtered to their own id), with the
  // run period for each.
  const { data: items } = await admin
    .from("payroll_run_items")
    .select(
      "id, model, gross, deductions, net_pay, paid, paid_at, bookings_count, payroll_runs(period_year, period_month)",
    )
    .eq("pandit_id", pandit.id);

  const lines = (items ?? []).slice().sort((a, b) => {
    const ay = a.payroll_runs?.period_year ?? 0;
    const by = b.payroll_runs?.period_year ?? 0;
    if (ay !== by) return by - ay;
    return (b.payroll_runs?.period_month ?? 0) - (a.payroll_runs?.period_month ?? 0);
  });

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
      )}
    </div>
  );
}
