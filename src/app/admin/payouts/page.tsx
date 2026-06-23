import { createAdminClient } from "@/lib/supabase/admin";
import { razorpayxConfigured } from "@/lib/razorpayx";
import { savePayoutAccount } from "@/app/admin/actions";
import { formatINR } from "@/lib/poojas";

export const metadata = { title: "Payouts — Admin" };

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

const PAYOUT_STYLE: Record<string, string> = {
  processed: "bg-emerald-100 text-emerald-800",
  queued: "bg-amber-100 text-amber-800",
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-sky-100 text-sky-800",
  failed: "bg-red-100 text-red-700",
  reversed: "bg-red-100 text-red-700",
  cancelled: "bg-stone-200 text-stone-600",
};

export default async function AdminPayoutsPage() {
  const admin = createAdminClient();
  const configured = razorpayxConfigured();

  const [{ data: pandits }, { data: accounts }, { data: payouts }] =
    await Promise.all([
      admin
        .from("pandits")
        .select("id, full_name")
        .eq("active", true)
        .order("full_name"),
      admin.from("priest_payout_accounts").select("*"),
      admin
        .from("payouts")
        .select("id, pandit_id, amount, status, utr, failure_reason, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const acctByPandit = new Map(
    (accounts ?? []).map((a) => [a.pandit_id, a]),
  );
  const nameById = new Map((pandits ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Payouts</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Priest bank details for RazorpayX payouts. Trigger payments per payslip
        from a payroll run. Bank details are private and never shown publicly.
      </p>

      <div
        className={`mt-4 rounded-xl px-4 py-3 text-sm ${
          configured
            ? "bg-emerald-50 text-emerald-800"
            : "bg-amber-50 text-amber-800"
        }`}
      >
        {configured ? (
          <>✓ RazorpayX is connected — bank payouts are live.</>
        ) : (
          <>
            RazorpayX is not configured. Set <code>RAZORPAYX_KEY_ID</code>,{" "}
            <code>RAZORPAYX_KEY_SECRET</code> and{" "}
            <code>RAZORPAYX_ACCOUNT_NUMBER</code> to enable real payouts. Until
            then, mark payslips paid manually with a UTR.
          </>
        )}
      </div>

      {/* Bank accounts */}
      <h2 className="mt-8 font-heading text-lg text-maroon-700">
        Priest bank accounts
      </h2>
      <div className="mt-3 space-y-2">
        {(pandits ?? []).map((p) => {
          const a = acctByPandit.get(p.id);
          return (
            <form
              key={p.id}
              action={savePayoutAccount}
              className="grid items-end gap-2 rounded-xl border border-saffron-100 bg-white p-3 shadow-sm sm:grid-cols-[1.4fr_1.4fr_1fr_0.8fr_auto]"
            >
              <input type="hidden" name="pandit_id" value={p.id} />
              <div className="text-sm font-medium text-maroon-800">
                {p.full_name}
                {a?.razorpayx_fund_account_id && (
                  <span className="ml-2 text-[11px] text-emerald-700">
                    linked ✓
                  </span>
                )}
              </div>
              <input
                name="account_name"
                placeholder="Account holder name"
                defaultValue={a?.account_name ?? ""}
                className={inputClass}
              />
              <input
                name="account_number"
                placeholder="Account number"
                defaultValue={a?.account_number ?? ""}
                className={inputClass}
              />
              <input
                name="ifsc"
                placeholder="IFSC"
                defaultValue={a?.ifsc ?? ""}
                className={`${inputClass} uppercase`}
              />
              <button
                type="submit"
                className="rounded-full bg-saffron-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-saffron-700"
              >
                Save
              </button>
            </form>
          );
        })}
        {(pandits ?? []).length === 0 && (
          <p className="text-sm text-foreground/50">No active priests.</p>
        )}
      </div>

      {/* Recent payouts */}
      <h2 className="mt-8 font-heading text-lg text-maroon-700">
        Recent payouts
      </h2>
      {(payouts ?? []).length === 0 ? (
        <p className="mt-3 text-sm text-foreground/55">No payouts yet.</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl border border-saffron-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-saffron-100 text-left text-xs text-foreground/55">
                <th className="px-4 py-2">Date</th>
                <th className="px-3 py-2">Priest</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">UTR / reason</th>
              </tr>
            </thead>
            <tbody>
              {payouts!.map((po) => (
                <tr key={po.id} className="border-b border-saffron-50 last:border-0">
                  <td className="px-4 py-2 text-xs text-foreground/60">
                    {new Date(po.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-3 py-2">
                    {nameById.get(po.pandit_id ?? "") ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatINR(po.amount)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                        PAYOUT_STYLE[po.status] ?? "bg-stone-100"
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground/60">
                    {po.utr || po.failure_reason || "—"}
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
