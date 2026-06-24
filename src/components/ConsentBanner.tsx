"use client";

import Link from "next/link";

import { GA_ID } from "@/lib/analytics";
import { useConsent, setConsent } from "@/lib/consent";
import { useT } from "@/components/LanguageProvider";

// Cookie-consent bar. Shown only when analytics is actually configured
// (NEXT_PUBLIC_GA_ID set) and the visitor hasn't chosen yet. Accepting flips
// consent → "granted", which is what lets the Analytics component load gtag.
export default function ConsentBanner() {
  const consent = useConsent();
  const t = useT();

  if (!GA_ID || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label={t("consent.text")}
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-saffron-200 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:px-6">
        <p className="flex-1 text-sm text-foreground/75">
          {t("consent.text")}{" "}
          <Link href="/privacy" className="text-saffron-700 underline">
            {t("consent.privacy")}
          </Link>
        </p>
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setConsent("denied")}
            className="rounded-full border border-stone-200 px-5 py-1.5 text-sm font-medium text-foreground/65 hover:bg-stone-50"
          >
            {t("consent.decline")}
          </button>
          <button
            type="button"
            onClick={() => setConsent("granted")}
            className="rounded-full bg-saffron-700 px-5 py-1.5 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            {t("consent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
