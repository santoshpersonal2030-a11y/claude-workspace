// Server-side payroll data access: aggregates a priest's workload from
// completed bookings and builds the per-priest payslip lines for a run.
// All functions take the service-role admin client (payroll tables are
// service-role only). Kept separate from the pure engine in payroll.ts.

import type { createAdminClient } from "@/lib/supabase/admin";
import { computePay, EMPTY_WORKLOAD, type Workload } from "@/lib/payroll";
import type { Database } from "@/lib/database.types";

type AdminClient = ReturnType<typeof createAdminClient>;
type CompRow = Database["public"]["Tables"]["priest_compensation"]["Row"];

// First and last calendar day of a month, as YYYY-MM-DD (for date filters).
export function monthBounds(year: number, month: number): {
  first: string;
  last: string;
} {
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate(); // month is 1-based here
  return {
    first: `${year}-${pad(month)}-01`,
    last: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
}

// Loads every priest's compensation profile, keyed by pandit_id.
export async function getCompensationMap(
  admin: AdminClient,
): Promise<Map<string, CompRow>> {
  const { data } = await admin.from("priest_compensation").select("*");
  return new Map((data ?? []).map((row) => [row.pandit_id, row]));
}

// Sums a priest's completed bookings in the period into a workload. Dakshina is
// proxied by the service price (the priest's fee) until a dedicated field exists.
export async function workloadFor(
  admin: AdminClient,
  panditId: string,
  year: number,
  month: number,
): Promise<Workload> {
  const { first, last } = monthBounds(year, month);
  const { data } = await admin
    .from("bookings")
    .select("service_price, total_amount")
    .eq("pandit_id", panditId)
    .eq("status", "completed")
    .gte("booking_date", first)
    .lte("booking_date", last);

  if (!data || data.length === 0) return { ...EMPTY_WORKLOAD };

  return data.reduce<Workload>(
    (acc, b) => ({
      bookingsCount: acc.bookingsCount + 1,
      serviceValue: acc.serviceValue + (b.service_price ?? 0),
      totalValue: acc.totalValue + (b.total_amount ?? 0),
      dakshinaTotal: acc.dakshinaTotal + (b.service_price ?? 0),
    }),
    { ...EMPTY_WORKLOAD },
  );
}

// Builds (or rebuilds) the payslip lines for a draft run: computes every active
// priest's pay for the period and upserts one payroll_run_items row each. Paid
// lines are left untouched so a re-generate never clobbers a recorded payout.
export async function buildRunItems(
  admin: AdminClient,
  runId: string,
  year: number,
  month: number,
): Promise<number> {
  const { data: pandits } = await admin
    .from("pandits")
    .select("id")
    .eq("active", true);
  if (!pandits || pandits.length === 0) return 0;

  const compMap = await getCompensationMap(admin);

  // Don't overwrite lines already marked paid.
  const { data: paidLines } = await admin
    .from("payroll_run_items")
    .select("pandit_id")
    .eq("run_id", runId)
    .eq("paid", true);
  const paidSet = new Set((paidLines ?? []).map((l) => l.pandit_id));

  const rows = [];
  for (const p of pandits) {
    if (paidSet.has(p.id)) continue;
    const profile = compMap.get(p.id);
    const workload = await workloadFor(admin, p.id, year, month);
    const breakdown = computePay(
      profile ?? {
        model: "dakshina",
        base_salary: 0,
        travel_allowance: 0,
        commission_pct: 0,
        commission_basis: "service",
        keeps_dakshina: true,
        consultant_fee: 0,
        incentive_per_booking: 0,
        pf_enabled: false,
        pf_employee_pct: 12,
        pf_employer_pct: 12,
        pf_wage_ceiling: 0,
        gratuity_enabled: false,
        gratuity_pct: 4.81,
      },
      workload,
    );

    rows.push({
      run_id: runId,
      pandit_id: p.id,
      model: profile?.model ?? ("dakshina" as const),
      bookings_count: workload.bookingsCount,
      bookings_value: workload.serviceValue,
      dakshina_retained: breakdown.dakshinaRetained,
      base_salary: breakdown.baseSalary,
      travel_allowance: breakdown.travelAllowance,
      commission: breakdown.commission,
      consultant_fee: breakdown.consultantFee,
      incentive: breakdown.incentive,
      gross: breakdown.gross,
      pf_employee: breakdown.pfEmployee,
      pf_employer: breakdown.pfEmployer,
      gratuity: breakdown.gratuity,
      deductions: breakdown.deductions,
      net_pay: breakdown.netPay,
    });
  }

  if (rows.length > 0) {
    // Replace existing unpaid lines for these priests, then insert fresh.
    const panditIds = rows.map((r) => r.pandit_id);
    await admin
      .from("payroll_run_items")
      .delete()
      .eq("run_id", runId)
      .in("pandit_id", panditIds)
      .eq("paid", false);
    await admin.from("payroll_run_items").insert(rows);
  }
  return rows.length;
}
