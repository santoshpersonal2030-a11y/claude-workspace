"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

// "Notify me when back in stock" for sold-out products. Works for anyone — uses
// the signed-in email if available, otherwise asks for one.
export default function NotifyMeButton({
  productSlug,
  compact = false,
}: {
  productSlug: string;
  compact?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, [supabase]);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/stock-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug, email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong.");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p
        className={`rounded-xl bg-green-50 text-green-800 ${
          compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
        }`}
      >
        🔔 We&apos;ll email you when it&apos;s back.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "mt-4 w-full rounded-full border border-saffron-300 py-2.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
            : "rounded-full border border-saffron-300 px-6 py-2.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
        }
      >
        🔔 Notify me
      </button>
    );
  }

  return (
    <form onSubmit={subscribe} className="flex flex-wrap gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="min-w-56 flex-1 rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-saffron-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Notify me"}
      </button>
      {error && (
        <p className="w-full text-sm text-maroon-700">{error}</p>
      )}
    </form>
  );
}
