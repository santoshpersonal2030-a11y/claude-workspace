"use client";

import { useCart, useCartDrawer, openCart } from "@/lib/cart";

// Cart indicator for the header. Opens the slide-out mini-cart on click. Lives
// on the client so it can show the live item count without making the
// surrounding pages dynamic.
export default function CartButton() {
  const { count } = useCart();
  const open = useCartDrawer();

  return (
    /* aria-haspopup / aria-expanded / aria-controls were missed by the global accessibility
       pass: the header's menu button, the account menu and the notification bell all have them,
       and this one — on all 96 pages — did not. Without aria-expanded a screen reader user
       presses the button and is told nothing at all about whether the cart opened. The drawer
       it controls is a role="dialog" in CartDrawer.tsx, hence haspopup="dialog". */
    <button
      type="button"
      onClick={openCart}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-saffron-50 hover:text-saffron-700"
      aria-label={`Open cart with ${count} item${count === 1 ? "" : "s"}`}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls="cart-drawer"
    >
      <span className="text-lg" aria-hidden="true">
        🛒
      </span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon-600 px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
