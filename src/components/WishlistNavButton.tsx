"use client";

import Link from "next/link";

import { useWishlist } from "@/lib/wishlist";

// Header wishlist link with a saved-count badge.
export default function WishlistNavButton() {
  const { count } = useWishlist();

  return (
    <Link
      href="/account/wishlist"
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-saffron-50 hover:text-maroon-600"
      aria-label={`Saved items${count ? ` (${count})` : ""}`}
    >
      <span className="text-lg" aria-hidden="true">
        ♥
      </span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon-600 px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
