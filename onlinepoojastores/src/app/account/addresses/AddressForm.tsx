'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Address } from '@/lib/types';
import { saveAddress, type AddressInput } from './actions';

export default function AddressForm({
  existing,
  onDone,
}: {
  existing?: Address;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<AddressInput>({
    label: existing?.label ?? 'home',
    full_name: existing?.full_name ?? '',
    phone: existing?.phone ?? '',
    line1: existing?.line1 ?? '',
    line2: existing?.line2 ?? '',
    city: existing?.city ?? '',
    state: existing?.state ?? '',
    pincode: existing?.pincode ?? '',
    is_default: existing?.is_default ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set =
    (k: keyof AddressInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const input =
    'rounded-lg border border-gold/50 bg-white px-3 py-2 text-sm outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/20';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await saveAddress(form, existing?.id);
    if (res.ok) {
      router.refresh();
      onDone?.();
    } else {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-gold/40 bg-white p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <input required placeholder="Full name" value={form.full_name} onChange={set('full_name')} className={input} />
        <input required placeholder="Phone" value={form.phone} onChange={set('phone')} className={input} inputMode="tel" />
      </div>
      <input required placeholder="Address line 1" value={form.line1} onChange={set('line1')} className={input} />
      <input placeholder="Address line 2 (optional)" value={form.line2} onChange={set('line2')} className={input} />
      <div className="grid grid-cols-2 gap-3">
        <input required placeholder="City" value={form.city} onChange={set('city')} className={input} />
        <input required placeholder="State" value={form.state} onChange={set('state')} className={input} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input required placeholder="Pincode" value={form.pincode} onChange={set('pincode')} className={input} inputMode="numeric" />
        <select value={form.label} onChange={set('label')} className={input}>
          <option value="home">Home</option>
          <option value="work">Work</option>
          <option value="other">Other</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-burgundy-dark">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
        />
        Make this my default address
      </label>

      {error && <p className="text-sm text-burgundy">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-burgundy px-5 py-2 text-sm font-semibold text-cream hover:bg-burgundy-dark disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save address'}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-burgundy px-5 py-2 text-sm font-semibold text-burgundy hover:bg-burgundy hover:text-cream"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
