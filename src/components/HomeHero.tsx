"use client";

import Link from "next/link";

import { useT } from "@/components/LanguageProvider";

// Translated hero copy + CTAs for the homepage. Kept as a small client island
// so the rest of the (server-rendered) page and its data fetching are untouched.
export default function HomeHero() {
  const t = useT();
  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full border border-saffron-200 bg-saffron-50 px-4 py-1.5 text-sm font-medium text-saffron-700">
        {t("home.heroBadge")}
      </span>
      <h1 className="mt-5 text-balance font-heading text-4xl leading-tight text-maroon-800 sm:text-5xl">
        {t("home.heroTitle")}
      </h1>
      <p className="mt-5 max-w-lg text-lg text-foreground/75">
        {t("home.heroSubtitle")}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/poojas"
          className="rounded-full bg-saffron-700 px-7 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800"
        >
          {t("nav.bookPooja")}
        </Link>
        <Link
          href="/store"
          className="rounded-full border border-saffron-300 bg-white px-7 py-3 text-base font-semibold text-saffron-700 transition-colors hover:bg-saffron-50"
        >
          {t("common.shopSamagri")}
        </Link>
      </div>
      <p className="mt-4 text-sm text-foreground/65">{t("home.heroRating")}</p>
    </div>
  );
}
