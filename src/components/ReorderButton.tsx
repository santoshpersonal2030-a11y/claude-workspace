"use client";

import { useState } from "react";

import { addToCart, openCart } from "@/lib/cart";
import { announce } from "@/lib/announce";
import { t, getActiveLocale } from "@/lib/i18n";

type ReorderItem = {
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

// Adds all (still-available) items from a past order back into the cart.
export default function ReorderButton({
  items,
  compact = false,
}: {
  items: ReorderItem[];
  compact?: boolean;
}) {
  const [added, setAdded] = useState(false);

  function reorder() {
    for (const item of items) {
      addToCart(
        {
          slug: item.slug,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
        },
        item.quantity,
        { silent: true },
      );
    }
    // One summary announcement instead of one per item.
    announce(
      t(getActiveLocale(), "cart.announceReordered", { count: items.length }),
    );
    setAdded(true);
    openCart();
  }

  return (
    <button
      type="button"
      onClick={reorder}
      className={
        compact
          ? "rounded-full border border-saffron-300 px-4 py-1.5 text-sm font-semibold text-saffron-700 transition-colors hover:bg-saffron-50"
          : "rounded-full bg-saffron-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800"
      }
    >
      {added ? "Added ✓" : "Reorder"}
    </button>
  );
}
