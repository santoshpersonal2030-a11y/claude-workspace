'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { formatRupees } from '@/lib/format';
import { computeShipping } from '@/lib/shipping';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import type { Address, ShippingZone } from '@/lib/types';
import { placeOrder } from './actions';

const EMPTY = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
};

function fromAddress(a: Address) {
  return {
    fullName: a.full_name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 ?? '',
    city: a.city,
    state: a.state,
    pincode: a.pincode,
  };
}

export default function CheckoutForm({
  zones,
  savedAddresses,
  signedIn,
  userEmail,
}: {
  zones: ShippingZone[];
  savedAddresses: Address[];
  signedIn: boolean;
  userEmail: string;
}) {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();

  const defaultAddr =
    savedAddresses.find((a) => a.is_default) ?? savedAddresses[0];
  const [selectedId, setSelectedId] = useState<string>(
    defaultAddr ? defaultAddr.id : 'new',
  );
  const [form, setForm] = useState(
    defaultAddr ? fromAddress(defaultAddr) : EMPTY,
  );
  const [notes, setNotes] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usingSaved = selectedId !== 'new';

  const shipping = useMemo(
    () =>
      computeShipping(zones, {
        pincode: form.pincode,
        state: form.state,
        subtotal,
      }),
    [zones, form.pincode, form.state, subtotal],
  );
  const total = subtotal + shipping.fee;

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function pickAddress(id: string) {
    setSelectedId(id);
    if (id === 'new') setForm(EMPTY);
    else {
      const a = savedAddresses.find((x) => x.id === id);
      if (a) setForm(fromAddress(a));
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-burgundy-dark">
          Your cart is empty
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-cream hover:bg-burgundy-dark"
        >
          Browse products
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    // Guests get an anonymous session so the order is tied to them securely.
    if (!signedIn) {
      const supabase = createBrowserSupabase();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        const { error: anonErr } = await supabase.auth.signInAnonymously();
        if (anonErr) {
          setError(
            'Guest checkout isn’t enabled yet. Please sign in to place your order.',
          );
          setBusy(false);
          return;
        }
      }
    }

    const res = await placeOrder({
      ...form,
      notes,
      guestEmail: signedIn ? '' : guestEmail,
      saveNewAddress: signedIn && !usingSaved && saveNewAddress,
      items: items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
    });

    if (res.ok) {
      clear();
      router.push(`/orders/${res.orderNumber}`);
    } else {
      setError(res.error);
      setBusy(false);
    }
  }

  const inputClass =
    'rounded-lg border border-gold/50 bg-white px-4 py-2.5 text-sm outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/20';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-burgundy-dark">Checkout</h1>

      {!signedIn && (
        <p className="mt-1 text-sm text-burgundy-dark/70">
          Checking out as a guest.{' '}
          <Link
            href="/login?next=/checkout"
            className="font-semibold text-burgundy underline"
          >
            Sign in
          </Link>{' '}
          for faster checkout and order history.
        </p>
      )}

      <div className="mt-6 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Saved address picker */}
          {signedIn && savedAddresses.length > 0 && (
            <div className="mb-2 flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase tracking-wide text-burgundy-dark/70">
                Deliver to
              </span>
              {savedAddresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
                    selectedId === a.id
                      ? 'border-burgundy bg-gold-soft/40'
                      : 'border-gold/40 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="addr"
                    checked={selectedId === a.id}
                    onChange={() => pickAddress(a.id)}
                    className="mt-1"
                  />
                  <span className="text-burgundy-dark">
                    <strong>{a.full_name}</strong> · {a.phone}
                    <br />
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} —{' '}
                    {a.pincode}
                  </span>
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gold/40 bg-white p-3 text-sm">
                <input
                  type="radio"
                  name="addr"
                  checked={selectedId === 'new'}
                  onChange={() => pickAddress('new')}
                />
                <span className="text-burgundy-dark">Use a new address</span>
              </label>
            </div>
          )}

          {/* Address fields (shown for new address or guests) */}
          {!usingSaved && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-burgundy-dark/70">
                Delivery address
              </h2>
              <input required placeholder="Full name" value={form.fullName} onChange={set('fullName')} className={inputClass} />
              <input required placeholder="Phone number" value={form.phone} onChange={set('phone')} className={inputClass} inputMode="tel" />
              <input required placeholder="Address line 1 (house no, street)" value={form.line1} onChange={set('line1')} className={inputClass} />
              <input placeholder="Address line 2 (area, landmark) — optional" value={form.line2} onChange={set('line2')} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="City" value={form.city} onChange={set('city')} className={inputClass} />
                <input required placeholder="State" value={form.state} onChange={set('state')} className={inputClass} />
              </div>
              <input required placeholder="Pincode" value={form.pincode} onChange={set('pincode')} className={inputClass} inputMode="numeric" />
              {signedIn && (
                <label className="flex items-center gap-2 text-sm text-burgundy-dark">
                  <input
                    type="checkbox"
                    checked={saveNewAddress}
                    onChange={(e) => setSaveNewAddress(e.target.checked)}
                  />
                  Save this address for next time
                </label>
              )}
            </>
          )}

          {/* Guest email */}
          {!signedIn && (
            <input
              required
              type="email"
              placeholder="Email (for your order confirmation)"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className={inputClass}
              inputMode="email"
            />
          )}

          {/* Delivery notes */}
          <textarea
            placeholder="Delivery notes (optional) — e.g. call before delivery, gate code…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={inputClass}
          />

          {error && <p className="text-sm text-burgundy">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-burgundy-dark disabled:opacity-60"
          >
            {busy ? 'Placing order…' : 'Place order · Cash on Delivery'}
          </button>
          <p className="text-xs text-burgundy-dark/60">
            You’ll pay in cash when your order is delivered.
          </p>
        </form>

        {/* Order summary */}
        <aside className="h-fit rounded-2xl border border-gold/40 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-burgundy-dark/70">
            Order summary
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {items.map((i) => (
              <li key={i.slug} className="flex justify-between text-sm">
                <span className="min-w-0 flex-1 truncate text-burgundy-dark">
                  {i.name} × {i.quantity}
                </span>
                <span className="ml-2 font-medium text-burgundy-dark">
                  {formatRupees(i.price * i.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-gold/40 pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-burgundy-dark/70">Subtotal</span>
              <span className="font-medium">{formatRupees(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-burgundy-dark/70">
                Shipping{shipping.zone ? ` (${shipping.zone.name})` : ''}
              </span>
              <span className="font-medium">
                {shipping.freeApplied ? 'FREE' : formatRupees(shipping.fee)}
              </span>
            </div>
            {!shipping.zone && (
              <p className="mt-1 text-xs text-burgundy-dark/50">
                Enter your pincode &amp; state to see shipping.
              </p>
            )}
            <div className="mt-3 flex justify-between border-t border-gold/40 pt-3 text-base font-bold text-burgundy">
              <span>Total</span>
              <span>{formatRupees(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
