// Pure, dependency-free compensation engine for priest payroll.
//
// A priest's pay is built from composable COMPONENTS (base salary, travel
// allowance, commission, dakshina retention, consultant retainer, incentives)
// plus optional Indian statutory PF/gratuity. The six headline structures the
// business uses are PRESETS over those components, so a priest can mix and
// match freely (e.g. "salary + commission", or "consultant + incentive"):
//
//   1. fixed             — base salary only
//   2. dakshina          — contractor: keeps the dakshina, we pay nothing
//   3. commission        — % of booking value, no salary
//   4. salary_commission — base salary + workload-scaled commission
//   5. consultant        — consultant retainer / per-engagement only
//   6. incentive         — incentive-led (stacks on any of the above)
//
// All money is whole INR. Everything here is pure so it can be unit-tested and
// reused by both the admin payroll run and the payslip generator.

import type { Database } from "@/lib/database.types";

export type CompModel = Database["public"]["Enums"]["comp_model"];

// The compensation profile shape the engine needs (a subset of the
// priest_compensation row, so callers can pass the DB row directly).
export type CompProfile = {
  model: CompModel;
  base_salary: number;
  travel_allowance: number;
  commission_pct: number;
  commission_basis: string; // "service" | "total"
  keeps_dakshina: boolean;
  consultant_fee: number;
  incentive_per_booking: number;
  pf_enabled: boolean;
  pf_employee_pct: number;
  pf_employer_pct: number;
  pf_wage_ceiling: number;
  gratuity_enabled: boolean;
  gratuity_pct: number;
};

// A priest's workload for one payroll period, summarised from completed
// bookings. `value` is the basis the commission % applies to (service value
// or total value, per the profile). `dakshinaTotal` is what the priest
// physically collected as dakshina (only meaningful when keeps_dakshina).
export type Workload = {
  bookingsCount: number;
  serviceValue: number;
  totalValue: number;
  dakshinaTotal: number;
};

export const EMPTY_WORKLOAD: Workload = {
  bookingsCount: 0,
  serviceValue: 0,
  totalValue: 0,
  dakshinaTotal: 0,
};

// Sensible defaults for a brand-new compensation profile (pure contractor:
// the priest keeps the dakshina and we pay nothing until configured).
export const DEFAULT_PROFILE: CompProfile = {
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
};

export const COMP_MODELS: { value: CompModel; label: string; blurb: string }[] = [
  { value: "fixed", label: "Fixed salary", blurb: "Fixed monthly salary only." },
  {
    value: "dakshina",
    label: "Dakshina (contractor)",
    blurb: "Priest keeps the dakshina; platform pays nothing.",
  },
  {
    value: "commission",
    label: "Commission only",
    blurb: "% commission on booking value, no salary.",
  },
  {
    value: "salary_commission",
    label: "Salary + commission",
    blurb: "Base salary plus workload-scaled commission.",
  },
  {
    value: "consultant",
    label: "Consultant",
    blurb: "Consultant retainer / per-engagement fee.",
  },
  {
    value: "incentive",
    label: "Incentive-led",
    blurb: "Incentive overlay that stacks on any base.",
  },
];

export function compModelLabel(model: CompModel): string {
  return COMP_MODELS.find((m) => m.value === model)?.label ?? model;
}

// The fully-computed pay breakdown for one priest for one period. Earnings sum
// into `gross`; `pfEmployee` is deducted to reach `netPay`. `pfEmployer` and
// `gratuity` are employer costs/accruals shown for reference (not deducted).
export type PayBreakdown = {
  baseSalary: number;
  travelAllowance: number;
  commission: number;
  consultantFee: number;
  incentive: number;
  gross: number;
  pfEmployee: number;
  pfEmployer: number;
  gratuity: number;
  deductions: number;
  netPay: number;
  dakshinaRetained: number;
  // Employer's total monthly cost-to-company (gross + employer PF + gratuity).
  ctc: number;
};

function inr(n: number): number {
  // Components are whole rupees; guard against NaN/negatives.
  return Math.max(0, Math.round(Number.isFinite(n) ? n : 0));
}

// Core computation: given a compensation profile and a period's workload,
// return the full pay breakdown. Pure — no I/O, fully deterministic.
export function computePay(
  profile: CompProfile,
  workload: Workload = EMPTY_WORKLOAD,
): PayBreakdown {
  const baseSalary = inr(profile.base_salary);
  const travelAllowance = inr(profile.travel_allowance);
  const consultantFee = inr(profile.consultant_fee);

  // Commission applies to the chosen basis (service value or total value).
  const basis =
    profile.commission_basis === "total"
      ? workload.totalValue
      : workload.serviceValue;
  const commission = inr((basis * profile.commission_pct) / 100);

  // Flat incentive per completed booking (workload reward).
  const incentive = inr(profile.incentive_per_booking * workload.bookingsCount);

  const gross =
    baseSalary + travelAllowance + commission + consultantFee + incentive;

  // PF is computed on basic salary, optionally capped at a wage ceiling
  // (e.g. ₹15,000 statutory cap). 0 ceiling = no cap.
  const pfWage =
    profile.pf_wage_ceiling > 0
      ? Math.min(baseSalary, profile.pf_wage_ceiling)
      : baseSalary;
  const pfEmployee = profile.pf_enabled
    ? inr((pfWage * profile.pf_employee_pct) / 100)
    : 0;
  const pfEmployer = profile.pf_enabled
    ? inr((pfWage * profile.pf_employer_pct) / 100)
    : 0;

  // Gratuity accrual on basic salary (monthly slice of the ~4.81% annual rate).
  const gratuity = profile.gratuity_enabled
    ? inr((baseSalary * profile.gratuity_pct) / 100)
    : 0;

  const deductions = pfEmployee;
  const netPay = Math.max(0, gross - deductions);

  // Dakshina the priest physically retained (contractor income, informational —
  // it is never part of what the platform pays out).
  const dakshinaRetained = profile.keeps_dakshina
    ? inr(workload.dakshinaTotal)
    : 0;

  return {
    baseSalary,
    travelAllowance,
    commission,
    consultantFee,
    incentive,
    gross,
    pfEmployee,
    pfEmployer,
    gratuity,
    deductions,
    netPay,
    dakshinaRetained,
    ctc: gross + pfEmployer + gratuity,
  };
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function periodLabel(year: number, month: number): string {
  return `${MONTHS[Math.min(11, Math.max(0, month - 1))]} ${year}`;
}
