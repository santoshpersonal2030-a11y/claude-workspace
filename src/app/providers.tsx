"use client";

import { CartProvider } from "@/lib/cart";

// Client-side providers that wrap the whole app (cart state, etc.).
export default function Providers({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
