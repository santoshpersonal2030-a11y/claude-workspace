import Link from 'next/link';
import Catalog from '@/components/Catalog';
import TrustStrip from '@/components/TrustStrip';
import CategoryTiles from '@/components/CategoryTiles';
import { getCategories, getProducts } from '@/lib/data';
import type { Category, ProductWithCategories } from '@/lib/types';

// Always fetch fresh data at request time.
export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

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
      <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-burgundy to-burgundy-dark px-6 py-12 text-cream">
        <h1 className="max-w-xl text-2xl font-bold text-gold sm:text-4xl">
          Everything for your pooja, delivered to your door
        </h1>
        <p className="mt-3 max-w-xl text-sm text-cream/85 sm:text-base">
          Incense, diyas, garlands, camphor and more. Cash on Delivery across
          India — free shipping on orders over ₹999.
        </p>
        <Link
          href="#shop"
          className="mt-5 inline-block rounded-lg bg-gold px-6 py-3 text-sm font-bold text-burgundy-dark transition hover:bg-gold-soft"
        >
          Shop now
        </Link>
      </section>

      {/* Trust strip */}
      <TrustStrip />

      {/* Shop by category */}
      {categories.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-burgundy-dark">
            Shop by category
          </h2>
          <CategoryTiles categories={categories} />
        </section>
      )}

      {/* Catalog */}
      <section id="shop" className="mt-12 scroll-mt-20">
        <h2 className="mb-4 text-lg font-bold text-burgundy-dark">
          {category
            ? categories.find((c) => c.slug === category)?.name ?? 'All products'
            : 'All products'}
        </h2>

        {loadError ? (
          <div className="rounded-lg border border-burgundy/30 bg-white p-6 text-sm text-burgundy-dark">
            <p className="font-semibold">The catalog isn’t loading yet.</p>
            <p className="mt-1 text-burgundy-dark/80">
              Add your Supabase keys to <code>.env.local</code> and restart. (
              {loadError})
            </p>
          </div>
        ) : (
          <Catalog
            products={products}
            categories={categories}
            initialCategorySlug={category}
          />
        )}
      </section>

      {/* Help */}
      <section className="mt-14 rounded-2xl border border-gold/40 bg-gold-soft/40 px-6 py-8 text-center">
        <h2 className="text-lg font-bold text-burgundy-dark">
          Need help choosing?
        </h2>
        <p className="mt-1 text-sm text-burgundy-dark/70">
          We’re happy to help with your pooja needs.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-block rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-cream hover:bg-burgundy-dark"
        >
          Contact us
        </Link>
      </section>
    </div>
  );
}
