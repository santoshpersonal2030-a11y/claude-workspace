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
import {
  resolveTravelBand,
  isValidPincode,
  servesNearby,
  nearbyProximity,
} from "@/lib/travel";
import PanditAvatar from "@/components/PanditAvatar";
import { useT } from "@/components/LanguageProvider";

export default function PanditDirectory({ pandits }: { pandits: Pandit[] }) {
  const t = useT();
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
      // With a pincode set, keep priests who serve it exactly OR who serve a
      // nearby pincode in the same region (auto-expanded coverage).
      if (pinActive && !resolveTravelBand(pincode, p) && !servesNearby(pincode, p))
        return false;
      return true;
    });
    // When filtering by pincode, surface exact (lowest-fee) priests first, then
    // nearby (approximate) ones ranked by how close their coverage is.
    if (pinActive) {
      const rank = (p: Pandit) => {
        const band = resolveTravelBand(pincode, p);
        if (band) return band.fee; // 0 / 500 — exact matches sort first
        return 100000 - nearbyProximity(pincode, p); // nearby after exact
      };
      return [...list].sort((a, b) => rank(a) - rank(b));
    }
    return list;
  }, [pandits, tier, category, pincode, pinActive]);

  const nearbyCount = useMemo(
    () =>
      pinActive
        ? filtered.filter(
            (p) => !resolveTravelBand(pincode, p) && servesNearby(pincode, p),
          ).length
        : 0,
    [filtered, pincode, pinActive],
  );

  const selectClass =
    "rounded-full border border-saffron-200 bg-white px-4 py-2 text-sm text-foreground/80 outline-none focus:border-saffron-400";

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-foreground/65">
          {t("dir.pincode")}
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
        <label className="text-sm font-medium text-foreground/65">
          {t("dir.tier")}
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as PanditTier | "All")}
            className={`ml-2 ${selectClass}`}
          >
            <option value="All">{t("dir.allTiers")}</option>
            {PANDIT_TIERS.map((tr) => (
              <option key={tr.tier} value={tr.tier}>
                {t(`ptier.${tr.tier}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-foreground/65">
          {t("dir.performs")}
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as PoojaCategory | "All")
            }
            className={`ml-2 ${selectClass}`}
          >
            <option value="All">{t("dir.allPoojas")}</option>
            {poojaCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-sm text-foreground/65">
          {t(filtered.length === 1 ? "dir.pandit" : "dir.pandits", {
            n: filtered.length,
          })}
        </span>
      </div>

      {pincode && !pinActive && (
        <p className="mt-2 text-xs text-maroon-600">{t("dir.invalidPin")}</p>
      )}

      {pinActive && nearbyCount > 0 && (
        <p className="mt-2 text-xs text-foreground/65">
          {t("dir.nearbyNote", { pin: pincode, n: nearbyCount })}
        </p>
      )}

      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((pandit) => {
          const info = panditTierInfo(pandit.experienceYears);
          const band = pinActive ? resolveTravelBand(pincode, pandit) : null;
          const nearby = pinActive && !band && servesNearby(pincode, pandit);
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
                      title={t(`ptier.blurb.${info.tier}`)}
                    >
                      {t(`ptier.${info.tier}`)}
                    </span>
                    <span className="text-gold-600">
                      ★ {pandit.rating.toFixed(1)}
                    </span>
                    <span className="text-foreground/65">
                      ({pandit.reviewCount})
                    </span>
                    {pandit.verified && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                        {t("home.pandits.verified")}
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
                    ? t("dir.serveNoFee", { pin: pincode })
                    : t("dir.serveFee", {
                        pin: pincode,
                        fee: formatINR(band.fee),
                        label: band.label,
                      })}
                </p>
              )}
              {nearby && (
                <p className="mt-3 text-xs font-medium text-saffron-700">
                  {t("dir.nearby", { pin: pincode })}
                </p>
              )}

              <dl className="mt-4 space-y-1 text-xs text-foreground/65">
                <div className="flex gap-2">
                  <dt className="font-medium text-foreground/65">
                    {t("dir.experience")}
                  </dt>
                  <dd>{t("home.pandits.years", { years: pandit.experienceYears })}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium text-foreground/65">
                    {t("dir.languages")}
                  </dt>
                  <dd>{pandit.languages.join(", ")}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium text-foreground/65">
                    {t("dir.serves")}
                  </dt>
                  <dd>{pandit.regions.join(", ")}</dd>
                </div>
              </dl>

              <Link
                href="/poojas"
                className="mt-5 w-full rounded-full bg-saffron-700 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-saffron-800"
              >
                {t("nav.bookPooja")}
              </Link>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-5 text-center text-foreground/65">
          {t("dir.noMatch")}
        </p>
      )}
    </>
  );
}
