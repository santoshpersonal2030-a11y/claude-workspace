"use client";

import { useState } from "react";

import { addToCart, openCart } from "@/lib/cart";

type ReorderItem = {
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

// Adds all (still-available) items from a past order back into the cart.
export default function ReorderButton({ items }: { items: ReorderItem[] }) {
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
      );
    }
    setAdded(true);
    openCart();
  }

  return (
    <button
      type="button"
      onClick={reorder}
      className="rounded-full bg-saffron-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700"
    >
      {added ? "Added to cart ✓" : "Reorder"}
    </button>
  );
}
