'use client';

import { useMemo, useState } from 'react';
import type { Category, ProductWithCategories } from '@/lib/types';
import ProductCard from './ProductCard';

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'newest';

export default function Catalog({
  products,
  categories,
  initialCategorySlug,
}: {
  products: ProductWithCategories[];
  categories: Category[];
  initialCategorySlug?: string;
}) {
  const initialCat =
    categories.find((c) => c.slug === initialCategorySlug)?.id ?? null;

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCat);
  const [sort, setSort] = useState<Sort>('featured');
  const [maxPrice, setMaxPrice] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cap = maxPrice ? Number(maxPrice) : Infinity;

    const list = products.filter((p) => {
      const okCat = !activeCategory || p.categoryIds.includes(activeCategory);
      const okQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q);
      const okPrice = p.price <= cap;
      return okCat && okQ && okPrice;
    });

    const sorted = [...list];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sort === 'newest')
      sorted.sort((a, b) =>
        (b.created_at ?? '').localeCompare(a.created_at ?? ''),
      );
    return sorted;
  }, [products, query, activeCategory, sort, maxPrice]);

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for incense, diyas, garlands…"
          className="w-full rounded-lg border border-gold/50 bg-white px-4 py-2.5 text-sm outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/20"
        />
      </div>

      {/* Category chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={chipClass(activeCategory === null)}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={chipClass(activeCategory === c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Sort + price */}
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-burgundy-dark/70">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-lg border border-gold/50 bg-white px-3 py-1.5 outline-none focus:border-burgundy"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="newest">Newest</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-burgundy-dark/70">Max ₹</span>
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Any"
            className="w-24 rounded-lg border border-gold/50 bg-white px-3 py-1.5 outline-none focus:border-burgundy"
          />
        </label>
        <span className="ml-auto text-burgundy-dark/60">
          {filtered.length} item{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-burgundy-dark/70">
          No products match your search.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function chipClass(active: boolean): string {
  return [
    'rounded-full border px-3 py-1.5 text-xs font-medium transition',
    active
      ? 'border-burgundy bg-burgundy text-cream'
      : 'border-gold/50 bg-white text-burgundy-dark hover:border-burgundy',
  ].join(' ');
}
