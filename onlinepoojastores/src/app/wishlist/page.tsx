import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { formatRupees } from '@/lib/format';
import ProductThumb from '@/components/ProductThumb';
import AddToCartButton from '@/components/AddToCartButton';
import RemoveButton from './RemoveButton';

export const dynamic = 'force-dynamic';

type SavedProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
};

type Row = { products: SavedProduct | null };

export default async function WishlistPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/wishlist');

  const { data } = await supabase
    .from('wishlist_items')
    .select(
      'products(id, name, slug, price, stock, image_url, is_active)',
    )
    .order('created_at', { ascending: false });

  const items = ((data ?? []) as unknown as Row[])
    .map((r) => r.products)
    .filter((p): p is SavedProduct => !!p && p.is_active);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-burgundy-dark">
          Your wishlist is empty
        </p>
        <p className="mt-1 text-sm text-burgundy-dark/70">
          Tap “Save for later” on any product to keep it here.
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-burgundy-dark">Your wishlist</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <div
            key={p.id}
            className="flex flex-col overflow-hidden rounded-xl border border-gold/30 bg-white shadow-sm"
          >
            <Link
              href={`/products/${p.slug}`}
              className="aspect-square overflow-hidden"
            >
              <ProductThumb name={p.name} imageUrl={p.image_url} />
            </Link>
            <div className="flex flex-1 flex-col gap-2 p-3">
              <Link
                href={`/products/${p.slug}`}
                className="line-clamp-2 text-sm font-semibold text-burgundy-dark hover:text-burgundy"
              >
                {p.name}
              </Link>
              <span className="text-lg font-bold text-burgundy">
                {formatRupees(p.price)}
              </span>
              <div className="mt-auto flex items-center justify-between">
                <AddToCartButton
                  slug={p.slug}
                  name={p.name}
                  price={p.price}
                  imageUrl={p.image_url}
                  inStock={p.stock > 0}
                />
              </div>
              <RemoveButton productId={p.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
