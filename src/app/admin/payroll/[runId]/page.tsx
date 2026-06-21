import Link from "next/link";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  regeneratePayrollRun,
  setPayrollItemPaid,
  setPayrollRunStatus,
} from "@/app/admin/actions";
import { compModelLabel, periodLabel, type CompModel } from "@/lib/payroll";
import { formatINR } from "@/lib/poojas";

export default async function PayrollRunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const admin = createAdminClient();

  const { data: run } = await admin
    .from("payroll_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();
  if (!run) notFound();

  const [{ data: items }, { data: pandits }] = await Promise.all([
    admin
      .from("payroll_run_items")
      .select("*")
      .eq("run_id", runId)
      .order("net_pay", { ascending: false }),
    admin.from("pandits").select("id, full_name"),
  ]);

  const nameById = new Map((pandits ?? []).map((p) => [p.id, p.full_name]));
  const lines = items ?? [];
  const totalGross = lines.reduce((s, l) => s + l.gross, 0);
  const totalDed = lines.reduce((s, l) => s + l.deductions, 0);
  const totalNet = lines.reduce((s, l) => s + l.net_pay, 0);
  const totalEmployerPf = lines.reduce((s, l) => s + l.pf_employer, 0);
  const totalGratuity = lines.reduce((s, l) => s + l.gratuity, 0);
  const paidCount = lines.filter((l) => l.paid).length;

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
          Payroll — {periodLabel(run.period_year, run.period_month)}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <form action={regeneratePayrollRun}>
            <input type="hidden" name="run_id" value={run.id} />
            <button
              type="submit"
              className="rounded-full border border-saffron-300 px-4 py-1.5 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
            >
              ↻ Recompute unpaid
            </button>
          </form>
          <a
            href={`/api/admin/export/payroll/${run.id}`}
            className="rounded-full border border-saffron-300 px-4 py-1.5 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
          >
            ⤓ Export CSV
          </a>
          {(["draft", "finalized", "paid"] as const).map((s) => (
            <form key={s} action={setPayrollRunStatus}>
              <input type="hidden" name="run_id" value={run.id} />
              <input type="hidden" name="status" value={s} />
              <button
                type="submit"
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  run.status === s
                    ? "bg-maroon-700 text-white"
                    : "border border-stone-200 text-foreground/60 hover:bg-stone-50"
                }`}
              >
                {s}
              </button>
            </form>
          ))}
        </div>
      </div>

      <p className="mt-1 text-sm text-foreground/60">
        {lines.length} priests · {paidCount} paid · Gross {formatINR(totalGross)}{" "}
        · Deductions {formatINR(totalDed)} ·{" "}
        <span className="font-semibold text-maroon-700">
          Net payable {formatINR(totalNet)}
        </span>
      </p>
      <p className="mt-0.5 text-xs text-foreground/45">
        Employer cost on top: PF {formatINR(totalEmployerPf)} · gratuity accrual{" "}
        {formatINR(totalGratuity)}
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-saffron-200 text-left text-xs text-foreground/60">
              <th className="py-2 pr-3">Priest</th>
              <th className="py-2 pr-3">Model</th>
              <th className="py-2 pr-3 text-right">Bookings</th>
              <th className="py-2 pr-3 text-right">Gross</th>
              <th className="py-2 pr-3 text-right">Deductions</th>
              <th className="py-2 pr-3 text-right">Net pay</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-foreground/50">
                  No lines yet — use “Recompute unpaid”, or add active priests.
                </td>
              </tr>
            )}
            {lines.map((l) => (
              <tr
                key={l.id}
                className="border-b border-saffron-50 align-middle"
              >
                <td className="py-2 pr-3 font-medium text-maroon-800">
                  {nameById.get(l.pandit_id) ?? "—"}
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
                      Paid{l.payment_ref ? ` · ${l.payment_ref}` : ""}
                    </span>
                  ) : (
                    <span className="text-[11px] text-foreground/40">
                      Pending
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={`/api/admin/payslip/${l.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-saffron-200 px-3 py-1 text-[11px] font-semibold text-saffron-700 hover:bg-saffron-50"
                    >
                      Payslip
                    </a>
                    <form
                      action={setPayrollItemPaid}
                      className="flex items-center gap-1"
                    >
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="run_id" value={run.id} />
                      <input
                        type="hidden"
                        name="paid"
                        value={(!l.paid).toString()}
                      />
                      {!l.paid && (
                        <input
                          name="payment_ref"
                          placeholder="UTR / ref"
                          className="w-24 rounded-lg border border-saffron-200 bg-cream px-2 py-1 text-[11px] outline-none focus:border-saffron-400"
                        />
                      )}
                      <button
                        type="submit"
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold text-white ${
                          l.paid
                            ? "bg-stone-400 hover:bg-stone-500"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {l.paid ? "Unmark" : "Mark paid"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
