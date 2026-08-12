'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase/browser';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/account';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createBrowserSupabase();

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        // If email confirmation is required, there's no session yet.
        if (!data.session) {
          setInfo(
            'Account created. Please check your email to confirm, then sign in.',
          );
          setMode('signin');
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-burgundy-dark">
        {mode === 'signin' ? 'Sign in' : 'Create your account'}
      </h1>
      <p className="mt-1 text-sm text-burgundy-dark/70">
        {mode === 'signin'
          ? 'Sign in to check out and see your orders.'
          : 'Sign up to place orders with Cash on Delivery.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        {mode === 'signup' && (
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            className="rounded-lg border border-gold/50 bg-white px-4 py-2.5 text-sm outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/20"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          autoComplete="email"
          className="rounded-lg border border-gold/50 bg-white px-4 py-2.5 text-sm outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/20"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (at least 6 characters)"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          className="rounded-lg border border-gold/50 bg-white px-4 py-2.5 text-sm outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/20"
        />

        {error && <p className="text-sm text-burgundy">{error}</p>}
        {info && <p className="text-sm text-green-700">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-burgundy-dark disabled:opacity-60"
        >
          {busy
            ? 'Please wait…'
            : mode === 'signin'
              ? 'Sign in'
              : 'Create account'}
        </button>

        {mode === 'signin' && (
          <a
            href="/forgot-password"
            className="text-center text-xs font-medium text-burgundy hover:underline"
          >
            Forgot password?
          </a>
        )}
      </form>

      <p className="mt-5 text-sm text-burgundy-dark/70">
        {mode === 'signin' ? "Don't have an account? " : 'Already have one? '}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
            setInfo(null);
          }}
          className="font-semibold text-burgundy underline underline-offset-2"
        >
          {mode === 'signin' ? 'Create one' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}
