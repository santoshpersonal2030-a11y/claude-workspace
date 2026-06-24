"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  type Pooja,
  languages,
  timeSlots,
  formatINR,
  getSamagriKitPrice,
} from "@/lib/poojas";
import { createClient } from "@/lib/supabase/client";
import { redeemableAmount } from "@/lib/rewards";
import { payWithRazorpay } from "@/lib/razorpay-client";
import type { PanditTier } from "@/lib/pandit-tier";
import { resolveTravelBand, isValidPincode } from "@/lib/travel";
import { useT } from "@/components/LanguageProvider";

type SavedAddress = {
  id: string;
  label: string | null;
  address: string;
  city: string | null;
  pincode: string | null;
};

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
  const t = useT();
  const kitPrice = getSamagriKitPrice(pooja);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [wallet, setWallet] = useState({ available: 0, maxRedeemPct: 0 });
  const [useCredit, setUseCredit] = useState(true);
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

  const [peakDays, setPeakDays] = useState<
    Record<string, { label: string; pct: number }>
  >({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  // Load spendable store credit once signed in.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/wallet/summary")
      .then((r) => r.json())
      .then((d: { available?: number; maxRedeemPct?: number }) => {
        if (!cancelled)
          setWallet({
            available: d.available ?? 0,
            maxRedeemPct: d.maxRedeemPct ?? 0,
          });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Load the signed-in user's saved addresses (RLS-scoped) and prefill the
  // default one, so the venue isn't retyped for every booking.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("addresses")
      .select("id, label, address, city, pincode")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled || !data) return;
        setSavedAddresses(data);
        const def = data[0];
        if (def) {
          setAddress((a) => a || def.address);
          setCity((c) => c || def.city || "");
          setPincode((p) => p || def.pincode || "");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  function applySavedAddress(id: string) {
    const a = savedAddresses.find((x) => x.id === id);
    if (!a) return;
    setAddress(a.address);
    setCity(a.city ?? "");
    setPincode(a.pincode ?? "");
  }

  // Load upcoming peak days once to preview the premium (server is authoritative).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/peak-days")
      .then((r) => r.json())
      .then((data: { peakDays?: { date: string; label: string; surchargePct: number }[] }) => {
        if (cancelled) return;
        const map: Record<string, { label: string; pct: number }> = {};
        for (const d of data.peakDays ?? []) {
          map[d.date] = { label: d.label, pct: d.surchargePct };
        }
        setPeakDays(map);
      })
      .catch(() => {
        if (!cancelled) setPeakDays({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  // Peak-day premium preview for the chosen date (% uplift on the dakshina).
  const peak = date ? peakDays[date] : undefined;
  const peakSurcharge = peak
    ? Math.round((pooja.startingPrice * peak.pct) / 100)
    : 0;

  const total =
    pooja.startingPrice + (addKit ? kitPrice : 0) + travelFee + peakSurcharge;

  // Store-credit redemption preview (server re-validates and caps at total-1).
  const creditApplied = useCredit
    ? Math.min(
        redeemableAmount(wallet.available, total, wallet.maxRedeemPct),
        Math.max(0, total - 1),
      )
    : 0;
  const payable = total - creditApplied;

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
          redeemWallet: useCredit,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? t("bf.errCreate"));
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
        setError(result.error ?? t("bf.errPayment"));
        return;
      }

      setPaid(true);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("bf.errGeneric"));
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
            {paid ? t("bf.confirmedTitle") : t("bf.receivedTitle")}
          </h3>
          <p className="mt-2 text-sm text-foreground/65">
            {t(paid ? "bf.paidText" : "bf.receivedText", {
              pooja: pooja.name,
              date: date || t("bf.dateFallback"),
            })}
          </p>
        </div>
        <dl className="mt-5 space-y-2 border-t border-saffron-50 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-foreground/65">{t("bf.date")}</dt>
            <dd className="font-medium">{date || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/65">{t("bf.time")}</dt>
            <dd className="font-medium">{slot || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/65">{t("bf.language")}</dt>
            <dd className="font-medium">{language}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/65">{t("bf.preferredPandit")}</dt>
            <dd className="font-medium">
              {pandits.find((p) => p.slug === panditSlug)?.fullName ??
                t("bf.anyAvailable")}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/65">{t("bf.samagriKit")}</dt>
            <dd className="font-medium">{addKit ? t("bf.yes") : t("bf.no")}</dd>
          </div>
          {travelBand && (
            <div className="flex justify-between">
              <dt className="text-foreground/65">{t("bf.travel")}</dt>
              <dd className="font-medium">
                {travelFee === 0 ? t("bf.freeLocal") : formatINR(travelFee)}
              </dd>
            </div>
          )}
          {peakSurcharge > 0 && peak && (
            <div className="flex justify-between">
              <dt className="text-foreground/65">{peak.label} (+{peak.pct}%)</dt>
              <dd className="font-medium">{formatINR(peakSurcharge)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-saffron-50 pt-2 text-base">
            <dt className="font-semibold">{t("bf.estTotal")}</dt>
            <dd className="font-semibold text-saffron-700">
              {formatINR(total)}
            </dd>
          </div>
        </dl>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-5 w-full rounded-full border border-saffron-300 bg-white py-2.5 text-sm font-semibold text-saffron-700 transition-colors hover:bg-saffron-50"
        >
          {t("bf.editDetails")}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
    >
      <h3 className="font-heading text-xl text-maroon-700">{t("bf.title")}</h3>
      <p className="mt-1 text-sm text-foreground/65">{t("bf.subtitle")}</p>

      {pooja.requiresMuhurat ? (
        <p className="mt-3 rounded-xl bg-gold-400/20 px-3 py-2 text-xs text-maroon-800">
          {t("bf.muhuratNote")}
        </p>
      ) : (
        <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">
          {t("bf.flexNote")}
        </p>
      )}

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="bf-date" className="mb-1 block text-sm font-medium text-foreground/80">
            {pooja.requiresMuhurat ? t("bf.preferredDate") : t("bf.date")}
          </label>
          <input
            id="bf-date"
            type="date"
            required
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
        </div>

        <div>
          <label htmlFor="bf-slot" className="mb-1 block text-sm font-medium text-foreground/80">
            {slotMode === "muhurat"
              ? t("bf.auspiciousTime")
              : scheduled
                ? t("bf.availableTime")
                : t("bf.preferredTime")}
          </label>
          <select
            id="bf-slot"
            required
            value={effectiveSlot}
            onChange={(e) => setSlot(e.target.value)}
            disabled={wantsLive && (loadingSlots || !slotsReady)}
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100 disabled:opacity-60"
          >
            <option value="" disabled>
              {wantsLive && (loadingSlots || !slotsReady)
                ? t("bf.loadingTimes")
                : t("bf.selectSlot")}
            </option>
            {slotOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {scheduled && slotsReady && !loadingSlots && slotOptions.length === 0 && (
            <p className="mt-1 text-xs text-maroon-600">
              {t("bf.noFreeSlots", {
                name: selectedPandit?.fullName?.split(" ")[0] ?? t("bf.thisPandit"),
              })}
            </p>
          )}
          {scheduled && slotOptions.length > 0 && (
            <p className="mt-1 text-xs text-foreground/65">
              {t("bf.liveAvail", { name: selectedPandit?.fullName ?? "" })}
            </p>
          )}
          {slotMode === "muhurat" && slotsReady && slotOptions.length > 0 && (
            <p className="mt-1 text-xs text-foreground/65">
              {t("bf.muhuratWindows")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="bf-language" className="mb-1 block text-sm font-medium text-foreground/80">
            {t("bf.panditLanguage")}
          </label>
          <select
            id="bf-language"
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
            <label htmlFor="bf-pandit" className="mb-1 block text-sm font-medium text-foreground/80">
              {t("bf.preferredPanditOpt")}
            </label>
            <select
              id="bf-pandit"
              value={panditSlug}
              onChange={(e) => setPanditSlug(e.target.value)}
              className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
            >
              <option value="">{t("bf.anyAvailablePandit")}</option>
              {availablePandits.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.fullName}
                  {p.tier ? ` — ${p.tier}` : ""}
                  {p.experienceYears ? ` (${p.experienceYears} yrs)` : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-foreground/65">
              {availablePandits.length > 0
                ? t("bf.showingPandits", { lang: language })
                : t("bf.noPandits", { lang: language })}
            </p>
          </div>
        )}

        {savedAddresses.length > 0 && (
          <div>
            <label htmlFor="bf-saved-address" className="mb-1 block text-sm font-medium text-foreground/80">
              {t("bf.useSavedAddress")}
            </label>
            <select
              id="bf-saved-address"
              defaultValue={savedAddresses[0]?.id ?? ""}
              onChange={(e) => applySavedAddress(e.target.value)}
              className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
            >
              {savedAddresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label || a.address}
                  {a.city ? ` — ${a.city}` : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-foreground/65">
              {t("bf.savedAddrNote1")}{" "}
              <Link href="/account/addresses" className="text-saffron-700 hover:underline">
                {t("bf.addressBook")}
              </Link>
              .
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="bf-city" className="mb-1 block text-sm font-medium text-foreground/80">
              {t("bf.city")}
            </label>
            <input
              id="bf-city"
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t("bf.cityPlaceholder")}
              className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
            />
          </div>
          <div>
            <label htmlFor="bf-pincode" className="mb-1 block text-sm font-medium text-foreground/80">
              {t("bf.pincode")}
            </label>
            <input
              id="bf-pincode"
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
                {t("bf.notServePincode", {
                  name: selectedPandit.fullName?.split(" ")[0] ?? "",
                })}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="bf-address" className="mb-1 block text-sm font-medium text-foreground/80">
            {t("bf.fullAddress")}
          </label>
          <textarea
            id="bf-address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            placeholder={t("bf.addressPlaceholder")}
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
              {t("bf.addKit", { price: formatINR(kitPrice) })}
            </span>
            <span className="block text-foreground/65">{t("bf.kitNote")}</span>
          </span>
        </label>

        <div>
          <label htmlFor="bf-notes" className="mb-1 block text-sm font-medium text-foreground/80">
            {t("bf.specialRequests")}
          </label>
          <textarea
            id="bf-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t("bf.notesPlaceholder")}
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
        </div>
      </div>

      {travelBand && (
        <div className="mt-4 flex items-center justify-between text-sm text-foreground/65">
          <span>{t("bf.travelLabel", { label: travelBand.label })}</span>
          <span>{travelFee === 0 ? t("bf.free") : `+ ${formatINR(travelFee)}`}</span>
        </div>
      )}

      {peakSurcharge > 0 && peak && (
        <div className="mt-2 flex items-center justify-between text-sm text-saffron-700">
          <span>{t("bf.peakPremium", { label: peak.label, pct: peak.pct })}</span>
          <span>+ {formatINR(peakSurcharge)}</span>
        </div>
      )}

      {user && wallet.available > 0 && (
        <label className="mt-3 flex items-center gap-2 text-sm text-foreground/75">
          <input
            type="checkbox"
            checked={useCredit}
            onChange={(e) => setUseCredit(e.target.checked)}
            className="h-4 w-4 accent-saffron-600"
          />
          {t("bf.useCredit")}{" "}
          <span className="font-medium text-emerald-700">
            {t("bf.available", { amount: formatINR(wallet.available) })}
          </span>
        </label>
      )}

      {creditApplied > 0 && (
        <div className="mt-2 flex items-center justify-between text-sm text-emerald-700">
          <span>{t("bf.storeCredit")}</span>
          <span>− {formatINR(creditApplied)}</span>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-saffron-50 pt-4">
        <span className="text-sm text-foreground/65">{t("bf.totalPayable")}</span>
        <span className="font-heading text-xl text-saffron-700">
          {formatINR(payable)}
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
          ? t("bf.processing")
          : user
            ? t("bf.payConfirm", { amount: formatINR(payable) })
            : t("bf.signInToBook")}
      </button>
      <p className="mt-3 text-center text-xs text-foreground/65">
        {user ? t("bf.securePay") : t("bf.signInFirst")}
      </p>
    </form>
  );
}
