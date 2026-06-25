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

  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [phase, setPhase] = useState<"enter-phone" | "enter-otp">(
    "enter-phone",
  );
  const [emailMode, setEmailMode] = useState<"signin" | "signup">("signin");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function callbackUrl(): string {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      nextTarget(),
    )}`;
  }

  async function signInWithOAuth(provider: "google" | "apple") {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
    // On success the browser is redirected to the provider.
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    if (emailMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: callbackUrl() },
      });
      setBusy(false);
      if (error) return setError(error.message);
      // If confirmation is required there's no session yet.
      if (!data.session) {
        setInfo("Check your email to confirm your account, then sign in.");
        setEmailMode("signin");
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setBusy(false);
      if (error) return setError(error.message);
    }
    router.push(nextTarget());
    router.refresh();
  }

  async function forgotPassword() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Enter your email first, then tap “Forgot password”.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setInfo("Password reset link sent — check your email.");
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
        <p className="mt-2 text-sm text-foreground/65">
          Sign in to book a Pandit and order samagri.
        </p>
      </div>

      {error && (
        <p className="mt-5 rounded-xl bg-maroon-50 px-3 py-2 text-sm text-maroon-700">
          {error}
        </p>
      )}
      {info && (
        <p className="mt-5 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {info}
        </p>
      )}

      <button
        type="button"
        onClick={() => signInWithOAuth("google")}
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

      <button
        type="button"
        onClick={() => signInWithOAuth("apple")}
        disabled={busy}
        className="mt-3 flex w-full items-center justify-center gap-3 rounded-full bg-black py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M16.37 1.43c.08 1-.32 1.97-.93 2.67-.66.74-1.74 1.32-2.79 1.24-.1-.97.36-1.98.95-2.62.66-.72 1.82-1.27 2.77-1.29ZM19.6 17.2c-.53 1.23-.79 1.78-1.47 2.87-.96 1.52-2.31 3.41-3.99 3.42-1.49.02-1.88-.97-3.9-.96-2.02.01-2.44.98-3.94.95-1.68-.03-2.96-1.73-3.92-3.25C-.31 16.4-.6 11.46 1.13 8.86c1.16-1.76 2.99-2.79 4.71-2.79 1.75 0 2.85 1 4.3 1 1.4 0 2.26-1 4.29-1 1.53 0 3.16.84 4.32 2.28-3.79 2.08-3.17 7.49.85 8.85Z" />
        </svg>
        Continue with Apple
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-foreground/65">
        <span className="h-px flex-1 bg-saffron-100" />
        OR
        <span className="h-px flex-1 bg-saffron-100" />
      </div>

      {/* Phone / email method toggle */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-cream p-1 text-sm">
        {(["phone", "email"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMethod(m);
              setError(null);
              setInfo(null);
            }}
            className={`rounded-full py-1.5 font-semibold capitalize transition-colors ${
              method === m
                ? "bg-white text-saffron-700 shadow-sm"
                : "text-foreground/65 hover:text-saffron-700"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {method === "email" ? (
        <form onSubmit={submitEmail}>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
          <label className="mb-1 mt-3 block text-sm font-medium text-foreground/80">
            Password
          </label>
          <input
            type="password"
            autoComplete={emailMode === "signup" ? "new-password" : "current-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={emailMode === "signup" ? "Create a password (min 8)" : "Your password"}
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-full bg-saffron-700 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800 disabled:opacity-60"
          >
            {busy
              ? "Please wait…"
              : emailMode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>
          <div className="mt-3 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setEmailMode(emailMode === "signin" ? "signup" : "signin");
                setError(null);
                setInfo(null);
              }}
              className="text-saffron-700 hover:text-saffron-800"
            >
              {emailMode === "signin"
                ? "New here? Create account"
                : "Have an account? Sign in"}
            </button>
            {emailMode === "signin" && (
              <button
                type="button"
                onClick={forgotPassword}
                className="text-foreground/65 hover:text-saffron-700"
              >
                Forgot password?
              </button>
            )}
          </div>
        </form>
      ) : phase === "enter-phone" ? (
        <form onSubmit={sendOtp}>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Mobile number
          </label>
          <div className="flex items-center rounded-xl border border-saffron-200 bg-cream px-3 focus-within:border-saffron-400 focus-within:ring-2 focus-within:ring-saffron-100">
            <span className="text-sm text-foreground/65">+91</span>
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
            className="mt-4 w-full rounded-full bg-saffron-700 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800 disabled:opacity-60"
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
            className="mt-4 w-full rounded-full bg-saffron-700 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800 disabled:opacity-60"
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

      <p className="mt-6 text-center text-xs text-foreground/65">
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
    <main className="flex flex-1 items-center justify-center bg-temple-gradient px-4 py-11">
      <Suspense>
        <LoginCard />
      </Suspense>
    </main>
  );
}
