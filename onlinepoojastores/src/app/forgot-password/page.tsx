'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase/browser';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setSent(true);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-burgundy-dark">Reset password</h1>

      {sent ? (
        <p className="mt-4 rounded-lg border border-gold/40 bg-white p-4 text-sm text-burgundy-dark">
          If an account exists for <strong>{email}</strong>, we’ve sent a reset
          link. Please check your email.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-burgundy-dark/70">
            Enter your email and we’ll send you a link to set a new password.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              className="rounded-lg border border-gold/50 bg-white px-4 py-2.5 text-sm outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/20"
            />
            {error && <p className="text-sm text-burgundy">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-cream hover:bg-burgundy-dark disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        </>
      )}

      <p className="mt-5 text-sm text-burgundy-dark/70">
        <Link href="/login" className="font-semibold text-burgundy underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
