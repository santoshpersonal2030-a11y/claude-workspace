"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  type Pooja,
  languages,
  timeSlots,
  formatINR,
  getSamagriKitPrice,
} from "@/lib/poojas";
import { createClient } from "@/lib/supabase/client";
import { payWithRazorpay } from "@/lib/razorpay-client";

type PanditOption = { slug: string; fullName: string; languages: string[] };

export default function BookingForm({
  pooja,
  pandits = [],
}: {
  pooja: Pooja;
  pandits?: PanditOption[];
}) {
  const kitPrice = getSamagriKitPrice(pooja);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [language, setLanguage] = useState("Hindi");
  const [panditSlug, setPanditSlug] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [addKit, setAddKit] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  // Only offer pandits who speak the chosen language.
  const availablePandits = pandits.filter((p) =>
    p.languages.includes(language),
  );

  // Switching language clears a preferred pandit who doesn't speak it.
  function handleLanguageChange(next: string) {
    setLanguage(next);
    if (panditSlug && !pandits.some((p) => p.slug === panditSlug && p.languages.includes(next))) {
      setPanditSlug("");
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const total = pooja.startingPrice + (addKit ? kitPrice : 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Login is mandatory before booking.
    if (!user) {
      router.push(`/login?next=/poojas/${pooja.slug}`);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poojaSlug: pooja.slug,
          bookingDate: date,
          timeSlot: slot,
          language,
          panditSlug: panditSlug || undefined,
          address,
          city,
          notes,
          samagriKit: addKit,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not create your booking.");
      }

      const data = (await res.json()) as {
        bookingId: string;
        razorpay: { orderId: string; amount: number; keyId?: string } | null;
      };

      // Razorpay not configured yet → capture booking, confirm offline.
      if (!data.razorpay) {
        setPaid(false);
        setSubmitted(true);
        return;
      }

      const result = await payWithRazorpay(
        data.razorpay,
        {
          name: user.user_metadata?.full_name as string | undefined,
          email: user.email ?? undefined,
          contact: user.phone ?? undefined,
        },
        `BookMyPoojari — ${pooja.name}`,
      );

      if (!result.ok) {
        setError(result.error ?? "Payment failed.");
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
            {paid ? "Booking confirmed" : "Booking received"}
          </h3>
          <p className="mt-2 text-sm text-foreground/65">
            {paid ? (
              <>
                Your payment was successful and your <strong>{pooja.name}</strong>{" "}
                on <strong>{date || "your chosen date"}</strong> is confirmed.
                We&apos;ll assign your Pandit and reach out shortly.
              </>
            ) : (
              <>
                We&apos;ve recorded your request for <strong>{pooja.name}</strong>{" "}
                on <strong>{date || "your chosen date"}</strong>. Our team will
                confirm your Pandit and payment shortly.
              </>
            )}
          </p>
        </div>
        <dl className="mt-5 space-y-2 border-t border-saffron-50 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-foreground/60">Date</dt>
            <dd className="font-medium">{date || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/60">Time</dt>
            <dd className="font-medium">{slot || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/60">Language</dt>
            <dd className="font-medium">{language}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/60">Preferred Pandit</dt>
            <dd className="font-medium">
              {pandits.find((p) => p.slug === panditSlug)?.fullName ??
                "Any available"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/60">Samagri kit</dt>
            <dd className="font-medium">{addKit ? "Yes" : "No"}</dd>
          </div>
          <div className="flex justify-between border-t border-saffron-50 pt-2 text-base">
            <dt className="font-semibold">Estimated total</dt>
            <dd className="font-semibold text-saffron-700">
              {formatINR(total)}
            </dd>
          </div>
        </dl>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-5 w-full rounded-full border border-saffron-300 bg-white py-2.5 text-sm font-semibold text-saffron-700 transition-colors hover:bg-saffron-50"
        >
          Edit details
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
    >
      <h3 className="font-heading text-xl text-maroon-700">Book this pooja</h3>
      <p className="mt-1 text-sm text-foreground/60">
        Fill in your details and we&apos;ll arrange everything.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Date
          </label>
          <input
            type="date"
            required
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Preferred time
          </label>
          <select
            required
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          >
            <option value="" disabled>
              Select a time slot
            </option>
            {timeSlots.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Pandit&apos;s language
          </label>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {pandits.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/80">
              Preferred Pandit (optional)
            </label>
            <select
              value={panditSlug}
              onChange={(e) => setPanditSlug(e.target.value)}
              className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
            >
              <option value="">Any available Pandit</option>
              {availablePandits.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.fullName}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-foreground/50">
              {availablePandits.length > 0
                ? `Showing Pandits who speak ${language}. We'll honour your choice subject to availability.`
                : `No listed Pandits for ${language} yet — we'll assign a suitable priest.`}
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            City
          </label>
          <input
            type="text"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Pune"
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Full address
          </label>
          <textarea
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            placeholder="House / flat, street, area, pin code"
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-saffron-100 bg-saffron-50/60 p-3">
          <input
            type="checkbox"
            checked={addKit}
            onChange={(e) => setAddKit(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-saffron-600"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">
              Add samagri kit — {formatINR(kitPrice)}
            </span>
            <span className="block text-foreground/60">
              All pooja items delivered to your door.
            </span>
          </span>
        </label>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Special requests (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any specific rituals, gotra, or preferences"
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-saffron-50 pt-4">
        <span className="text-sm text-foreground/60">Total payable</span>
        <span className="font-heading text-xl text-saffron-700">
          {formatINR(total)}
        </span>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-maroon-50 px-3 py-2 text-sm text-maroon-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 w-full rounded-full bg-saffron-600 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700 disabled:opacity-60"
      >
        {busy
          ? "Processing…"
          : user
            ? `Pay ${formatINR(total)} & confirm`
            : "Sign in to book"}
      </button>
      <p className="mt-3 text-center text-xs text-foreground/50">
        {user
          ? "Secure payment via Razorpay. Cancel anytime before confirmation."
          : "You'll be asked to sign in first. Secure payment via Razorpay."}
      </p>
    </form>
  );
}
