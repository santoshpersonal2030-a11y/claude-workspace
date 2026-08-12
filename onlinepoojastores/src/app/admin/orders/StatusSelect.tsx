'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { OrderStatus } from '@/lib/types';
import { updateOrderStatus } from './actions';

const OPTIONS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
];

const LABEL: Record<OrderStatus, string> = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

/* Which states a cancellation returns stock from. MUST match the restock trigger in
   supabase/migrations/0007_restock_on_cancel.sql — if the two ever disagree, this warns about
   the wrong thing, which is worse than not warning at all. qa/checks.js pins both. */
const RESTOCKS_FROM: OrderStatus[] = ['pending', 'confirmed', 'processing'];

export default function StatusSelect({
  orderId,
  current,
}: {
  orderId: string;
  current: OrderStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<OrderStatus>(current);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as OrderStatus;

          /* Cancelling a SHIPPED or DELIVERED order deliberately does NOT put the stock back —
             those goods have physically left. That is correct, and completely invisible: the
             admin clicks Cancelled and reasonably assumes the items returned to the shelf.
             Say so before it happens, while it can still be reconsidered. */
          if (next === 'cancelled' && !RESTOCKS_FROM.includes(current)) {
            const ok = window.confirm(
              `This order is already '${LABEL[current]}', so cancelling it will NOT put the stock ` +
                `back — those goods have left. If they come back, raise the stock by hand once ` +
                `you have checked them.

Cancel anyway?`,
            );
            if (!ok) {
              e.target.value = current;
              return;
            }
          }

          setValue(next);
          setError(null);
          startTransition(async () => {
            const res = await updateOrderStatus(orderId, next);
            if (res.ok) router.refresh();
            else {
              setError(res.error);
              setValue(current);
            }
          });
        }}
        className="rounded-lg border border-gold/50 bg-white px-3 py-1.5 text-sm outline-none focus:border-burgundy"
      >
        {OPTIONS.map((s) => (
          <option key={s} value={s}>
            {LABEL[s]}
          </option>
        ))}
      </select>
      {pending && <span className="text-xs text-burgundy-dark/60">Saving…</span>}
      {error && <span className="text-xs text-burgundy">{error}</span>}
    </span>
  );
}
