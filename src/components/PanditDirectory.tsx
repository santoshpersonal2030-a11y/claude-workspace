"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Pandit } from "@/lib/pandits";
import {
  panditTierInfo,
  PANDIT_TIERS,
  TIER_BADGE_CLASS,
  type PanditTier,
} from "@/lib/pandit-tier";
import { poojaCategories, type PoojaCategory } from "@/lib/poojas";

function initials(name: string) {
  return name
    .replace(/^(Pandit|Acharya|Vidwan)\s+/i, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function PanditDirectory({ pandits }: { pandits: Pandit[] }) {
  const [tier, setTier] = useState<PanditTier | "All">("All");
  const [category, setCategory] = useState<PoojaCategory | "All">("All");

  const filtered = useMemo(
    () =>
      pandits.filter((p) => {
        const info = panditTierInfo(p.experienceYears);
        if (tier !== "All" && info.tier !== tier) return false;
        if (category !== "All" && !p.specializations.includes(category))
          return false;
        return true;
      }),
    [pandits, tier, category],
  );

  const selectClass =
    "rounded-full border border-saffron-200 bg-white px-4 py-2 text-sm text-foreground/80 outline-none focus:border-saffron-400";

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-foreground/60">
          Tier
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as PanditTier | "All")}
            className={`ml-2 ${selectClass}`}
          >
            <option value="All">All tiers</option>
            {PANDIT_TIERS.map((t) => (
              <option key={t.tier} value={t.tier}>
                {t.tier}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-foreground/60">
          Performs
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as PoojaCategory | "All")
            }
            className={`ml-2 ${selectClass}`}
          >
            <option value="All">All poojas</option>
            {poojaCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-sm text-foreground/50">
          {filtered.length} pandit{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((pandit) => {
          const info = panditTierInfo(pandit.experienceYears);
          return (
            <div
              key={pandit.slug}
              className="flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-saffron-100 font-heading text-lg text-saffron-700">
                  {initials(pandit.fullName)}
                </div>
                <div>
                  <Link
                    href={`/pandits/${pandit.slug}`}
                    className="font-heading text-lg text-maroon-700 hover:text-saffron-700"
                  >
                    {pandit.fullName}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TIER_BADGE_CLASS[info.tier]}`}
                      title={info.blurb}
                    >
                      {info.tier}
                    </span>
                    <span className="text-gold-600">
                      ★ {pandit.rating.toFixed(1)}
                    </span>
                    <span className="text-foreground/45">
                      ({pandit.reviewCount})
                    </span>
                    {pandit.verified && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-4 flex-1 text-sm text-foreground/65">
                {pandit.bio}
              </p>

              {pandit.specializations.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {pandit.specializations.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-cream-100 px-2.5 py-0.5 text-[11px] font-medium text-maroon-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <dl className="mt-4 space-y-1 text-xs text-foreground/60">
                <div className="flex gap-2">
                  <dt className="font-medium text-foreground/50">Experience</dt>
                  <dd>{pandit.experienceYears}+ years</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium text-foreground/50">Languages</dt>
                  <dd>{pandit.languages.join(", ")}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium text-foreground/50">Serves</dt>
                  <dd>{pandit.regions.join(", ")}</dd>
                </div>
              </dl>

              <Link
                href="/poojas"
                className="mt-5 w-full rounded-full bg-saffron-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-saffron-700"
              >
                Book a Pooja
              </Link>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-foreground/60">
          No pandits match these filters yet. Try widening your selection.
        </p>
      )}
    </>
  );
}
