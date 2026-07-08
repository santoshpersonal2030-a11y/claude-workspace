'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase/browser';

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createBrowserSupabase();
    // When arriving from the email link, Supabase has already set a recovery
    // session, so we can update the password directly.
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setBusy(false);
    } else {
      setDone(true);
      setTimeout(() => {
        router.push('/account');
        router.refresh();
      }, 1500);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-burgundy-dark">
        Set a new password
      </h1>

      {done ? (
        <p className="mt-4 rounded-lg border border-gold/40 bg-white p-4 text-sm text-green-700">
          Password updated. Taking you to your account…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (at least 6 characters)"
            autoComplete="new-password"
            className="rounded-lg border border-gold/50 bg-white px-4 py-2.5 text-sm outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/20"
          />
          {error && <p className="text-sm text-burgundy">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-cream hover:bg-burgundy-dark disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Update password'}
          </button>
          <p className="text-xs text-burgundy-dark/60">
            Open this page from the reset link in your email. If it expired,
            request a new one.
          </p>
        </form>
      )}
    </div>
  );
}
