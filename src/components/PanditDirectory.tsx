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
import { poojaCategories, formatINR, type PoojaCategory } from "@/lib/poojas";
import { resolveTravelBand, isValidPincode } from "@/lib/travel";
import PanditAvatar from "@/components/PanditAvatar";

export default function PanditDirectory({ pandits }: { pandits: Pandit[] }) {
  const [tier, setTier] = useState<PanditTier | "All">("All");
  const [category, setCategory] = useState<PoojaCategory | "All">("All");
  const [pincode, setPincode] = useState("");

  const pinActive = isValidPincode(pincode);

  const filtered = useMemo(() => {
    const list = pandits.filter((p) => {
      const info = panditTierInfo(p.experienceYears);
      if (tier !== "All" && info.tier !== tier) return false;
      if (category !== "All" && !p.specializations.includes(category))
        return false;
      if (pinActive && !resolveTravelBand(pincode, p)) return false;
      return true;
    });
    // When filtering by pincode, surface local (no-fee) priests first.
    if (pinActive) {
      return list.sort(
        (a, b) =>
          (resolveTravelBand(pincode, a)?.fee ?? 0) -
          (resolveTravelBand(pincode, b)?.fee ?? 0),
      );
    }
    return list;
  }, [pandits, tier, category, pincode, pinActive]);

  const selectClass =
    "rounded-full border border-saffron-200 bg-white px-4 py-2 text-sm text-foreground/80 outline-none focus:border-saffron-400";

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-foreground/60">
          Your pincode
          <input
            value={pincode}
            onChange={(e) =>
              setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            placeholder="e.g. 411004"
            className="ml-2 w-32 rounded-full border border-saffron-200 bg-white px-4 py-2 text-sm text-foreground/80 outline-none focus:border-saffron-400"
          />
        </label>
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

      {pincode && !pinActive && (
        <p className="mt-2 text-xs text-maroon-600">
          Enter a valid 6-digit pincode to see who serves your area.
        </p>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((pandit) => {
          const info = panditTierInfo(pandit.experienceYears);
          const band = pinActive ? resolveTravelBand(pincode, pandit) : null;
          return (
            <div
              key={pandit.slug}
              className="flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <PanditAvatar
                  photoUrl={pandit.photoUrl}
                  name={pandit.fullName}
                  className="h-14 w-14"
                  sizes="56px"
                />
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

              {band && (
                <p className="mt-3 text-xs font-medium text-green-700">
                  {band.fee === 0
                    ? `✓ Serves ${pincode} — no travel fee`
                    : `✓ Serves ${pincode} — +${formatINR(band.fee)} travel (${band.label})`}
                </p>
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
