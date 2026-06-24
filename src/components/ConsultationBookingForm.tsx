"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import { type Consultation } from "@/lib/consultations";
import { formatINR, timeSlots } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/client";
import { payWithRazorpay } from "@/lib/razorpay-client";

const inputClass =
  "w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100";

export default function ConsultationBookingForm({
  service,
}: {
  service: Consultation;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"phone" | "video">("phone");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setUser(u);
      if (u) {
        setName((n) => n || ((u.user_metadata?.full_name as string) ?? ""));
        setPhone((p) => p || (u.phone ?? ""));
        setEmail((e) => e || (u.email ?? ""));
      }
    });
  }, [supabase]);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      router.push(`/login?next=/consultations/${service.slug}`);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug: service.slug,
          mode,
          preferredDate: date,
          preferredTime: slot,
          birthDate: service.needsBirthDetails ? birthDate : undefined,
          birthTime: service.needsBirthDetails ? birthTime : undefined,
          birthPlace: service.needsBirthDetails ? birthPlace : undefined,
          name,
          phone,
          email,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not book the consultation.");
      }

      const data = (await res.json()) as {
        consultationId: string;
        razorpay: { orderId: string; amount: number; keyId?: string } | null;
      };

      // Razorpay not configured yet → record the request, confirm offline.
      if (!data.razorpay) {
        setPaid(false);
        setSubmitted(true);
        return;
      }

      const result = await payWithRazorpay(
        data.razorpay,
        { name, email: email || undefined, contact: phone || undefined },
        `BookMyPoojari — ${service.name}`,
      );

      if (!result.ok) {
        setError(result.error ?? "Payment was not completed.");
        return;
      }

      setPaid(true);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm">
        <div className="text-center">
          <div className="text-4xl">🙏</div>
          <h3 className="mt-3 font-heading text-xl text-maroon-700">
            {paid ? "Consultation confirmed" : "Request received"}
          </h3>
          <p className="mt-2 text-sm text-foreground/65">
            {paid
              ? `Your ${service.name} is booked. We'll assign a verified astrologer and share the ${mode === "video" ? "video link" : "call details"} before your slot.`
              : `We've received your ${service.name} request and will be in touch shortly.`}
          </p>
        </div>
        <dl className="mt-5 space-y-2 border-t border-saffron-50 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-foreground/65">Mode</dt>
            <dd className="font-medium">
              {mode === "video" ? "Video call" : "Phone call"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/65">Preferred date</dt>
            <dd className="font-medium">{date || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/65">Preferred time</dt>
            <dd className="font-medium">{slot || "—"}</dd>
          </div>
          <div className="flex justify-between border-t border-saffron-50 pt-2 text-base">
            <dt className="font-semibold">Paid</dt>
            <dd className="font-semibold text-saffron-700">
              {formatINR(service.price)}
            </dd>
          </div>
        </dl>
        <Link
          href="/account/consultations"
          className="mt-5 block rounded-full bg-saffron-700 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-saffron-800"
        >
          View your consultations
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
    >
      <h3 className="font-heading text-xl text-maroon-700">
        Book this consultation
      </h3>
      <p className="mt-1 text-sm text-foreground/65">
        {service.durationMins} min · {formatINR(service.price)} · delivered by a
        verified astrologer.
      </p>

      <div className="mt-5 space-y-4">
        <fieldset>
          <legend className="mb-1 block text-sm font-medium text-foreground/80">
            How would you like the consultation?
          </legend>
          <div className="flex gap-2">
            {(["phone", "video"] as const).map((m) => (
              <label
                key={m}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                  mode === m
                    ? "border-saffron-400 bg-saffron-50 font-semibold text-saffron-800"
                    : "border-saffron-200 text-foreground/70"
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value={m}
                  checked={mode === m}
                  onChange={() => setMode(m)}
                  className="sr-only"
                />
                {m === "phone" ? "📞 Phone call" : "🎥 Video call"}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cf-date" className="mb-1 block text-sm font-medium text-foreground/80">
              Preferred date
            </label>
            <input
              id="cf-date"
              type="date"
              required
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cf-slot" className="mb-1 block text-sm font-medium text-foreground/80">
              Preferred time
            </label>
            <select
              id="cf-slot"
              required
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Select a slot
              </option>
              {timeSlots.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {service.needsBirthDetails && (
          <div className="rounded-xl border border-saffron-100 bg-saffron-50/50 p-3">
            <p className="text-xs font-medium text-maroon-800">
              Birth details (for an accurate chart)
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cf-bdate" className="mb-1 block text-xs text-foreground/70">
                  Date of birth
                </label>
                <input
                  id="cf-bdate"
                  type="date"
                  required
                  max={today}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="cf-btime" className="mb-1 block text-xs text-foreground/70">
                  Time of birth
                </label>
                <input
                  id="cf-btime"
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-3">
              <label htmlFor="cf-bplace" className="mb-1 block text-xs text-foreground/70">
                Place of birth (city)
              </label>
              <input
                id="cf-bplace"
                type="text"
                required
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="e.g. Varanasi, Uttar Pradesh"
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cf-name" className="mb-1 block text-sm font-medium text-foreground/80">
              Your name
            </label>
            <input
              id="cf-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cf-phone" className="mb-1 block text-sm font-medium text-foreground/80">
              Phone
            </label>
            <input
              id="cf-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="cf-email" className="mb-1 block text-sm font-medium text-foreground/80">
            Email (for the confirmation)
          </label>
          <input
            id="cf-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="cf-notes" className="mb-1 block text-sm font-medium text-foreground/80">
            What would you like to discuss? (optional)
          </label>
          <textarea
            id="cf-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Your main questions or concern"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-saffron-50 pt-4">
        <span className="text-sm text-foreground/65">Total payable</span>
        <span className="font-heading text-xl text-saffron-700">
          {formatINR(service.price)}
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-maroon-50 px-3 py-2 text-sm text-maroon-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 w-full rounded-full bg-saffron-700 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800 disabled:opacity-60"
      >
        {busy
          ? "Processing…"
          : user
            ? `Pay ${formatINR(service.price)} & book`
            : "Sign in to book"}
      </button>
      <p className="mt-3 text-center text-xs text-foreground/65">
        {user ? "Secure payment via Razorpay." : "You'll sign in first, then pay."}
      </p>
    </form>
  );
}
