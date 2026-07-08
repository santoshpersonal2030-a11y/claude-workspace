'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProduct } from './actions';

export default function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Delete “${name}”? This cannot be undone.`)) return;
          startTransition(async () => {
            const res = await deleteProduct(id);
            if (res.ok) router.refresh();
            else setError(res.error);
          });
        }}
        className="text-sm font-medium text-burgundy hover:underline disabled:opacity-50"
      >
        {pending ? 'Deleting…' : 'Delete'}
      </button>
      {error && <span className="ml-2 text-xs text-burgundy">{error}</span>}
    </>
  );
}
