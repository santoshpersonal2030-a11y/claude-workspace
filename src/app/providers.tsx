"use client";

import { CartProvider } from "@/lib/cart";
import CartDrawer from "@/components/CartDrawer";
import LanguageProvider from "@/components/LanguageProvider";

// Client-side providers that wrap the whole app (cart state, language, etc.).
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CartProvider>
        {children}
        <CartDrawer />
      </CartProvider>
    </LanguageProvider>
  );
}
