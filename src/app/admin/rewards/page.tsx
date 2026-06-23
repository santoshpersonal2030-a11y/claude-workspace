import { createAdminClient } from "@/lib/supabase/admin";
import { saveRewardSettings } from "@/app/admin/actions";
import { REWARD_DEFAULTS } from "@/lib/rewards";
import { formatINR } from "@/lib/poojas";

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-3 py-2 text-sm outline-none focus:border-saffron-400";

export default async function AdminRewardsPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("reward_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  const s = {
    rewards_enabled: data?.rewards_enabled ?? REWARD_DEFAULTS.rewardsEnabled,
    referrer_reward: data?.referrer_reward ?? REWARD_DEFAULTS.referrerReward,
    referee_reward: data?.referee_reward ?? REWARD_DEFAULTS.refereeReward,
    loyalty_earn_pct: Number(data?.loyalty_earn_pct ?? REWARD_DEFAULTS.loyaltyEarnPct),
    max_redeem_pct: data?.max_redeem_pct ?? REWARD_DEFAULTS.maxRedeemPct,
  };

  // Quick pulse on outstanding liability (credit issued but not yet spent).
  const { data: txns } = await admin.from("wallet_transactions").select("amount");
  const outstanding = (txns ?? []).reduce((t, r) => t + r.amount, 0);

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Rewards</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Store-credit wallet, referral payouts and loyalty earn-back. Amounts are
        in whole rupees. Changes apply to new orders and bookings.
      </p>

      <p className="mt-4 inline-block rounded-xl bg-cream px-4 py-2 text-sm text-foreground/70">
        Outstanding credit liability:{" "}
        <strong className="text-maroon-700">{formatINR(outstanding)}</strong>
      </p>

      <form
        action={saveRewardSettings}
        className="mt-6 grid max-w-2xl gap-4 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm sm:grid-cols-2"
      >
        <label className="flex items-center gap-2 text-sm text-foreground/75 sm:col-span-2">
          <input
            type="checkbox"
            name="rewards_enabled"
            defaultChecked={s.rewards_enabled}
          />
          Rewards programme enabled
        </label>

        <label className="text-xs text-foreground/60">
          Referrer reward (₹)
          <input
            name="referrer_reward"
            type="number"
            min={0}
            defaultValue={s.referrer_reward}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="text-xs text-foreground/60">
          New-customer reward (₹)
          <input
            name="referee_reward"
            type="number"
            min={0}
            defaultValue={s.referee_reward}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="text-xs text-foreground/60">
          Loyalty earn-back (% of net spend)
          <input
            name="loyalty_earn_pct"
            type="number"
            min={0}
            step="0.5"
            defaultValue={s.loyalty_earn_pct}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="text-xs text-foreground/60">
          Max redeemable per order (% of total)
          <input
            name="max_redeem_pct"
            type="number"
            min={0}
            max={100}
            defaultValue={s.max_redeem_pct}
            className={`mt-1 ${inputClass}`}
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-full bg-saffron-600 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-700"
          >
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
