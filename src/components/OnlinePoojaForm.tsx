"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import { type Pooja, languages, timeSlots, formatINR } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/client";
import { payWithRazorpay } from "@/lib/razorpay-client";
import { trackPurchase } from "@/lib/analytics";
import { useT } from "@/components/LanguageProvider";

const inputClass =
  "w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100";

// Booking form for a pooja performed live over video. Deliberately simpler than
// the in-person BookingForm — no address, travel or samagri, since a verified
// Pandit joins the customer in an embedded video room.
export default function OnlinePoojaForm({ pooja }: { pooja: Pooja }) {
  const t = useT();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [language, setLanguage] = useState("Hindi");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  const today = new Date().toISOString().split("T")[0];
  const total = pooja.startingPrice;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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
          mode: "online",
          bookingDate: date,
          timeSlot: slot,
          language,
          notes,
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
        `BookMyPoojari — ${pooja.name} (online)`,
      );

      if (!result.ok) {
        setError(result.error ?? t("bf.errPayment"));
        return;
      }

      trackPurchase({
        value: total,
        transactionId: data.bookingId,
        items: [
          { item_name: pooja.name, price: total, item_category: "pooja-online" },
        ],
      });
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
              date: date || "—",
            })}
          </p>
          <p className="mt-3 rounded-xl bg-saffron-50 px-3 py-2 text-xs text-maroon-800">
            🎥 {t("bf.onlineJoinNote")}
          </p>
        </div>
        <Link
          href="/account/bookings"
          className="mt-5 block rounded-full bg-saffron-700 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-saffron-800"
        >
          {t("live.backToBookings")}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
    >
      <p className="rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">
        🎥 {t("bf.onlineNote")}
      </p>

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="op-date" className="mb-1 block text-sm font-medium text-foreground/80">
              {t("bf.date")}
            </label>
            <input
              id="op-date"
              type="date"
              required
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="op-slot" className="mb-1 block text-sm font-medium text-foreground/80">
              {t("bf.preferredTime")}
            </label>
            <select
              id="op-slot"
              required
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                {t("bf.selectSlot")}
              </option>
              {timeSlots.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="op-language" className="mb-1 block text-sm font-medium text-foreground/80">
            {t("bf.panditLanguage")}
          </label>
          <select
            id="op-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={inputClass}
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="op-notes" className="mb-1 block text-sm font-medium text-foreground/80">
            {t("bf.specialRequests")}
          </label>
          <textarea
            id="op-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t("bf.notesPlaceholder")}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-saffron-50 pt-4">
        <span className="text-sm text-foreground/65">{t("bf.totalPayable")}</span>
        <span className="font-heading text-xl text-saffron-700">
          {formatINR(total)}
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
          ? t("bf.processing")
          : user
            ? t("bf.payConfirm", { amount: formatINR(total) })
            : t("bf.signInToBook")}
      </button>
      <p className="mt-3 text-center text-xs text-foreground/65">
        {user ? t("bf.securePay") : t("bf.signInFirst")}
      </p>
    </form>
  );
}
