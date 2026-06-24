"use client";

import { useRouter } from "next/navigation";

import { useWishlist } from "@/lib/wishlist";

// Heart toggle for saving a product. Reads shared wishlist state so it reflects
// the saved status without its own query.
export default function WishlistButton({
  productId,
  className = "",
}: {
  productId: string;
  className?: string;
}) {
  const { has, toggle } = useWishlist();
  const router = useRouter();
  const saved = has(productId);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const result = await toggle(productId);
    if (result.needAuth) router.push("/login");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved items" : "Save for later"}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm transition-colors hover:bg-white ${
        saved ? "text-maroon-600" : "text-foreground/65 hover:text-maroon-600"
      } ${className}`}
    >
      {saved ? "♥" : "♡"}
    </button>
  );
}
