import { test } from "node:test";
import assert from "node:assert/strict";

import {
  computePay,
  DEFAULT_PROFILE,
  financialYearOf,
  fyLabel,
  type CompProfile,
  type Workload,
} from "../src/lib/payroll.ts";

const profile = (over: Partial<CompProfile>): CompProfile => ({
  ...DEFAULT_PROFILE,
  ...over,
});
const work = (over: Partial<Workload>): Workload => ({
  bookingsCount: 0,
  serviceValue: 0,
  totalValue: 0,
  dakshinaTotal: 0,
  ...over,
});

test("fixed salary: gross=net=ctc, no deductions", () => {
  const b = computePay(profile({ model: "fixed", base_salary: 30000 }));
  assert.equal(b.gross, 30000);
  assert.equal(b.deductions, 0);
  assert.equal(b.netPay, 30000);
  assert.equal(b.ctc, 30000);
});

test("PF without ceiling: 12% employee + 12% employer", () => {
  const b = computePay(
    profile({ base_salary: 30000, pf_enabled: true, pf_employee_pct: 12, pf_employer_pct: 12 }),
  );
  assert.equal(b.pfEmployee, 3600);
  assert.equal(b.pfEmployer, 3600);
  assert.equal(b.deductions, 3600);
  assert.equal(b.netPay, 26400);
  assert.equal(b.ctc, 33600); // gross 30000 + employer 3600
});

test("PF wage ceiling caps the PF base", () => {
  const b = computePay(
    profile({ base_salary: 30000, pf_enabled: true, pf_wage_ceiling: 15000 }),
  );
  assert.equal(b.pfEmployee, 1800); // 12% of 15000
  assert.equal(b.pfEmployer, 1800);
});

test("gratuity accrual ~4.81% of basic, counted in CTC not deductions", () => {
  const b = computePay(
    profile({ base_salary: 30000, gratuity_enabled: true, gratuity_pct: 4.81 }),
  );
  assert.equal(b.gratuity, 1443); // round(30000 * 4.81%)
  assert.equal(b.deductions, 0);
  assert.equal(b.ctc, 31443);
});

test("commission on service value", () => {
  const b = computePay(
    profile({ model: "commission", commission_pct: 10, commission_basis: "service" }),
    work({ serviceValue: 50000, totalValue: 60000 }),
  );
  assert.equal(b.commission, 5000);
  assert.equal(b.gross, 5000);
});

test("commission basis=total uses the total value", () => {
  const b = computePay(
    profile({ commission_pct: 10, commission_basis: "total" }),
    work({ serviceValue: 50000, totalValue: 60000 }),
  );
  assert.equal(b.commission, 6000);
});

test("per-booking incentive scales with workload", () => {
  const b = computePay(
    profile({ incentive_per_booking: 500 }),
    work({ bookingsCount: 8 }),
  );
  assert.equal(b.incentive, 4000);
});

test("dakshina-keep records retained dakshina, not platform pay", () => {
  const b = computePay(
    profile({ model: "dakshina", keeps_dakshina: true }),
    work({ dakshinaTotal: 20000 }),
  );
  assert.equal(b.dakshinaRetained, 20000);
  assert.equal(b.gross, 0);
  assert.equal(b.netPay, 0);
});

test("salary + workload commission stack", () => {
  const b = computePay(
    profile({ model: "salary_commission", base_salary: 20000, commission_pct: 10 }),
    work({ serviceValue: 40000 }),
  );
  assert.equal(b.commission, 4000);
  assert.equal(b.gross, 24000);
});

test("default profile (pure contractor) pays nothing with no work", () => {
  const b = computePay(DEFAULT_PROFILE);
  assert.equal(b.gross, 0);
  assert.equal(b.netPay, 0);
  assert.equal(b.ctc, 0);
});

test("net never goes negative", () => {
  const b = computePay(
    profile({ base_salary: 1000, pf_enabled: true, pf_employee_pct: 100 }),
  );
  assert.ok(b.netPay >= 0);
});

test("financialYearOf: Apr–Mar boundary", () => {
  assert.equal(financialYearOf(2026, 4), 2026); // April starts a new FY
  assert.equal(financialYearOf(2026, 3), 2025); // March is still the prior FY
  assert.equal(financialYearOf(2026, 1), 2025); // Jan falls in prior FY
  assert.equal(financialYearOf(2026, 12), 2026); // Dec is in the FY that began Apr
});

test("fyLabel: start year → 2025–26 form", () => {
  assert.equal(fyLabel(2025), "2025–26");
  assert.equal(fyLabel(1999), "1999–00");
  assert.equal(fyLabel(2009), "2009–10");
});
