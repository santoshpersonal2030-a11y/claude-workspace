"use client";

import { useState } from "react";

import { useCart } from "@/lib/cart";
import type { StoreProduct } from "@/lib/queries";

export default function AddToCartButton({
  product,
}: {
  product: StoreProduct;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const soldOut = product.stock <= 0;

  function handleAdd() {
    add({
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={soldOut}
      className="mt-4 w-full rounded-full bg-saffron-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700 disabled:cursor-not-allowed disabled:bg-foreground/20"
    >
      {soldOut ? "Sold out" : added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
