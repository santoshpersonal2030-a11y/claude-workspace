"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import { type TemplePuja } from "@/lib/temple-pujas";
import { formatINR } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/client";
import { payWithRazorpay } from "@/lib/razorpay-client";
import { trackPurchase } from "@/lib/analytics";
import { useT } from "@/components/LanguageProvider";

const inputClass =
  "w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100";

export default function TemplePujaBookingForm({ puja }: { puja: TemplePuja }) {
  const t = useT();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [devoteeName, setDevoteeName] = useState("");
  const [gotra, setGotra] = useState("");
  const [sankalp, setSankalp] = useState("");
  const [familyNames, setFamilyNames] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setUser(u);
      if (u) {
        setDevoteeName(
          (d) => d || ((u.user_metadata?.full_name as string) ?? ""),
        );
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
      router.push(`/login?next=/temple-puja/${puja.slug}`);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/temple-puja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pujaSlug: puja.slug,
          devoteeName,
          gotra,
          sankalp,
          familyNames,
          preferredDate: preferredDate || undefined,
          phone,
          email,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? t("temple.errBook"));
      }

      const data = (await res.json()) as {
        templePujaId: string;
        razorpay: { orderId: string; amount: number; keyId?: string } | null;
      };

      if (!data.razorpay) {
        setPaid(false);
        setSubmitted(true);
        return;
      }

      const result = await payWithRazorpay(
        data.razorpay,
        { name: devoteeName, email: email || undefined, contact: phone || undefined },
        `BookMyPoojari — ${puja.name} (${puja.temple})`,
      );

      if (!result.ok) {
        setError(result.error ?? t("temple.errPayment"));
        return;
      }

      trackPurchase({
        value: puja.price,
        transactionId: data.templePujaId,
        items: [
          { item_name: puja.name, price: puja.price, item_category: "temple-puja" },
        ],
      });
      setPaid(true);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("temple.errGeneric"));
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
            {paid ? t("temple.confirmedTitle") : t("temple.receivedTitle")}
          </h3>
          <p className="mt-2 text-sm text-foreground/65">
            {t(paid ? "temple.paidText" : "temple.receivedText", {
              puja: puja.name,
              temple: puja.temple,
            })}
          </p>
        </div>
        <Link
          href="/account/temple-pujas"
          className="mt-5 block rounded-full bg-saffron-700 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-saffron-800"
        >
          {t("temple.viewYours")}
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
        {t("temple.formTitle")}
      </h3>
      <p className="mt-1 text-sm text-foreground/65">
        {t("temple.formSubtitle", { price: formatINR(puja.price) })}
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="tp-name" className="mb-1 block text-sm font-medium text-foreground/80">
            {t("temple.devoteeName")}
          </label>
          <input
            id="tp-name"
            type="text"
            required
            value={devoteeName}
            onChange={(e) => setDevoteeName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="tp-gotra" className="mb-1 block text-sm font-medium text-foreground/80">
              {t("temple.gotra")}
            </label>
            <input
              id="tp-gotra"
              type="text"
              value={gotra}
              onChange={(e) => setGotra(e.target.value)}
              placeholder={t("temple.gotraPh")}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tp-date" className="mb-1 block text-sm font-medium text-foreground/80">
              {t("temple.preferredDate")}
            </label>
            <input
              id="tp-date"
              type="date"
              min={today}
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="tp-sankalp" className="mb-1 block text-sm font-medium text-foreground/80">
            {t("temple.sankalp")}
          </label>
          <textarea
            id="tp-sankalp"
            value={sankalp}
            onChange={(e) => setSankalp(e.target.value)}
            rows={2}
            placeholder={t("temple.sankalpPh")}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="tp-family" className="mb-1 block text-sm font-medium text-foreground/80">
            {t("temple.familyNames")}
          </label>
          <input
            id="tp-family"
            type="text"
            value={familyNames}
            onChange={(e) => setFamilyNames(e.target.value)}
            placeholder={t("temple.familyNamesPh")}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="tp-phone" className="mb-1 block text-sm font-medium text-foreground/80">
              {t("temple.phone")}
            </label>
            <input
              id="tp-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tp-email" className="mb-1 block text-sm font-medium text-foreground/80">
              {t("temple.email")}
            </label>
            <input
              id="tp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-saffron-50 pt-4">
        <span className="text-sm text-foreground/65">
          {t("temple.totalPayable")}
        </span>
        <span className="font-heading text-xl text-saffron-700">
          {formatINR(puja.price)}
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
          ? t("temple.processing")
          : user
            ? t("temple.pay", { amount: formatINR(puja.price) })
            : t("temple.signInToBook")}
      </button>
      <p className="mt-3 text-center text-xs text-foreground/65">
        {user ? t("temple.securePay") : t("temple.signInFirst")}
      </p>
    </form>
  );
}
