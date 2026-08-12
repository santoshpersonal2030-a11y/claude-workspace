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
