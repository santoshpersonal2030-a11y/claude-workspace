'use client';

import { useMemo, useState } from 'react';
import type { Category, ProductWithCategories } from '@/lib/types';
import ProductCard from './ProductCard';

export default function Catalog({
  products,
  categories,
}: {
  products: ProductWithCategories[];
  categories: Category[];
}) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory =
        !activeCategory || p.categoryIds.includes(activeCategory);
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, activeCategory]);

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

      {/* Category filter chips */}
      <div className="mb-6 flex flex-wrap gap-2">
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
