"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { payWithRazorpay } from "@/lib/razorpay-client";

const PRESETS = [200, 500, 1000, 2000];

// Adds cash credit to the wallet via Razorpay. On success the server credits the
// ledger (verified amount) and we refresh so the new balance + entry show.
export default function WalletTopUp() {
  const router = useRouter();
  const [amount, setAmount] = useState(500);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function topUp() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = (await res.json()) as {
        configured?: boolean;
        razorpay?: { orderId: string; amount: number; keyId?: string };
        error?: string;
      };
      if (!res.ok) {
        setMsg(data.error ?? "Could not start the top-up.");
        return;
      }
      if (data.configured === false || !data.razorpay) {
        setMsg("Online top-up isn’t available right now. Please try again later.");
        return;
      }
      const result = await payWithRazorpay(
        data.razorpay,
        undefined,
        "Wallet top-up",
        "/api/wallet/topup/verify",
      );
      if (result.ok) {
        setMsg(`₹${amount} added to your wallet.`);
        router.refresh();
      } else {
        setMsg(result.error ?? "Top-up did not complete.");
      }
    } catch {
      setMsg("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(p)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              amount === p
                ? "border-saffron-500 bg-saffron-50 text-saffron-800"
                : "border-saffron-100 text-foreground/70 hover:border-saffron-300"
            }`}
          >
            ₹{p}
          </button>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">Custom amount</span>
          <span className="text-foreground/55">₹</span>
          <input
            type="number"
            min={100}
            max={50000}
            value={amount}
            onChange={(e) => setAmount(Math.round(Number(e.target.value)))}
            className="w-24 rounded-lg border border-saffron-100 px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={topUp}
        disabled={busy || amount < 100 || amount > 50000}
        className="mt-3 rounded-full bg-saffron-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Opening payment…" : `Add ₹${amount || 0} to wallet`}
      </button>
      {msg && <p className="mt-2 text-sm text-foreground/70">{msg}</p>}
    </div>
  );
}
