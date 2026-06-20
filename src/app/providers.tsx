"use client";

import { CartProvider } from "@/lib/cart";
import CartDrawer from "@/components/CartDrawer";

// Client-side providers that wrap the whole app (cart state, etc.).
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
