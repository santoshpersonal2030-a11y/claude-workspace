"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { useCart, useCartDrawer, closeCart } from "@/lib/cart";
import ProductThumb from "@/components/ProductThumb";
import { formatINR } from "@/lib/poojas";
import { useT } from "@/components/LanguageProvider";

export default function CartDrawer() {
  const t = useT();
  const open = useCartDrawer();
  const { items, subtotal, setQuantity, remove } = useCart();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Move focus into the dialog on open; restore it to the trigger on close.
  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => closeRef.current?.focus());
    } else {
      lastFocused.current?.focus?.();
    }
  }, [open]);

  // Escape closes; Tab is trapped within the panel while open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeCart();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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
        ref={panelRef}
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={t("cart.title")}
      >
        <header className="flex items-center justify-between border-b border-saffron-100 px-5 py-3">
          <h2 className="font-heading text-lg text-maroon-800">
            {t("cart.title")}{items.length > 0 ? ` (${items.length})` : ""}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/65 hover:bg-saffron-50"
            aria-label={t("cart.closeCart")}
          >
            ✕
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="text-4xl">🛒</div>
            <p className="mt-3 text-foreground/65">{t("cart.empty")}</p>
            <Link
              href="/store"
              onClick={closeCart}
              className="mt-5 rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
            >
              {t("cart.browseStore")}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.slug} className="flex gap-3">
                    <ProductThumb
                      imageUrl={item.imageUrl}
                      name={item.name}
                      className="h-14 w-14 flex-shrink-0 rounded-xl shadow-sm"
                      emojiSize="text-2xl"
                    />
                    <div className="flex-1">
                      <Link
                        href={`/store/${item.slug}`}
                        onClick={closeCart}
                        className="text-sm font-medium text-foreground hover:text-saffron-700"
                      >
                        {item.name}
                      </Link>
                      <div className="mt-0.5 text-xs text-foreground/65">
                        {formatINR(item.price)}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.slug, item.quantity - 1)}
                          className="h-7 w-7 rounded-full border border-saffron-200 text-saffron-700 hover:bg-saffron-50"
                          aria-label={t("cart.decrease")}
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
                          aria-label={t("cart.increase")}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(item.slug)}
                          className="ml-auto text-xs text-foreground/65 hover:text-maroon-600"
                        >
                          {t("cart.remove")}
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

            <footer className="border-t border-saffron-100 px-5 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/65">{t("cart.subtotal")}</span>
                <span className="font-heading text-lg text-saffron-700">
                  {formatINR(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-foreground/65">
                {t("cart.shippingNote")}
              </p>
              <Link
                href="/cart"
                onClick={closeCart}
                className="mt-4 block w-full rounded-full bg-saffron-700 py-3 text-center text-sm font-semibold text-white hover:bg-saffron-800"
              >
                {t("cart.viewCheckout")}
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
