'use client';

import { useEffect } from 'react';

export type RecentItem = {
  slug: string;
  name: string;
  price: number;
  image_url: string | null;
  mrp?: number | null;
};

const KEY = 'ops_recent_v1';

// Records the current product into the "recently viewed" list (browser only).
export default function RecordView(item: RecentItem) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const list: RecentItem[] = raw ? JSON.parse(raw) : [];
      const next = [item, ...list.filter((i) => i.slug !== item.slug)].slice(0, 8);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, [item]);
  return null;
}
