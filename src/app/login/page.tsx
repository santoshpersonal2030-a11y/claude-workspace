"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

// Reads ?next= at submit time without needing a Suspense boundary for
// useSearchParams. Falls back to the homepage.
function nextTarget(): string {
  if (typeof window === "undefined") return "/";
  return new URLSearchParams(window.location.search).get("next") || "/";
}

// Normalises an Indian mobile number to E.164 (+91XXXXXXXXXX).
function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+") && digits.length >= 11) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
}

function LoginCard() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [phase, setPhase] = useState<"enter-phone" | "enter-otp">(
    "enter-phone",
  );
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          nextTarget(),
        )}`,
      },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
    // On success the browser is redirected to Google, so no further work here.
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const e164 = toE164(phone);
    if (!e164) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setPhone(e164);
    setPhase("enter-otp");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp.trim(),
      type: "sms",
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(nextTarget());
    router.refresh();
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-saffron-100 bg-white p-8 shadow-sm">
      <div className="text-center">
        <div className="text-4xl">🪔</div>
        <h1 className="mt-3 font-heading text-2xl text-maroon-800">
          Sign in to BookMyPoojari
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          Sign in to book a Pandit and order samagri.
        </p>
      </div>

      {error && (
        <p className="mt-5 rounded-xl bg-maroon-50 px-3 py-2 text-sm text-maroon-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={busy}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-saffron-200 bg-white py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-saffron-50 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-foreground/40">
        <span className="h-px flex-1 bg-saffron-100" />
        OR
        <span className="h-px flex-1 bg-saffron-100" />
      </div>

      {phase === "enter-phone" ? (
        <form onSubmit={sendOtp}>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Mobile number
          </label>
          <div className="flex items-center rounded-xl border border-saffron-200 bg-cream px-3 focus-within:border-saffron-400 focus-within:ring-2 focus-within:ring-saffron-100">
            <span className="text-sm text-foreground/60">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-full bg-saffron-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700 disabled:opacity-60"
          >
            {busy ? "Sending OTP…" : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp}>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Enter the OTP sent to {phone}
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit code"
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-center text-lg tracking-[0.3em] outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-full bg-saffron-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700 disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Verify & sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPhase("enter-phone");
              setOtp("");
              setError(null);
            }}
            className="mt-3 w-full text-center text-sm text-saffron-700 hover:text-saffron-800"
          >
            ← Change number
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-foreground/50">
        By continuing you agree to our{" "}
        <Link href="/terms" className="text-saffron-700 hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-saffron-700 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-temple-gradient px-4 py-16">
      <Suspense>
        <LoginCard />
      </Suspense>
    </main>
  );
}
