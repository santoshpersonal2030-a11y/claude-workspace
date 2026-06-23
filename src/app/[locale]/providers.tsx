"use client";

import { CartProvider } from "@/lib/cart";
import CartDrawer from "@/components/CartDrawer";
import LanguageProvider from "@/components/LanguageProvider";
import type { Locale } from "@/lib/i18n";

// Client-side providers that wrap the whole app (cart state, language, etc.).
// `locale` is resolved on the server from the URL segment and seeds the
// language provider so SSR and the first client render agree.
export default function Providers({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  return (
    <LanguageProvider initialLocale={locale}>
      <CartProvider>
        {children}
        <CartDrawer />
      </CartProvider>
    </LanguageProvider>
  );
}
