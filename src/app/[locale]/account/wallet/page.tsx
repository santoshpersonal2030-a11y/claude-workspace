import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReferralShare from "@/components/ReferralShare";
import WalletTopUp from "@/components/WalletTopUp";
import { createClient } from "@/lib/supabase/server";
import {
  getWalletBalance,
  getAvailableBalance,
  listWalletTransactions,
  getRewardSettings,
  ensureReferralCode,
  type WalletReason,
} from "@/lib/wallet";
import { formatINR } from "@/lib/poojas";

export const metadata = { title: "Store Credit & Referrals" };

const REASON_LABEL: Record<WalletReason, string> = {
  loyalty_earn: "Loyalty reward",
  redeem: "Applied at checkout",
  referral_referrer: "Referral reward",
  referral_referee: "Welcome bonus",
  refund: "Refund to credit",
  signup_bonus: "Sign-up bonus",
  admin_adjust: "Adjustment",
  topup: "Wallet top-up",
  live_consult: "Live consultation",
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookmypoojari.com";

export default async function WalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/wallet");

  const [balance, available, txns, settings, code] = await Promise.all([
    getWalletBalance(user.id),
    getAvailableBalance(user.id),
    listWalletTransactions(user.id),
    getRewardSettings(),
    ensureReferralCode(user.id),
  ]);
  const reserved = balance - available;
  const referralUrl = code ? `${siteUrl}/?ref=${code}` : siteUrl;

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <Link
            href="/account/profile"
            className="text-sm text-foreground/65 hover:text-saffron-700"
          >
            ← My account
          </Link>
          <h1 className="mt-2 font-heading text-3xl text-maroon-800">
            Store credit & referrals
          </h1>

          {/* Balance */}
          <div className="mt-4 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-foreground/65">Available credit</p>
            <p className="mt-1 font-heading text-4xl text-saffron-700">
              {formatINR(available)}
            </p>
            {reserved > 0 && (
              <p className="mt-1 text-xs text-foreground/65">
                {formatINR(reserved)} reserved by a pending order — frees up if
                it isn&apos;t completed.
              </p>
            )}
            {settings.rewardsEnabled && (
              <p className="mt-3 text-sm text-foreground/65">
                Earn <strong>{settings.loyaltyEarnPct}%</strong> back as credit
                on every order, and redeem credit for up to{" "}
                <strong>{settings.maxRedeemPct}%</strong> of a future order.
              </p>
            )}
          </div>

          {/* Add money */}
          <div className="mt-4 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg text-maroon-700">
              Add money to your wallet
            </h2>
            <p className="mt-1 text-sm text-foreground/65">
              Top up to talk to an astrologer instantly — wallet credit is spent
              per minute during live chats and calls.
            </p>
            <WalletTopUp />
          </div>

          {/* Referral */}
          <div className="mt-4 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg text-maroon-700">
              Refer friends, both get credit
            </h2>
            <p className="mt-1 text-sm text-foreground/65">
              Share your code. When a friend completes their first booking or
              order, they get {formatINR(settings.refereeReward)} and you get{" "}
              {formatINR(settings.referrerReward)} in store credit.
            </p>
            {code && <ReferralShare code={code} url={referralUrl} />}
          </div>

          {/* Ledger */}
          <h2 className="mt-4 font-heading text-lg text-maroon-700">
            Credit history
          </h2>
          {txns.length === 0 ? (
            <p className="mt-3 text-sm text-foreground/65">
              No credit activity yet. Earn credit on your next order or by
              referring a friend.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-saffron-50 overflow-hidden rounded-2xl border border-saffron-100 bg-white shadow-sm">
              {txns.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground/80">
                      {REASON_LABEL[t.reason] ?? "Credit"}
                    </p>
                    <p className="text-xs text-foreground/65">
                      {t.note ??
                        new Date(t.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ${
                      t.amount >= 0 ? "text-emerald-700" : "text-maroon-600"
                    }`}
                  >
                    {t.amount >= 0 ? "+" : "−"}
                    {formatINR(Math.abs(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
