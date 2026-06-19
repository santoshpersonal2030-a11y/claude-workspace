"use client";

import { useMemo, useSyncExternalStore } from "react";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

const STORAGE_KEY = "bmp_cart_v1";

// ── Module-level external store ────────────────────────────────────────────
// Reading cart state through useSyncExternalStore (rather than an effect that
// calls setState) keeps SSR and the first client render consistent and avoids
// cascading-render lint issues.

const EMPTY: CartItem[] = [];
let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) items = JSON.parse(raw) as CartItem[];
  } catch {
    // ignore malformed storage
  }
}

function commit(next: CartItem[]) {
  items = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage may be unavailable; state still updates in memory
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  // Load persisted state the first time anything subscribes (client-only).
  ensureLoaded();
  listeners.add(cb);
  // Notify this subscriber so it picks up the just-loaded state.
  cb();
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): CartItem[] {
  return items;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function addToCart(
  item: Omit<CartItem, "quantity">,
  quantity = 1,
): void {
  ensureLoaded();
  const existing = items.find((i) => i.slug === item.slug);
  if (existing) {
    commit(
      items.map((i) =>
        i.slug === item.slug ? { ...i, quantity: i.quantity + quantity } : i,
      ),
    );
  } else {
    commit([...items, { ...item, quantity }]);
  }
}

export function setCartQuantity(slug: string, quantity: number): void {
  ensureLoaded();
  commit(
    quantity <= 0
      ? items.filter((i) => i.slug !== slug)
      : items.map((i) => (i.slug === slug ? { ...i, quantity } : i)),
  );
}

export function removeFromCart(slug: string): void {
  ensureLoaded();
  commit(items.filter((i) => i.slug !== slug));
}

export function clearCart(): void {
  commit([]);
}

// ── Provider (kept for layout structure) + hook ────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useCart() {
  const current = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return useMemo(() => {
    const count = current.reduce((n, i) => n + i.quantity, 0);
    const subtotal = current.reduce((n, i) => n + i.price * i.quantity, 0);
    return {
      items: current,
      count,
      subtotal,
      add: addToCart,
      setQuantity: setCartQuantity,
      remove: removeFromCart,
      clear: clearCart,
    };
  }, [current]);
}
