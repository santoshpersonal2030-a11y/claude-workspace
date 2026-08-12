'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart';

type Props = {
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  inStock: boolean;
};

export default function AddToCartButton({
  slug,
  name,
  price,
  imageUrl,
  inStock,
}: Props) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!inStock) {
    return (
      <button
        disabled
        className="mt-2 w-full rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-cream opacity-50 sm:w-auto"
      >
        Out of stock
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="inline-flex items-center rounded-lg border border-gold/50 bg-white">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="px-3 py-2 text-lg text-burgundy"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold text-burgundy-dark">
          {qty}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty((q) => q + 1)}
          className="px-3 py-2 text-lg text-burgundy"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          add({ slug, name, price, image_url: imageUrl }, qty);
          setAdded(true);
        }}
        className="rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-burgundy-dark"
      >
        Add to cart
      </button>

      {added && (
        <Link
          href="/cart"
          className="text-sm font-medium text-burgundy underline underline-offset-2"
        >
          Added ✓ View cart
        </Link>
      )}
    </div>
  );
}
