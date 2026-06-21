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
import type { PanditTier } from "@/lib/pandit-tier";
import { resolveTravelBand, isValidPincode } from "@/lib/travel";

type PanditOption = {
  slug: string;
  fullName: string;
  languages: string[];
  tier?: PanditTier;
  experienceYears?: number;
  homePincode?: string | null;
  servicePincodes?: string[];
};

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
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [addKit, setAddKit] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live availability (engine-generated slots) for a specific flexible-pooja
  // pandit, tagged with the input key the slots were fetched for so stale
  // results are ignored without a synchronous reset.
  const [slotData, setSlotData] = useState<{
    key: string;
    slots: string[];
  } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  // Only offer pandits who speak the chosen language.
  const availablePandits = pandits.filter((p) =>
    p.languages.includes(language),
  );

  const selectedPandit = pandits.find((p) => p.slug === panditSlug);
  const pinValid = isValidPincode(pincode);

  // Travel fee preview (server recomputes authoritatively). Resolves only when
  // a specific pandit and a valid, served pincode are known.
  const travelBand =
    selectedPandit && pinValid
      ? resolveTravelBand(pincode, {
          homePincode: selectedPandit.homePincode ?? null,
          servicePincodes: selectedPandit.servicePincodes ?? [],
        })
      : null;
  const travelFee = travelBand?.fee ?? 0;

  const isMuhurat = Boolean(pooja.requiresMuhurat);

  // A flexible pooja booked with a specific serving pandit reserves an exact
  // engine slot. Muhurat poojas fetch their auspicious windows (date-based, no
  // pandit needed). Everything else uses the standard slot windows.
  const scheduled = Boolean(!isMuhurat && selectedPandit && travelBand);
  const slotMode: "muhurat" | "scheduled" | "static" = isMuhurat
    ? "muhurat"
    : scheduled
      ? "scheduled"
      : "static";
  const wantsLive = slotMode !== "static";
  const slotKey = !wantsLive
    ? ""
    : slotMode === "muhurat"
      ? `m|${date}`
      : `s|${panditSlug}|${date}|${pincode}`;

  // Load live slots (muhurat windows or engine slots) when needed. Only the
  // async callback calls setState, never the effect body (React 19 rule).
  useEffect(() => {
    if (!wantsLive || !date) return;
    let cancelled = false;
    const params = new URLSearchParams({ poojaSlug: pooja.slug, date });
    if (slotMode === "scheduled") {
      params.set("panditSlug", panditSlug);
      params.set("pincode", pincode);
    }
    fetch(`/api/availability?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { slots?: string[] }) => {
        if (!cancelled) setSlotData({ key: slotKey, slots: data.slots ?? [] });
      })
      .catch(() => {
        if (!cancelled) setSlotData({ key: slotKey, slots: timeSlots });
      });
    return () => {
      cancelled = true;
    };
  }, [wantsLive, slotMode, date, panditSlug, pincode, pooja.slug, slotKey]);

  // Derived slot state — no setState-in-effect. Slots are "ready" when the
  // cached results match the current inputs; otherwise we're loading. A chosen
  // slot that's no longer offered is dropped at render time.
  const slotsReady = wantsLive ? slotData?.key === slotKey : true;
  const loadingSlots = wantsLive && Boolean(date) && !slotsReady;
  const slotOptions = wantsLive
    ? slotsReady
      ? (slotData?.slots ?? [])
      : []
    : timeSlots;
  const effectiveSlot = slotOptions.includes(slot) ? slot : "";

  // Switching language clears a preferred pandit who doesn't speak it.
  function handleLanguageChange(next: string) {
    setLanguage(next);
    if (panditSlug && !pandits.some((p) => p.slug === panditSlug && p.languages.includes(next))) {
      setPanditSlug("");
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const total = pooja.startingPrice + (addKit ? kitPrice : 0) + travelFee;

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
          timeSlot: effectiveSlot,
          startTime: scheduled ? effectiveSlot : undefined,
          language,
          panditSlug: panditSlug || undefined,
          address,
          city,
          pincode: pincode || undefined,
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
          {travelBand && (
            <div className="flex justify-between">
              <dt className="text-foreground/60">Travel</dt>
              <dd className="font-medium">
                {travelFee === 0 ? "Free (local)" : formatINR(travelFee)}
              </dd>
            </div>
          )}
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

      {pooja.requiresMuhurat ? (
        <p className="mt-3 rounded-xl bg-gold-400/20 px-3 py-2 text-xs text-maroon-800">
          🕉️ This ceremony is performed at an auspicious muhurat. Pick your
          preferred date — the Pandit will confirm the exact auspicious timing
          with you.
        </p>
      ) : (
        <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">
          ✓ Flexible timing — choose any date and slot that suits you.
        </p>
      )}

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            {pooja.requiresMuhurat ? "Preferred date" : "Date"}
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
            {slotMode === "muhurat"
              ? "Auspicious time"
              : scheduled
                ? "Available time"
                : "Preferred time"}
          </label>
          <select
            required
            value={effectiveSlot}
            onChange={(e) => setSlot(e.target.value)}
            disabled={wantsLive && (loadingSlots || !slotsReady)}
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100 disabled:opacity-60"
          >
            <option value="" disabled>
              {wantsLive && (loadingSlots || !slotsReady)
                ? "Loading times…"
                : "Select a time slot"}
            </option>
            {slotOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {scheduled && slotsReady && !loadingSlots && slotOptions.length === 0 && (
            <p className="mt-1 text-xs text-maroon-600">
              {selectedPandit?.fullName?.split(" ")[0] ?? "This Pandit"} has no
              free slots on this date — please pick another day.
            </p>
          )}
          {scheduled && slotOptions.length > 0 && (
            <p className="mt-1 text-xs text-foreground/50">
              Live availability for {selectedPandit?.fullName}, spaced for travel
              &amp; setup time.
            </p>
          )}
          {slotMode === "muhurat" && slotsReady && slotOptions.length > 0 && (
            <p className="mt-1 text-xs text-foreground/50">
              Auspicious windows for this date — the Pandit confirms the final
              muhurat.
            </p>
          )}
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
                  {p.tier ? ` — ${p.tier}` : ""}
                  {p.experienceYears ? ` (${p.experienceYears} yrs)` : ""}
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

        <div className="grid grid-cols-2 gap-3">
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
              Pincode
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={pincode}
              onChange={(e) =>
                setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="e.g. 411004"
              className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
            />
            {selectedPandit && pinValid && !travelBand && (
              <p className="mt-1 text-xs text-maroon-600">
                {selectedPandit.fullName?.split(" ")[0]} doesn&apos;t serve this
                pincode.
              </p>
            )}
          </div>
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

      {travelBand && (
        <div className="mt-4 flex items-center justify-between text-sm text-foreground/60">
          <span>Travel ({travelBand.label})</span>
          <span>{travelFee === 0 ? "Free" : `+ ${formatINR(travelFee)}`}</span>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-saffron-50 pt-4">
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
