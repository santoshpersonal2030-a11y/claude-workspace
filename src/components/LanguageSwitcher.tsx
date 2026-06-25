"use client";

import { usePathname } from "next/navigation";

import { useLanguage } from "@/components/LanguageProvider";
import {
  LOCALES,
  LOCALE_LABEL,
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
} from "@/lib/i18n";

// Given the current browser path, return the path for `target`. English (the
// default locale) is unprefixed; other locales are prefixed (e.g. "/hi/...").
function switchLocalePath(pathname: string, target: Locale): string {
  const segments = pathname.split("/"); // ["", "hi", "poojas"] or ["", "poojas"]
  if (isLocale(segments[1])) segments.splice(1, 1); // drop existing prefix
  const bare = segments.join("/") || "/";
  if (target === DEFAULT_LOCALE) return bare;
  return bare === "/" ? `/${target}` : `/${target}${bare}`;
}

// Compact EN / हिन्दी / తెలుగు toggle. Persists via the provider's cookie, then
// does a FULL navigation (not router.push) so the server re-renders in the new
// language with the new cookie — avoiding Next's client RSC cache serving a
// stale-language payload for the unprefixed (default-locale) URL.
export default function LanguageSwitcher({
  className = "",
}: {
  className?: string;
}) {
  const { locale, setLocale } = useLanguage();
  const pathname = usePathname();

  function choose(l: Locale) {
    if (l === locale) return;
    setLocale(l); // write the cookie synchronously before navigating
    window.location.assign(switchLocalePath(pathname, l));
  }

  return (
    <div
      className={`flex items-center rounded-full border border-saffron-200 bg-white p-0.5 text-xs ${className}`}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={locale === l}
          className={`rounded-full px-2 py-0.5 font-semibold transition-colors ${
            locale === l
              ? "bg-saffron-700 text-white"
              : "text-foreground/65 hover:text-saffron-700"
          }`}
        >
          {LOCALE_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
