"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

import {
  DEFAULT_LOCALE,
  isLocale,
  t as translate,
  type Locale,
} from "@/lib/i18n";

const COOKIE = "bmp_locale";

// Tiny external store for the locale, backed by a cookie. useSyncExternalStore
// reads it without a setState-in-effect and resolves the SSR→client mismatch
// (server renders the default; the client re-renders with the cookie value).
let current: Locale | null = null;
const listeners = new Set<() => void>();

function readCookie(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const m = document.cookie.match(/(?:^|; )bmp_locale=([^;]*)/);
  const v = m ? decodeURIComponent(m[1]) : "";
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

function getSnapshot(): Locale {
  if (current === null) current = readCookie();
  return current;
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function setLocaleExternal(l: Locale): void {
  current = l;
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  }
  listeners.forEach((f) => f());
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

export default function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Keep <html lang> in sync for accessibility / SEO (not a setState).
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value: Ctx = {
    locale,
    setLocale: setLocaleExternal,
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
