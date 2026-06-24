"use client";

import { createContext, useContext, useEffect } from "react";

import {
  DEFAULT_LOCALE,
  setActiveLocale,
  t as translate,
  type Locale,
} from "@/lib/i18n";

const COOKIE = "bmp_locale";

// Persist the chosen locale in a cookie so the proxy can keep unprefixed URLs
// sticky to a returning visitor's language. The URL segment is the source of
// truth for what actually renders; this is just a hint for the proxy.
function persistLocale(l: Locale): void {
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  }
}

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<Ctx>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => translate(DEFAULT_LOCALE, key),
});

// Locale is now driven by the URL segment ([locale]) and threaded in from the
// server layout via `initialLocale`, so SSR and hydration always agree.
export default function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const locale = initialLocale;

  // Keep the cookie and the module-level active locale in sync with whatever
  // the URL resolved to (the latter lets the cart store localize its SR
  // announcements). Client-only, which also avoids mutating shared module state
  // during SSR.
  useEffect(() => {
    persistLocale(locale);
    setActiveLocale(locale);
  }, [locale]);

  const value: Ctx = {
    locale,
    setLocale: persistLocale,
    t: (key, vars) => translate(locale, key, vars),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

// Convenience hook for components that only need the translator.
export function useT() {
  return useContext(LanguageContext).t;
}
