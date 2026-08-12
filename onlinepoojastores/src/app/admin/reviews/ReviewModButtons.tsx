'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { approveReview, deleteReview } from './actions';

export default function ReviewModButtons({
  id,
  approved,
}: {
  id: string;
  approved: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(res.error ?? 'Failed');
    });

  return (
    <div className="flex items-center gap-3">
      {!approved && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => approveReview(id))}
          className="text-sm font-medium text-green-700 hover:underline disabled:opacity-50"
        >
          Approve
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm('Delete this review?')) run(() => deleteReview(id));
        }}
        className="text-sm font-medium text-burgundy hover:underline disabled:opacity-50"
      >
        Delete
      </button>
      {error && <span className="text-xs text-burgundy">{error}</span>}
    </div>
  );
}
