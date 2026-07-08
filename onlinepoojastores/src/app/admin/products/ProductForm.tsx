'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/types';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import ProductThumb from '@/components/ProductThumb';
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
    mrp: initial?.mrp ?? 0,
    sku: initial?.sku ?? '',
    stock: initial?.stock ?? 0,
    image_url: initial?.image_url ?? '',
    is_active: initial?.is_active ?? true,
    categoryId: initial?.categoryId ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Please choose an image under 5 MB.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
    } catch (err) {
      setError(
        err instanceof Error
          ? `Upload failed: ${err.message}`
          : 'Upload failed. Did you run migration 0004?',
      );
    } finally {
      setUploading(false);
    }
  }

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

      <label className="flex flex-col gap-1">
        <span className={label}>
          MRP / original price (optional) — shows a discount if higher than price
        </span>
        <input
          className={input}
          type="number"
          min={0}
          step="1"
          value={form.mrp}
          onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })}
        />
      </label>

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

      <div className="flex flex-col gap-2">
        <span className={label}>Product photo</span>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gold/40">
            <ProductThumb name={form.name || '?'} imageUrl={form.image_url} />
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-burgundy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cream hover:file:bg-burgundy-dark"
            />
            {uploading && (
              <span className="text-xs text-burgundy-dark/60">Uploading…</span>
            )}
            {form.image_url && !uploading && (
              <button
                type="button"
                onClick={() => setForm({ ...form, image_url: '' })}
                className="w-fit text-xs font-medium text-burgundy hover:underline"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
        <input
          className={input}
          value={form.image_url}
          placeholder="…or paste an image URL"
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />
      </div>

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
