import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { savePriestCompensation } from "@/app/[locale]/admin/actions";
import {
  COMP_MODELS,
  DEFAULT_PROFILE,
  computePay,
  type CompProfile,
} from "@/lib/payroll";
import { formatINR } from "@/lib/poojas";

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

export default async function AdminCompensationPage() {
  const admin = createAdminClient();
  const [{ data: pandits }, { data: comps }] = await Promise.all([
    admin
      .from("pandits")
      .select("id, full_name, active")
      .order("full_name", { ascending: true }),
    admin.from("priest_compensation").select("*"),
  ]);

  const compByPandit = new Map((comps ?? []).map((c) => [c.pandit_id, c]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-maroon-800">
          Priest compensation
        </h1>
        <Link
          href="/admin/payroll"
          className="text-sm text-saffron-700 hover:underline"
        >
          ← Payroll runs
        </Link>
      </div>
      <p className="mt-1 text-sm text-foreground/60">
        Mix and match how each priest is paid. Components combine freely — set a
        salary, a commission %, a consultant retainer or just let them keep the
        dakshina. PF &amp; gratuity follow Indian statutory defaults and are
        editable. The model label is for reporting; the components below drive
        the actual pay.
      </p>

      <div className="mt-6 space-y-4">
        {pandits?.map((p) => {
          const c = compByPandit.get(p.id);
          const profile: CompProfile = c ?? { ...DEFAULT_PROFILE };
          // Preview pay with no bookings (shows fixed components only).
          const preview = computePay(profile);
          return (
            <form
              key={p.id}
              action={savePriestCompensation}
              className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
            >
              <input type="hidden" name="pandit_id" value={p.id} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading text-lg text-maroon-700">
                  {p.full_name}
                  {!p.active && (
                    <span className="ml-2 text-xs text-foreground/40">
                      (inactive)
                    </span>
                  )}
                </h2>
                <span className="text-xs text-foreground/60">
                  Fixed monthly (no bookings):{" "}
                  <span className="font-semibold text-maroon-700">
                    {formatINR(preview.netPay)}
                  </span>{" "}
                  net · CTC {formatINR(preview.ctc)}
                </span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-xs text-foreground/60">
                  Model
                  <select
                    name="model"
                    defaultValue={profile.model}
                    className={inputClass}
                  >
                    {COMP_MODELS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-foreground/60">
                  Base salary (₹/mo)
                  <input
                    name="base_salary"
                    type="number"
                    defaultValue={profile.base_salary}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-foreground/60">
                  Travel allowance (₹/mo)
                  <input
                    name="travel_allowance"
                    type="number"
                    defaultValue={profile.travel_allowance}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-foreground/60">
                  Commission %
                  <input
                    name="commission_pct"
                    type="number"
                    step="0.1"
                    defaultValue={profile.commission_pct}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-foreground/60">
                  Commission basis
                  <select
                    name="commission_basis"
                    defaultValue={profile.commission_basis}
                    className={inputClass}
                  >
                    <option value="service">Service fee</option>
                    <option value="total">Total booking</option>
                  </select>
                </label>
                <label className="text-xs text-foreground/60">
                  Consultant fee (₹/mo)
                  <input
                    name="consultant_fee"
                    type="number"
                    defaultValue={profile.consultant_fee}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-foreground/60">
                  Incentive per booking (₹)
                  <input
                    name="incentive_per_booking"
                    type="number"
                    defaultValue={profile.incentive_per_booking}
                    className={inputClass}
                  />
                </label>
              </div>

              {/* PF / gratuity */}
              <div className="mt-3 grid gap-3 rounded-xl bg-cream/60 p-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex items-center gap-2 text-xs text-foreground/70">
                  <input
                    type="checkbox"
                    name="pf_enabled"
                    defaultChecked={profile.pf_enabled}
                  />
                  Provident Fund
                </label>
                <label className="text-xs text-foreground/60">
                  PF employee %
                  <input
                    name="pf_employee_pct"
                    type="number"
                    step="0.1"
                    defaultValue={profile.pf_employee_pct}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-foreground/60">
                  PF employer %
                  <input
                    name="pf_employer_pct"
                    type="number"
                    step="0.1"
                    defaultValue={profile.pf_employer_pct}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-foreground/60">
                  PF wage ceiling (₹, 0=none)
                  <input
                    name="pf_wage_ceiling"
                    type="number"
                    defaultValue={profile.pf_wage_ceiling}
                    className={inputClass}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-foreground/70">
                  <input
                    type="checkbox"
                    name="gratuity_enabled"
                    defaultChecked={profile.gratuity_enabled}
                  />
                  Gratuity accrual
                </label>
                <label className="text-xs text-foreground/60">
                  Gratuity %
                  <input
                    name="gratuity_pct"
                    type="number"
                    step="0.01"
                    defaultValue={profile.gratuity_pct}
                    className={inputClass}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-foreground/70 lg:col-span-2">
                  <input
                    type="checkbox"
                    name="keeps_dakshina"
                    defaultChecked={profile.keeps_dakshina}
                  />
                  Priest keeps the dakshina (contractor income)
                </label>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <input
                  name="notes"
                  defaultValue={c?.notes ?? ""}
                  placeholder="Notes (e.g. revised Apr 2026)"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="submit"
                  className="rounded-full bg-saffron-600 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-700"
                >
                  Save
                </button>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
