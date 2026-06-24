"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

const STORAGE_KEY = "bmp_announce_dismissed_v1";

const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

function dismiss() {
  localStorage.setItem(STORAGE_KEY, "1");
  listeners.forEach((l) => l());
}

export default function AnnouncementBar() {
  // Read through useSyncExternalStore so SSR and first client render agree and
  // we avoid setState-in-effect. Server renders the bar (false), and it's only
  // hidden after hydration for visitors who previously dismissed it.
  const dismissed = useSyncExternalStore(
    subscribe,
    isDismissed,
    () => false,
  );

  if (dismissed) return null;

  return (
    <section
      aria-label="Announcement"
      className="relative bg-maroon-700 text-cream-100"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-10 py-2 text-center text-xs sm:text-sm">
        <span>🎉 Free delivery on orders over ₹999 —</span>
        <Link
          href="/store?sort=discount"
          className="font-semibold text-gold-400 underline-offset-2 hover:underline"
        >
          shop today&apos;s best deals
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-100/70 hover:text-white"
        aria-label="Dismiss announcement"
      >
        ✕
      </button>
    </section>
  );
}
