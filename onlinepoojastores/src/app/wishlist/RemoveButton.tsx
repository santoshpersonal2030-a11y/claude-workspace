'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeFromWishlist } from './actions';

export default function RemoveButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await removeFromWishlist(productId);
          router.refresh();
        })
      }
      className="text-xs font-medium text-burgundy hover:underline disabled:opacity-50"
    >
      {pending ? 'Removing…' : 'Remove'}
    </button>
  );
}
