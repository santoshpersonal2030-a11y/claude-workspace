"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductThumb from "@/components/ProductThumb";
import { useCart } from "@/lib/cart";
import { INDIAN_STATES } from "@/lib/india";
import { formatINR } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/client";
import { payWithRazorpay } from "@/lib/razorpay-client";

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 49;

type SavedAddress = {
  id: string;
  label: string | null;
  address: string;
  city: string | null;
  pincode: string | null;
};

export default function CartPage() {
  const { items, subtotal, setQuantity, remove, clear } = useCart();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [delivery, setDelivery] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
  });
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoaded(true);
    });
  }, [supabase]);

  // Prefill delivery from the profile (name/phone) and the default saved
  // address (RLS-scoped), so returning customers don't retype everything.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      supabase
        .from("addresses")
        .select("id, label, address, city, pincode")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle(),
    ]).then(([addr, prof]) => {
      if (cancelled) return;
      const list = addr.data ?? [];
      setSavedAddresses(list);
      const def = list[0];
      setDelivery((d) => ({
        ...d,
        name: d.name || prof.data?.full_name || "",
        phone: d.phone || prof.data?.phone || "",
        address: d.address || def?.address || "",
        city: d.city || def?.city || "",
        pincode: d.pincode || def?.pincode || "",
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  function applySavedAddress(id: string) {
    const a = savedAddresses.find((x) => x.id === id);
    if (!a) return;
    setDelivery((d) => ({
      ...d,
      address: a.address,
      city: a.city ?? "",
      pincode: a.pincode ?? "",
    }));
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const total = subtotal > 0 ? Math.max(0, subtotal + shipping - discount) : 0;

  async function applyCoupon() {
    setCouponMsg(null);
    const code = couponInput.trim();
    if (!code) return;
    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (data.ok) {
        setCoupon({ code: data.code, discount: data.discount });
        setCouponMsg(`Applied ${data.code} — you save ${formatINR(data.discount)}.`);
      } else {
        setCoupon(null);
        setCouponMsg(data.reason ?? "Invalid code.");
      }
    } catch {
      setCouponMsg("Could not check the code.");
    }
  }

  async function checkout() {
    setError(null);
    if (!delivery.name || !delivery.phone || !delivery.address || !delivery.city) {
      setError("Please fill in your delivery details.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
          couponCode: coupon?.code,
          delivery,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Checkout failed.");
      }

      const data = (await res.json()) as {
        orderId: string;
        razorpay: { orderId: string; amount: number; keyId?: string } | null;
      };

      // Razorpay not configured yet → order is recorded as pending.
      if (!data.razorpay) {
        clear();
        router.push("/account/orders?placed=1");
        return;
      }

      const result = await payWithRazorpay(
        data.razorpay,
        {
          name: delivery.name,
          email: user?.email ?? undefined,
          contact: delivery.phone,
        },
        "BookMyPoojari — Samagri order",
      );

      if (!result.ok) {
        setError(result.error ?? "Payment failed.");
        return;
      }

      clear();
      router.push("/account/orders?paid=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <h1 className="font-heading text-3xl text-maroon-800">Your cart</h1>

          {items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-saffron-100 bg-white p-10 text-center shadow-sm">
              <div className="text-4xl">🛒</div>
              <p className="mt-3 text-foreground/65">Your cart is empty.</p>
              <Link
                href="/store"
                className="mt-5 inline-block rounded-full bg-saffron-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-700"
              >
                Browse the store
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
              {/* Items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.slug}
                    className="flex items-center gap-4 rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
                  >
                    <ProductThumb
                      imageUrl={item.imageUrl}
                      name={item.name}
                      className="h-14 w-14 rounded-xl"
                      emojiSize="text-2xl"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {item.name}
                      </h3>
                      <p className="text-sm text-foreground/60">
                        {formatINR(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.slug, item.quantity - 1)
                        }
                        className="h-8 w-8 rounded-full border border-saffron-200 text-saffron-700 hover:bg-saffron-50"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.slug, item.quantity + 1)
                        }
                        className="h-8 w-8 rounded-full border border-saffron-200 text-saffron-700 hover:bg-saffron-50"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <div className="w-20 text-right font-medium">
                      {formatINR(item.price * item.quantity)}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.slug)}
                      className="text-foreground/40 hover:text-maroon-600"
                      aria-label={`Remove ${item.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Summary + checkout */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm">
                  <h2 className="font-heading text-xl text-maroon-700">
                    Order summary
                  </h2>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-foreground/60">Subtotal</dt>
                      <dd>{formatINR(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-foreground/60">Shipping</dt>
                      <dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <dt>Discount ({coupon?.code})</dt>
                        <dd>− {formatINR(discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-saffron-50 pt-2 text-base font-semibold">
                      <dt>Total</dt>
                      <dd className="text-saffron-700">{formatINR(total)}</dd>
                    </div>
                  </dl>

                  {/* Coupon */}
                  <div className="mt-4 border-t border-saffron-50 pt-4">
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        className="w-full rounded-lg border border-saffron-200 bg-cream px-3 py-2 text-sm uppercase outline-none focus:border-saffron-400"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        className="whitespace-nowrap rounded-lg border border-saffron-300 px-4 py-2 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
                      >
                        Apply
                      </button>
                    </div>
                    {couponMsg && (
                      <p
                        className={`mt-2 text-xs ${
                          discount > 0 ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {couponMsg}
                      </p>
                    )}
                  </div>

                  {!authLoaded ? null : !user ? (
                    <div className="mt-5">
                      <p className="text-sm text-foreground/65">
                        Please sign in to checkout.
                      </p>
                      <Link
                        href="/login?next=/cart"
                        className="mt-3 block w-full rounded-full bg-saffron-600 py-3 text-center text-sm font-semibold text-white hover:bg-saffron-700"
                      >
                        Sign in to continue
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {savedAddresses.length > 0 && (
                        <select
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
                      )}
                      <input
                        type="text"
                        placeholder="Full name"
                        value={delivery.name}
                        onChange={(e) =>
                          setDelivery({ ...delivery, name: e.target.value })
                        }
                        className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
                      />
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={delivery.phone}
                        onChange={(e) =>
                          setDelivery({ ...delivery, phone: e.target.value })
                        }
                        className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
                      />
                      <textarea
                        placeholder="Delivery address"
                        rows={2}
                        value={delivery.address}
                        onChange={(e) =>
                          setDelivery({ ...delivery, address: e.target.value })
                        }
                        className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
                      />
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="City"
                          value={delivery.city}
                          onChange={(e) =>
                            setDelivery({ ...delivery, city: e.target.value })
                          }
                          className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
                        />
                        <input
                          type="text"
                          placeholder="PIN code"
                          value={delivery.pincode}
                          onChange={(e) =>
                            setDelivery({
                              ...delivery,
                              pincode: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
                        />
                      </div>
                      <select
                        value={delivery.state}
                        onChange={(e) =>
                          setDelivery({ ...delivery, state: e.target.value })
                        }
                        className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
                      >
                        <option value="">Select state…</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="GSTIN (optional, for business invoice)"
                        value={delivery.gstin}
                        onChange={(e) =>
                          setDelivery({ ...delivery, gstin: e.target.value })
                        }
                        className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
                      />

                      {error && (
                        <p className="rounded-xl bg-maroon-50 px-3 py-2 text-sm text-maroon-700">
                          {error}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={checkout}
                        disabled={busy}
                        className="w-full rounded-full bg-saffron-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700 disabled:opacity-60"
                      >
                        {busy
                          ? "Processing…"
                          : `Pay ${formatINR(total)}`}
                      </button>
                      <p className="text-center text-xs text-foreground/50">
                        Secure payment via Razorpay.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
