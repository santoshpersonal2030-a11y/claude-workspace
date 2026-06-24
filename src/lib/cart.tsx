"use client";

import { useMemo, useSyncExternalStore } from "react";

import { createClient } from "@/lib/supabase/client";
import { announce } from "@/lib/announce";
import { trackAddToCart } from "@/lib/analytics";
import { t, getActiveLocale } from "@/lib/i18n";
import type { Json } from "@/lib/database.types";

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
  scheduleRemoteSync();
}

// ── Server-side cart snapshot (for abandoned-cart reminders) ────────────────
// For signed-in users we mirror the cart into the `carts` table, debounced.

const supabase = createClient();
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRemoteSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void syncRemoteCart();
  }, 1500);
}

async function syncRemoteCart() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (items.length === 0) {
    await supabase.from("carts").delete().eq("user_id", user.id);
    return;
  }
  await supabase.from("carts").upsert({
    user_id: user.id,
    items: items as unknown as Json,
    updated_at: new Date().toISOString(),
    notified_at: null,
  });
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

// `silent` suppresses the screen-reader announcement — used by bulk callers
// (e.g. reorder) that emit a single summary instead of one per item.
export function addToCart(
  item: Omit<CartItem, "quantity">,
  quantity = 1,
  { silent = false }: { silent?: boolean } = {},
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
  if (!silent) {
    announce(t(getActiveLocale(), "cart.announceAdded", { name: item.name }));
    trackAddToCart({ item_name: item.name, price: item.price, quantity });
  }
}

export function setCartQuantity(slug: string, quantity: number): void {
  ensureLoaded();
  if (quantity <= 0) {
    removeFromCart(slug);
    return;
  }
  commit(items.map((i) => (i.slug === slug ? { ...i, quantity } : i)));
}

export function removeFromCart(slug: string): void {
  ensureLoaded();
  const removed = items.find((i) => i.slug === slug);
  commit(items.filter((i) => i.slug !== slug));
  if (removed) {
    announce(
      t(getActiveLocale(), "cart.announceRemoved", { name: removed.name }),
    );
  }
}

export function clearCart(): void {
  commit([]);
}

// ── Provider (kept for layout structure) + hook ────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ── Mini-cart drawer open/close state ──────────────────────────────────────

let drawerOpen = false;
const drawerListeners = new Set<() => void>();

function emitDrawer() {
  drawerListeners.forEach((l) => l());
}

export function openCart() {
  drawerOpen = true;
  emitDrawer();
}

export function closeCart() {
  drawerOpen = false;
  emitDrawer();
}

function subscribeDrawer(cb: () => void): () => void {
  drawerListeners.add(cb);
  return () => {
    drawerListeners.delete(cb);
  };
}

export function useCartDrawer(): boolean {
  return useSyncExternalStore(
    subscribeDrawer,
    () => drawerOpen,
    () => false,
  );
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
