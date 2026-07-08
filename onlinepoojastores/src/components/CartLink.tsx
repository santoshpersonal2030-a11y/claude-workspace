'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';

export default function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="relative hover:text-gold">
      Cart
      {count > 0 && (
        <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-burgundy-dark">
          {count}
        </span>
      )}
    </Link>
  );
}
