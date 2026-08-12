'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductThumb from './ProductThumb';
import { formatRupees } from '@/lib/format';
import type { RecentItem } from './RecordView';

const KEY = 'ops_recent_v1';

export default function RecentlyViewed({
  excludeSlug,
}: {
  excludeSlug?: string;
}) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const list: RecentItem[] = raw ? JSON.parse(raw) : [];
      setItems(list.filter((i) => i.slug !== excludeSlug).slice(0, 4));
    } catch {
      setItems([]);
    }
  }, [excludeSlug]);

  if (items.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-lg font-bold text-burgundy-dark">
        Recently viewed
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-gold/30 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="aspect-square overflow-hidden">
              <ProductThumb name={p.name} imageUrl={p.image_url} />
            </div>
            <div className="flex flex-1 flex-col p-3">
              <h3 className="line-clamp-2 text-sm font-semibold text-burgundy-dark group-hover:text-burgundy">
                {p.name}
              </h3>
              <span className="mt-auto pt-2 text-lg font-bold text-burgundy">
                {formatRupees(p.price)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
