"use client";

import { useSyncExternalStore } from "react";

import { createClient } from "@/lib/supabase/client";

// Client-side wishlist store. Loads the signed-in user's saved product ids once
// and lets any WishlistButton read/toggle them without per-card queries.

const supabase = createClient();

let ids = new Set<string>();
let ready = false;
let loading = false;
let userId: string | null = null;

const SERVER_SNAPSHOT = { ids: new Set<string>(), ready: false };
let snapshot = SERVER_SNAPSHOT;

const listeners = new Set<() => void>();

function publish() {
  snapshot = { ids: new Set(ids), ready };
  listeners.forEach((l) => l());
}

async function ensureLoaded() {
  if (ready || loading) return;
  loading = true;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  userId = user?.id ?? null;
  if (userId) {
    const { data } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", userId);
    ids = new Set((data ?? []).map((r) => r.product_id));
  }
  ready = true;
  loading = false;
  publish();
}

// Reload when the auth state changes (sign in / out).
supabase.auth.onAuthStateChange(() => {
  ids = new Set();
  ready = false;
  loading = false;
  userId = null;
  publish();
  void ensureLoaded();
});

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  void ensureLoaded();
  return () => {
    listeners.delete(cb);
  };
}

export type ToggleResult = { needAuth?: boolean; added?: boolean };

export async function toggleWishlist(productId: string): Promise<ToggleResult> {
  await ensureLoaded();
  if (!userId) return { needAuth: true };

  if (ids.has(productId)) {
    ids.delete(productId);
    publish();
    await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
    return { added: false };
  }

  ids.add(productId);
  publish();
  await supabase
    .from("wishlists")
    .insert({ user_id: userId, product_id: productId });
  return { added: true };
}

export function useWishlist() {
  const snap = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
  return {
    ready: snap.ready,
    has: (id: string) => snap.ids.has(id),
    toggle: toggleWishlist,
  };
}
