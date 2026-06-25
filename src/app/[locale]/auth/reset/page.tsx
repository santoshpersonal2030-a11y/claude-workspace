"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

// Landing page for the password-reset email link. Supabase establishes a
// recovery session from the link; here the user sets a new password.
export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The recovery link signs the user in with a temporary session.
    supabase.auth.getUser().then(({ data }) => setReady(Boolean(data.user)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => {
      router.push("/account/profile");
      router.refresh();
    }, 1500);
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-temple-gradient px-4 py-9">
      <div className="w-full max-w-md rounded-2xl border border-saffron-100 bg-white p-8 shadow-sm">
        <h1 className="text-center font-heading text-2xl text-maroon-800">
          Set a new password
        </h1>

        {done ? (
          <p className="mt-6 rounded-xl bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">
            Password updated — taking you to your account…
          </p>
        ) : !ready ? (
          <p className="mt-6 text-center text-sm text-foreground/65">
            Open this page from the reset link in your email. If you got here by
            mistake, request a new link from the login page.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6">
            {error && (
              <p className="mb-4 rounded-xl bg-maroon-50 px-3 py-2 text-sm text-maroon-700">
                {error}
              </p>
            )}
            <label className="mb-1 block text-sm font-medium text-foreground/80">
              New password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-4 w-full rounded-full bg-saffron-700 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800 disabled:opacity-60"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
