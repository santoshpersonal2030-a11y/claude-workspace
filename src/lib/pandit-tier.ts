// Priest seniority ladder, derived purely from verified years of experience.
//
// These are *experience tiers*, not job titles: the band is always computed
// from `experienceYears`, never stored, so the badge can never drift from the
// truth. We deliberately use an ascending scholarly-respect ladder
// (Pandit → Acharya → Vidwan) rather than functional titles like Pujari /
// Purohit, which describe *what* a priest does, not how senior they are.

export type PanditTier = "Pandit" | "Acharya" | "Vidwan";

export type PanditTierInfo = {
  tier: PanditTier;
  /** Inclusive lower bound, in years. */
  minYears: number;
  /** Inclusive upper bound, in years; null means open-ended. */
  maxYears: number | null;
  /** One-line description for tooltips / tier explainers. */
  blurb: string;
};

// Bands: Pandit 0–4 · Acharya 5–15 · Vidwan 16+.
export const PANDIT_TIERS: PanditTierInfo[] = [
  {
    tier: "Pandit",
    minYears: 0,
    maxYears: 4,
    blurb: "Qualified priest, early in their ceremonial journey.",
  },
  {
    tier: "Acharya",
    minYears: 5,
    maxYears: 15,
    blurb: "Seasoned priest with years of hands-on ceremonial experience.",
  },
  {
    tier: "Vidwan",
    minYears: 16,
    maxYears: null,
    blurb: "Master scholar-priest with deep mastery of the shastras.",
  },
];

// Tailwind classes for the tier badge — ascending saffron → gold → maroon,
// mirroring the seniority ladder. Shared by the directory and profile pages.
export const TIER_BADGE_CLASS: Record<PanditTier, string> = {
  Pandit: "bg-saffron-50 text-saffron-700",
  Acharya: "bg-gold-400 text-maroon-800",
  Vidwan: "bg-maroon-700 text-white",
};

/** Maps a year count to its tier. Negative/NaN years fall back to entry tier. */
export function panditTier(experienceYears: number): PanditTier {
  return panditTierInfo(experienceYears).tier;
}

/** Full tier metadata for a year count. */
export function panditTierInfo(experienceYears: number): PanditTierInfo {
  const years = Number.isFinite(experienceYears) ? experienceYears : 0;
  // Highest band whose lower bound is satisfied wins.
  for (let i = PANDIT_TIERS.length - 1; i >= 0; i--) {
    if (years >= PANDIT_TIERS[i].minYears) return PANDIT_TIERS[i];
  }
  return PANDIT_TIERS[0];
}
