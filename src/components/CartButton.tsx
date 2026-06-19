"use client";

import Link from "next/link";

import { useCart } from "@/lib/cart";

// Cart indicator for the header. Lives on the client so it can show the live
// item count without making the surrounding pages dynamic.
export default function CartButton() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-saffron-50 hover:text-saffron-700"
      aria-label={`Cart with ${count} item${count === 1 ? "" : "s"}`}
    >
      <span className="text-lg" aria-hidden="true">
        🛒
      </span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon-600 px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
