'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toggleWishlist } from '@/app/wishlist/actions';

export default function WishlistButton({
  productId,
  slug,
  signedIn,
  initialInWishlist,
}: {
  productId: string;
  slug: string;
  signedIn: boolean;
  initialInWishlist: boolean;
}) {
  const [saved, setSaved] = useState(initialInWishlist);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Link
        href={`/login?next=/products/${slug}`}
        className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg border border-burgundy/50 px-4 py-2 text-sm font-medium text-burgundy hover:bg-burgundy hover:text-cream"
      >
        ♡ Save for later
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleWishlist(productId);
          if (res.ok) setSaved(res.inWishlist);
        })
      }
      className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg border border-burgundy/50 px-4 py-2 text-sm font-medium text-burgundy transition hover:bg-burgundy hover:text-cream disabled:opacity-60"
    >
      <span className={saved ? 'text-burgundy' : ''}>{saved ? '♥' : '♡'}</span>
      {saved ? 'Saved' : 'Save for later'}
    </button>
  );
}
