'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { formatRupees } from '@/lib/format';
import ProductThumb from '@/components/ProductThumb';

export default function CartPage() {
  const { items, subtotal, setQuantity, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-burgundy-dark">
          Your cart is empty
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-cream hover:bg-burgundy-dark"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-burgundy-dark">Your cart</h1>

      <ul className="mt-6 flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.slug}
            className="flex items-center gap-4 rounded-xl border border-gold/40 bg-white p-3"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
              <ProductThumb name={item.name} imageUrl={item.image_url} />
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.slug}`}
                className="line-clamp-2 text-sm font-semibold text-burgundy-dark hover:text-burgundy"
              >
                {item.name}
              </Link>
              <p className="text-sm text-burgundy">{formatRupees(item.price)}</p>
            </div>

            <div className="flex items-center rounded-lg border border-gold/50">
              <button
                type="button"
                aria-label="Decrease"
                onClick={() => setQuantity(item.slug, item.quantity - 1)}
                className="px-2.5 py-1.5 text-burgundy"
              >
                −
              </button>
              <span className="w-7 text-center text-sm font-semibold">
                {item.quantity}
              </span>
              <button
                type="button"
                aria-label="Increase"
                onClick={() => setQuantity(item.slug, item.quantity + 1)}
                className="px-2.5 py-1.5 text-burgundy"
              >
                +
              </button>
            </div>

            <div className="w-20 text-right text-sm font-bold text-burgundy-dark">
              {formatRupees(item.price * item.quantity)}
            </div>

            <button
              type="button"
              onClick={() => remove(item.slug)}
              aria-label="Remove"
              className="text-burgundy-dark/50 hover:text-burgundy"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col items-end gap-3 border-t border-gold/40 pt-6">
        <p className="text-sm text-burgundy-dark/70">
          Subtotal:{' '}
          <span className="text-lg font-bold text-burgundy">
            {formatRupees(subtotal)}
          </span>
        </p>
        <p className="text-xs text-burgundy-dark/60">
          Shipping is calculated at checkout · Free over ₹999
        </p>
        <Link
          href="/checkout"
          className="rounded-lg bg-burgundy px-8 py-3 text-sm font-semibold text-cream hover:bg-burgundy-dark"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
