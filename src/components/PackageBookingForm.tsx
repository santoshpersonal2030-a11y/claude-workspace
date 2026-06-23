"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { payWithRazorpay } from "@/lib/razorpay-client";
import { timeSlots, languages, formatINR } from "@/lib/poojas";
import { redeemableAmount } from "@/lib/rewards";

type Ceremony = { slug: string; name: string; emoji: string; price: number };

export default function PackageBookingForm({
  ceremonies,
  total,
}: {
  ceremonies: Ceremony[];
  total: number;
}) {
  const router = useRouter();
  const [dates, setDates] = useState<Record<string, string>>({});
  const [slots, setSlots] = useState<Record<string, string>>(
    Object.fromEntries(ceremonies.map((c) => [c.slug, timeSlots[0]])),
  );
  const [shared, setShared] = useState({
    address: "",
    city: "",
    pincode: "",
    language: "",
    samagriKit: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState({ available: 0, maxRedeemPct: 0 });
  const [useCredit, setUseCredit] = useState(true);

  useEffect(() => {
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
  }, []);

  const creditApplied = useCredit
    ? Math.min(
        redeemableAmount(wallet.available, total, wallet.maxRedeemPct),
        Math.max(0, total - 1),
      )
    : 0;
  const payable = total - creditApplied;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const items = ceremonies.map((c) => ({
        poojaSlug: c.slug,
        bookingDate: dates[c.slug] ?? "",
        timeSlot: slots[c.slug] ?? timeSlots[0],
      }));
      if (items.some((i) => !i.bookingDate)) {
        setError("Please pick a date for each ceremony.");
        return;
      }
      const res = await fetch("/api/bookings/package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, ...shared, redeemWallet: useCredit }),
      });
      if (res.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(window.location.pathname)}`,
        );
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create the package.");
        return;
      }
      if (!data.razorpay) {
        // Payments not configured — bookings created, confirm offline.
        router.push("/account/bookings");
        return;
      }
      const result = await payWithRazorpay(data.razorpay, undefined, "Wedding package");
      if (result.ok) router.push("/account/bookings");
      else setError(result.error ?? "Payment was cancelled.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg border border-saffron-200 bg-cream px-3 py-2 text-sm outline-none focus:border-saffron-400";

  return (
    <form
      onSubmit={submit}
      className="mt-8 rounded-3xl border border-gold-200 bg-white p-6 shadow-sm"
    >
      <h3 className="font-heading text-xl text-maroon-800">
        Book the whole package
      </h3>
      <p className="mt-1 text-sm text-foreground/60">
        Pick a date and time for each ceremony and pay once — the same trusted
        Pandit team guides your celebration.
      </p>

      <div className="mt-4 space-y-3">
        {ceremonies.map((c) => (
          <div
            key={c.slug}
            className="grid items-center gap-3 rounded-xl border border-saffron-100 bg-cream/30 p-3 sm:grid-cols-[1.4fr_1fr_1fr]"
          >
            <div className="font-medium text-maroon-700">
              {c.emoji} {c.name}
              <span className="ml-2 text-xs text-foreground/50">
                {formatINR(c.price)}
              </span>
            </div>
            <input
              type="date"
              required
              value={dates[c.slug] ?? ""}
              onChange={(e) =>
                setDates((d) => ({ ...d, [c.slug]: e.target.value }))
              }
              className={field}
            />
            <select
              value={slots[c.slug] ?? timeSlots[0]}
              onChange={(e) =>
                setSlots((s) => ({ ...s, [c.slug]: e.target.value }))
              }
              className={field}
            >
              {timeSlots.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <textarea
          required
          placeholder="Venue address"
          value={shared.address}
          onChange={(e) => setShared({ ...shared, address: e.target.value })}
          className={`${field} sm:col-span-2`}
          rows={2}
        />
        <input
          required
          placeholder="City"
          value={shared.city}
          onChange={(e) => setShared({ ...shared, city: e.target.value })}
          className={field}
        />
        <input
          placeholder="Pincode"
          value={shared.pincode}
          onChange={(e) => setShared({ ...shared, pincode: e.target.value })}
          className={field}
        />
        <select
          value={shared.language}
          onChange={(e) => setShared({ ...shared, language: e.target.value })}
          className={field}
        >
          <option value="">Preferred language</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={shared.samagriKit}
            onChange={(e) =>
              setShared({ ...shared, samagriKit: e.target.checked })
            }
          />
          Add a samagri kit to each ceremony
        </label>
      </div>

      {wallet.available > 0 && (
        <label className="mt-4 flex items-center gap-2 text-sm text-foreground/75">
          <input
            type="checkbox"
            checked={useCredit}
            onChange={(e) => setUseCredit(e.target.checked)}
            className="h-4 w-4 accent-saffron-600"
          />
          Use store credit —{" "}
          <span className="font-medium text-emerald-700">
            {formatINR(wallet.available)} available
          </span>
        </label>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-saffron-50 pt-4">
        <span className="text-sm text-foreground/60">
          {creditApplied > 0 ? "To pay " : "Package total "}
          <span className="font-heading text-xl text-maroon-700">
            {formatINR(payable)}
          </span>
          {creditApplied > 0 && (
            <span className="ml-2 text-xs text-emerald-700">
              (−{formatINR(creditApplied)} credit)
            </span>
          )}
        </span>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-saffron-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-700 disabled:opacity-60"
        >
          {busy ? "Processing…" : "Book the package"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-foreground/45">
        You&apos;ll sign in if needed. Secure payment via Razorpay; the Pandit
        confirms the muhurat for the engagement and wedding.
      </p>
    </form>
  );
}
