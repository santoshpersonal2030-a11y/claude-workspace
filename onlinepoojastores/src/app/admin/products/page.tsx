import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { formatRupees } from '@/lib/format';
import DeleteProductButton from './DeleteProductButton';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
  product_categories: { categories: { name: string } | null }[] | null;
};

export default async function AdminProducts() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('products')
    .select('id, name, price, stock, is_active, product_categories(categories(name))')
    .order('name');

  const products = (data ?? []) as unknown as Row[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-burgundy-dark">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream hover:bg-burgundy-dark"
        >
          + Add product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gold/40 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gold/40 text-left text-burgundy-dark/70">
              <th className="p-3 font-semibold">Product</th>
              <th className="p-3 font-semibold">Category</th>
              <th className="p-3 font-semibold">Price</th>
              <th className="p-3 font-semibold">Stock</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gold/20 last:border-0">
                <td className="p-3 font-medium text-burgundy-dark">{p.name}</td>
                <td className="p-3 text-burgundy-dark/70">
                  {p.product_categories?.[0]?.categories?.name ?? '—'}
                </td>
                <td className="p-3">{formatRupees(p.price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">
                  {p.is_active ? (
                    <span className="rounded bg-gold-soft px-2 py-0.5 text-xs font-medium text-burgundy-dark">
                      Visible
                    </span>
                  ) : (
                    <span className="rounded bg-burgundy/10 px-2 py-0.5 text-xs font-medium text-burgundy">
                      Hidden
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-sm font-medium text-burgundy hover:underline"
                    >
                      Edit
                    </Link>
                    <DeleteProductButton id={p.id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-burgundy-dark/60">
                  No products yet. Click “Add product”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
