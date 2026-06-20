"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useCart, useCartDrawer, closeCart } from "@/lib/cart";
import { formatINR } from "@/lib/poojas";

export default function CartDrawer() {
  const open = useCartDrawer();
  const { items, subtotal, setQuantity, remove } = useCart();

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-maroon-900/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        <header className="flex items-center justify-between border-b border-saffron-100 px-5 py-4">
          <h2 className="font-heading text-lg text-maroon-800">
            Your cart{items.length > 0 ? ` (${items.length})` : ""}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 hover:bg-saffron-50"
            aria-label="Close cart"
          >
            ✕
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="text-4xl">🛒</div>
            <p className="mt-3 text-foreground/65">Your cart is empty.</p>
            <Link
              href="/store"
              onClick={closeCart}
              className="mt-5 rounded-full bg-saffron-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-700"
            >
              Browse the store
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.slug} className="flex gap-3">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                      🪔
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/store/${item.slug}`}
                        onClick={closeCart}
                        className="text-sm font-medium text-foreground hover:text-saffron-700"
                      >
                        {item.name}
                      </Link>
                      <div className="mt-0.5 text-xs text-foreground/55">
                        {formatINR(item.price)}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.slug, item.quantity - 1)}
                          className="h-7 w-7 rounded-full border border-saffron-200 text-saffron-700 hover:bg-saffron-50"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.slug, item.quantity + 1)}
                          className="h-7 w-7 rounded-full border border-saffron-200 text-saffron-700 hover:bg-saffron-50"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(item.slug)}
                          className="ml-auto text-xs text-foreground/45 hover:text-maroon-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {formatINR(item.price * item.quantity)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="border-t border-saffron-100 px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/60">Subtotal</span>
                <span className="font-heading text-lg text-saffron-700">
                  {formatINR(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-foreground/50">
                Shipping calculated at checkout. Free over ₹999.
              </p>
              <Link
                href="/cart"
                onClick={closeCart}
                className="mt-4 block w-full rounded-full bg-saffron-600 py-3 text-center text-sm font-semibold text-white hover:bg-saffron-700"
              >
                View cart & checkout
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
