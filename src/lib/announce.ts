"use client";

import { useSyncExternalStore } from "react";

// Tiny external store backing a single global ARIA live region. Call announce()
// from anywhere (cart mutations, async results) to have screen readers read a
// message politely, without moving focus. Mirrors the cart store's pattern so
// SSR and the first client render stay consistent.

let message = "";
let counter = 0;
const listeners = new Set<() => void>();

export function announce(text: string): void {
  if (!text) return;
  counter += 1;
  // Toggle a trailing non-breaking space so announcing the same text twice in a
  // row still changes the live region's text node and is re-read by the SR.
  message = counter % 2 === 0 ? text : `${text} `;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useAnnouncement(): string {
  return useSyncExternalStore(
    subscribe,
    () => message,
    () => "",
  );
}
