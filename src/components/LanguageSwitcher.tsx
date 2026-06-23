"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LOCALES, LOCALE_LABEL } from "@/lib/i18n";

// Compact EN / हिन्दी toggle. Persists via the provider's cookie.
export default function LanguageSwitcher({
  className = "",
}: {
  className?: string;
}) {
  const { locale, setLocale } = useLanguage();
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
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded-full px-2 py-0.5 font-semibold transition-colors ${
            locale === l
              ? "bg-saffron-600 text-white"
              : "text-foreground/60 hover:text-saffron-700"
          }`}
        >
          {LOCALE_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
