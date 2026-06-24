import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/admin";
import { createPayrollRun, deletePayrollRun } from "@/app/[locale]/admin/actions";
import { periodLabel } from "@/lib/payroll";
import { formatINR } from "@/lib/poojas";

const inputClass =
  "rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800",
  finalized: "bg-sky-100 text-sky-800",
  paid: "bg-emerald-100 text-emerald-800",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function AdminPayrollPage() {
  await requireCapability("payroll");
  const admin = createAdminClient();
  const now = new Date();

  const [{ data: runs }, { data: items }] = await Promise.all([
    admin
      .from("payroll_runs")
      .select("*")
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false }),
    admin
      .from("payroll_run_items")
      .select("run_id, net_pay, gross, paid"),
  ]);

  // Aggregate per-run totals in JS.
  const totals = new Map<
    string,
    { count: number; net: number; gross: number; paid: number }
  >();
  for (const it of items ?? []) {
    const t = totals.get(it.run_id) ?? { count: 0, net: 0, gross: 0, paid: 0 };
    t.count += 1;
    t.net += it.net_pay;
    t.gross += it.gross;
    if (it.paid) t.paid += it.net_pay;
    totals.set(it.run_id, t);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-maroon-800">Payroll</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/payroll/year-end"
            className="rounded-full border border-saffron-300 px-4 py-1.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
          >
            Year-end summary
          </Link>
          <Link
            href="/admin/payroll/compensation"
            className="rounded-full border border-saffron-300 px-4 py-1.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
          >
            Edit compensation
          </Link>
        </div>
      </div>
      <p className="mt-1 text-sm text-foreground/65">
        Generate a monthly payroll run to compute every active priest&apos;s pay
        from their compensation profile and completed bookings. Re-running a
        month rebuilds unpaid lines (paid lines are preserved).
      </p>

      {/* Create / refresh a run */}
      <form
        action={createPayrollRun}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
      >
        <label className="text-xs text-foreground/65">
          Month
          <select
            name="period_month"
            defaultValue={now.getMonth() + 1}
            className={`block ${inputClass}`}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-foreground/65">
          Year
          <input
            name="period_year"
            type="number"
            defaultValue={now.getFullYear()}
            className={`block w-28 ${inputClass}`}
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
        >
          Generate / refresh run
        </button>
      </form>

      {/* Existing runs */}
      <div className="mt-8 space-y-3">
        {(runs ?? []).length === 0 && (
          <p className="text-sm text-foreground/65">No payroll runs yet.</p>
        )}
        {runs?.map((run) => {
          const t = totals.get(run.id) ?? {
            count: 0,
            net: 0,
            gross: 0,
            paid: 0,
          };
          return (
            <div
              key={run.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-saffron-100 bg-white p-4 shadow-sm"
            >
              <div>
                <Link
                  href={`/admin/payroll/${run.id}`}
                  className="font-heading text-lg text-maroon-700 hover:underline"
                >
                  {periodLabel(run.period_year, run.period_month)}
                </Link>
                <span
                  className={`ml-3 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    STATUS_BADGE[run.status] ?? "bg-stone-100 text-stone-700"
                  }`}
                >
                  {run.status}
                </span>
                <p className="mt-1 text-xs text-foreground/65">
                  {t.count} priests · gross {formatINR(t.gross)} · net{" "}
                  {formatINR(t.net)} · paid {formatINR(t.paid)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/payroll/${run.id}`}
                  className="rounded-full bg-saffron-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-saffron-800"
                >
                  Open
                </Link>
                <form action={deletePayrollRun}>
                  <input type="hidden" name="run_id" value={run.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-stone-200 px-3 py-1.5 text-xs text-foreground/65 hover:border-red-300 hover:text-red-600"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
