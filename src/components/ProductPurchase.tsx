"use client";

import { useState } from "react";

import { useCart, openCart } from "@/lib/cart";
import type { StoreProduct } from "@/lib/queries";

// Quantity stepper + add-to-cart for the product detail page.
export default function ProductPurchase({
  product,
}: {
  product: StoreProduct;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const soldOut = product.stock <= 0;
  const maxQty = Math.max(1, Math.min(product.stock || 1, 10));

  function handleAdd() {
    add(
      {
        slug: product.slug,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      },
      qty,
    );
    openCart();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-full border border-saffron-200 bg-white">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={soldOut || qty <= 1}
          className="flex h-10 w-10 items-center justify-center rounded-full text-saffron-700 hover:bg-saffron-50 disabled:opacity-40"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-medium">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
          disabled={soldOut || qty >= maxQty}
          className="flex h-10 w-10 items-center justify-center rounded-full text-saffron-700 hover:bg-saffron-50 disabled:opacity-40"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={soldOut}
        className="flex-1 rounded-full bg-saffron-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800 disabled:cursor-not-allowed disabled:bg-foreground/20"
      >
        {soldOut ? "Sold out" : "Add to cart"}
      </button>
    </div>
  );
}
