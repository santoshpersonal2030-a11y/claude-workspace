import Catalog from '@/components/Catalog';
import { getCategories, getProducts } from '@/lib/data';
import type { Category, ProductWithCategories } from '@/lib/types';

// Always fetch fresh data at request time.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let products: ProductWithCategories[] = [];
  let categories: Category[] = [];
  let loadError: string | null = null;

  try {
    [products, categories] = await Promise.all([getProducts(), getCategories()]);
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : 'Could not load the catalog.';
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero */}
      <section className="mb-8 rounded-2xl bg-gradient-to-r from-burgundy to-burgundy-dark px-6 py-10 text-cream">
        <h1 className="text-2xl font-bold text-gold sm:text-3xl">
          Everything for your pooja, delivered to your door
        </h1>
        <p className="mt-2 max-w-xl text-sm text-cream/85">
          Incense, diyas, garlands, camphor and more. Cash on Delivery across
          India — free shipping on orders over ₹999.
        </p>
      </section>

      {loadError ? (
        <div className="rounded-lg border border-burgundy/30 bg-white p-6 text-sm text-burgundy-dark">
          <p className="font-semibold">The catalog isn’t loading yet.</p>
          <p className="mt-1 text-burgundy-dark/80">
            Add your Supabase keys to <code>.env.local</code> and restart. (
            {loadError})
          </p>
        </div>
      ) : (
        <Catalog products={products} categories={categories} />
      )}
    </div>
  );
}
