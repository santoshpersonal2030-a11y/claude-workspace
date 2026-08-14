"use client";

import { Suspense, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/LanguageProvider";

/* SIGN IN WITH APPLE — built, but dormant until Supabase can actually serve it.
 *
 * Verified 13-Aug-2026 by calling the auth endpoint directly:
 *   /auth/v1/authorize?provider=google → 302 to Google        (enabled)
 *   /auth/v1/authorize?provider=apple  → 400 "provider is not enabled"
 *
 * So the button rendered fine and every click ended in an error page. A control that looks
 * functional and is not is the same failure as COD offering itself in a pincode nobody delivers
 * to — so this fails closed, exactly like DEFAULT_COD_POLICY.enabled.
 *
 * ⚠️ THIS MUST BE TURNED ON BEFORE ANY iOS SUBMISSION. App Store guideline 4.8 requires Sign in
 * with Apple wherever another social login is offered, and Google sign-in is live. With this
 * off, the App Store review will be rejected; with it on but Supabase unconfigured, users get an
 * error. Both have to be true at once:
 *   1. Apple Developer Program → Service ID, Key ID, Team ID, private key
 *   2. Supabase → Authentication → Providers → Apple → paste those, add the callback URL
 *   3. Set NEXT_PUBLIC_APPLE_SIGNIN=true
 * Re-run the curl above and expect a 302 before flipping the flag.
 */
const APPLE_SIGNIN_ENABLED = process.env.NEXT_PUBLIC_APPLE_SIGNIN === "true";

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

/* Has React attached yet? useSyncExternalStore gives the SERVER snapshot (false) on the first
   render and the client snapshot (true) after hydration — no effect and no setState, so it does
   not trip the cascading-render lint rule. Module-level refs stay stable across renders. */
const subscribeNever = () => () => {};
const onClient = () => true;
const onServer = () => false;

function LoginCard() {
  const supabase = useMemo(() => createClient(), []);
  const t = useT();
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

  /* ONLY the submit buttons wait for hydration — deliberately narrow, and a PARTIAL fix.
   *
   * Server-rendered, this is a real <form> with a real submit button and no handler attached
   * yet, so an early tap fires the browser's NATIVE submission: the page reloads, whatever was
   * typed is gone, and you land back on /login with NO error of any kind — indistinguishable
   * from a wrong password. This makes that specific failure impossible.
   *
   * WHAT IT DOES NOT FIX, stated plainly: text typed BEFORE hydration is still wiped when React
   * first renders the controlled inputs. The fields go blank and have to be retyped. That is
   * visible and recoverable, where the old behaviour was silent, so this is an improvement and
   * not a cure.
   *
   * ⚠️ The obvious wider fix — gate the inputs and the phone/email toggle as well — was tried on
   * 13-Aug-2026 and BROKE SIGN-IN OUTRIGHT: fields detached mid-typing and the form re-mounted in
   * a loop. Proven by reverting that one file and rebuilding: with it, sign-in never completed;
   * without it, every time. A real cure means progressive enhancement (a form that posts without
   * JavaScript), not more disabling. Until someone does that, keep this to the submit buttons.
   */
  const hydrated = useSyncExternalStore(subscribeNever, onClient, onServer);
  const cannotSubmitYet = busy || !hydrated;
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
        setInfo(t("login.confirmEmail"));
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
      setError(t("login.enterEmailFirst"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setInfo(t("login.resetSent"));
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const e164 = toE164(phone);
    if (!e164) {
      setError(t("login.badMobile"));
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
          {t("login.h1")}
        </h1>
        <p className="mt-2 text-sm text-foreground/65">
          {t("login.subtitle")}
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
        className="mt-4 flex w-full items-center justify-center gap-3 rounded-full border border-saffron-200 bg-white py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-saffron-50 disabled:opacity-60"
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
        {t("login.google")}
      </button>

      {APPLE_SIGNIN_ENABLED && (
        <button
          type="button"
          onClick={() => signInWithOAuth("apple")}
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-3 rounded-full bg-black py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M16.37 1.43c.08 1-.32 1.97-.93 2.67-.66.74-1.74 1.32-2.79 1.24-.1-.97.36-1.98.95-2.62.66-.72 1.82-1.27 2.77-1.29ZM19.6 17.2c-.53 1.23-.79 1.78-1.47 2.87-.96 1.52-2.31 3.41-3.99 3.42-1.49.02-1.88-.97-3.9-.96-2.02.01-2.44.98-3.94.95-1.68-.03-2.96-1.73-3.92-3.25C-.31 16.4-.6 11.46 1.13 8.86c1.16-1.76 2.99-2.79 4.71-2.79 1.75 0 2.85 1 4.3 1 1.4 0 2.26-1 4.29-1 1.53 0 3.16.84 4.32 2.28-3.79 2.08-3.17 7.49.85 8.85Z" />
          </svg>
          {t("login.apple")}
        </button>
      )}

      <div className="my-6 flex items-center gap-3 text-xs text-foreground/65">
        <span className="h-px flex-1 bg-saffron-100" />
        {t("login.or")}
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
            className={`rounded-full py-1.5 font-semibold transition-colors ${
              method === m
                ? "bg-white text-saffron-700 shadow-sm"
                : "text-foreground/65 hover:text-saffron-700"
            }`}
          >
            {/* `m` is the internal state value ("phone"/"email"), which used to be printed
                straight to screen with a CSS capitalize — so this toggle read "Phone | Email"
                on every Hindi and Telugu page. The state keeps its English values; only the
                label is translated, and `capitalize` is dropped because it is meaningless for
                Devanagari and Telugu. */}
            {t(m === "phone" ? "login.methodPhone" : "login.methodEmail")}
          </button>
        ))}
      </div>

      {method === "email" ? (
        <form onSubmit={submitEmail}>
          {/* These labels were already on screen but were not attached to anything: no htmlFor,
              and not wrapping the input. Sighted visitors saw "Email"; a screen reader announced
              an unnamed edit box. htmlFor/id fixes that, and also makes the label clickable. */}
          <label
            htmlFor="login-email"
            className="mb-1 block text-sm font-medium text-foreground/80"
          >
            {t("login.email")}
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login.emailPlaceholder")}
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
          <label
            htmlFor="login-password"
            className="mb-1 mt-3 block text-sm font-medium text-foreground/80"
          >
            {t("login.password")}
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete={emailMode === "signup" ? "new-password" : "current-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t(
              emailMode === "signup" ? "login.passwordCreate" : "login.passwordYours",
            )}
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
          <button
            type="submit"
            disabled={cannotSubmitYet}
            className="mt-4 w-full rounded-full bg-saffron-700 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800 disabled:opacity-60"
          >
            {busy
              ? t("login.pleaseWait")
              : t(emailMode === "signup" ? "login.createAccount" : "login.signIn")}
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
              {t(emailMode === "signin" ? "login.toSignUp" : "login.toSignIn")}
            </button>
            {emailMode === "signin" && (
              <button
                type="button"
                onClick={forgotPassword}
                className="text-foreground/65 hover:text-saffron-700"
              >
                {t("login.forgot")}
              </button>
            )}
          </div>
        </form>
      ) : phase === "enter-phone" ? (
        <form onSubmit={sendOtp}>
          <label
            htmlFor="login-phone"
            className="mb-1 block text-sm font-medium text-foreground/80"
          >
            {t("login.mobile")}
          </label>
          <div className="flex items-center rounded-xl border border-saffron-200 bg-cream px-3 focus-within:border-saffron-400 focus-within:ring-2 focus-within:ring-saffron-100">
            <span className="text-sm text-foreground/65">+91</span>
            <input
              id="login-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("login.mobilePlaceholder")}
              className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={cannotSubmitYet}
            className="mt-4 w-full rounded-full bg-saffron-700 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800 disabled:opacity-60"
          >
            {busy ? t("login.sendingOtp") : t("login.sendOtp")}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp}>
          <label
            htmlFor="login-otp"
            className="mb-1 block text-sm font-medium text-foreground/80"
          >
            {t("login.otpLabel", { phone })}
          </label>
          <input
            id="login-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder={t("login.otpPlaceholder")}
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-center text-lg tracking-[0.3em] outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
          <button
            type="submit"
            disabled={cannotSubmitYet}
            className="mt-4 w-full rounded-full bg-saffron-700 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800 disabled:opacity-60"
          >
            {busy ? t("login.verifying") : t("login.verify")}
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
            {t("login.changeNumber")}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-xs text-foreground/65">
        {t("login.termsPrefix")}{" "}
        <Link href="/terms" className="text-saffron-700 hover:underline">
          {t("login.termsWord")}
        </Link>{" "}
        {t("login.and")}{" "}
        <Link href="/privacy" className="text-saffron-700 hover:underline">
          {t("login.privacyWord")}
        </Link>
        .
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-temple-gradient px-4 py-6">
      <Suspense>
        <LoginCard />
      </Suspense>
    </main>
  );
}
