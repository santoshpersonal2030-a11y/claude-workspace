// Thin GA4 wrapper. Dormant until NEXT_PUBLIC_GA_ID is set (and only loads in
// production, see the Analytics component). Every helper is a no-op when gtag
// isn't on the page, so call sites never need to guard.

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params ?? {});
}

export function trackPageView(path: string): void {
  if (typeof window === "undefined" || !window.gtag || !GA_ID) return;
  window.gtag("event", "page_view", { page_path: path });
}

// ── Conversion-funnel events (GA4 recommended-event shapes) ─────────────────

export type AnalyticsItem = {
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
};

export function trackAddToCart(item: AnalyticsItem): void {
  trackEvent("add_to_cart", {
    currency: "INR",
    value: item.price * (item.quantity ?? 1),
    items: [item],
  });
}

export function trackBeginCheckout(
  value: number,
  items?: AnalyticsItem[],
): void {
  trackEvent("begin_checkout", { currency: "INR", value, items });
}

export function trackPurchase(p: {
  value: number;
  transactionId?: string;
  items?: AnalyticsItem[];
}): void {
  trackEvent("purchase", {
    currency: "INR",
    value: p.value,
    transaction_id: p.transactionId,
    items: p.items,
  });
}
