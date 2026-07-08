'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/types';
import { createProduct, updateProduct, type ProductInput } from './actions';

type Props = {
  categories: Category[];
  productId?: string;
  initial?: Partial<ProductInput>;
};

export default function ProductForm({ categories, productId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProductInput>({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    price: initial?.price ?? 0,
    sku: initial?.sku ?? '',
    stock: initial?.stock ?? 0,
    image_url: initial?.image_url ?? '',
    is_active: initial?.is_active ?? true,
    categoryId: initial?.categoryId ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = productId
      ? await updateProduct(productId, form)
      : await createProduct(form);
    if (res.ok) {
      router.push('/admin/products');
      router.refresh();
    } else {
      setError(res.error);
      setBusy(false);
    }
  }

  const input =
    'w-full rounded-lg border border-gold/50 bg-white px-3 py-2 text-sm outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/20';
  const label = 'text-sm font-medium text-burgundy-dark';

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className={label}>Product name</span>
        <input
          className={input}
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={label}>Web address (slug) — leave blank to auto-fill</span>
        <input
          className={input}
          value={form.slug}
          placeholder="e.g. brass-pooja-bell-large"
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={label}>Description</span>
        <textarea
          className={input}
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className={label}>Price (₹)</span>
          <input
            className={input}
            type="number"
            min={0}
            step="1"
            required
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: Number(e.target.value) })
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>Stock</span>
          <input
            className={input}
            type="number"
            min={0}
            step="1"
            required
            value={form.stock}
            onChange={(e) =>
              setForm({ ...form, stock: Number(e.target.value) })
            }
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className={label}>Category</span>
          <select
            className={input}
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>SKU (optional)</span>
          <input
            className={input}
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className={label}>Image URL (optional)</span>
        <input
          className={input}
          value={form.image_url}
          placeholder="https://…"
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        <span className={label}>Visible in the store</span>
      </label>

      {error && <p className="text-sm text-burgundy">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-burgundy px-6 py-2.5 text-sm font-semibold text-cream hover:bg-burgundy-dark disabled:opacity-60"
        >
          {busy ? 'Saving…' : productId ? 'Save changes' : 'Add product'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="rounded-lg border border-burgundy px-6 py-2.5 text-sm font-semibold text-burgundy hover:bg-burgundy hover:text-cream"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
