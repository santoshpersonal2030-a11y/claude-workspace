// Travel-fee model for at-home pooja bookings.
//
// v1 is fully manual: a priest's `servicePincodes` list *is* their coverage +
// willingness to travel. Their `homePincode` is their local band (no fee); any
// other serviced pincode incurs a single flat "nearby" band. The band table
// below is intentionally geo-ready — once we add lat/long + a distance matrix,
// the `maxKm` thresholds let us resolve a real distance band instead of the
// home-vs-nearby proxy used today.

export type TravelBandId = "local" | "nearby" | "extended";

export type TravelBand = {
  id: TravelBandId;
  label: string;
  /** Upper bound in km (geo mode). null = open-ended. */
  maxKm: number | null;
  /** Flat fee in INR added to the dakshina. */
  fee: number;
};

// Flat distance bands. v1 uses `local` and `nearby`; `extended` is reserved for
// when geo distances are available.
export const TRAVEL_BANDS: Record<TravelBandId, TravelBand> = {
  local: { id: "local", label: "Local", maxKm: 10, fee: 0 },
  nearby: { id: "nearby", label: "Nearby", maxKm: 25, fee: 500 },
  extended: { id: "extended", label: "Extended", maxKm: null, fee: 1100 },
};

type ServiceArea = {
  homePincode: string | null;
  servicePincodes: string[];
};

/**
 * Resolves the travel band for a customer pincode against a priest's service
 * area (manual / v1). Returns null when the priest does not serve the pincode.
 */
export function resolveTravelBand(
  pincode: string,
  pandit: ServiceArea,
): TravelBand | null {
  const pin = pincode.trim();
  if (!pin) return null;
  if (pandit.homePincode && pandit.homePincode === pin) {
    return TRAVEL_BANDS.local;
  }
  if (pandit.servicePincodes.includes(pin)) {
    return TRAVEL_BANDS.nearby;
  }
  return null;
}

/** True when the priest serves the given pincode (home or listed). */
export function servesPincode(pincode: string, pandit: ServiceArea): boolean {
  return resolveTravelBand(pincode, pandit) !== null;
}

const PINCODE_RE = /^[1-9][0-9]{5}$/;

/** Validates an Indian 6-digit pincode (no leading zero). */
export function isValidPincode(pincode: string): boolean {
  return PINCODE_RE.test(pincode.trim());
}

// ── Nearby (approximate) coverage ───────────────────────────────────────────
// Until real geo distances exist, we approximate proximity by shared leading
// pincode digits. Indian PIN codes are hierarchical: the first 3 digits pin
// down a sorting district, so two pincodes sharing 3+ leading digits are in the
// same area. This powers a "may also serve your area" expansion so a customer
// in an un-listed-but-adjacent pincode still sees plausible priests.

/** Count of leading digits two pincodes share (0–6). */
export function sharedPincodePrefix(a: string, b: string): number {
  const x = a.trim();
  const y = b.trim();
  let n = 0;
  while (n < 6 && x[n] && x[n] === y[n]) n++;
  return n;
}

// Default region granularity: 3 leading digits ≈ same sorting district.
const NEARBY_PREFIX = 3;

/**
 * Best shared-prefix length between the customer pincode and any pincode the
 * priest serves (home or listed), EXCLUDING an exact match. Higher = closer.
 * Returns 0 when nothing is in the same region.
 */
export function nearbyProximity(pincode: string, pandit: ServiceArea): number {
  const pin = pincode.trim();
  if (!isValidPincode(pin)) return 0;
  const candidates = [
    ...(pandit.homePincode ? [pandit.homePincode] : []),
    ...pandit.servicePincodes,
  ];
  let best = 0;
  for (const c of candidates) {
    if (c === pin) continue; // exact handled by resolveTravelBand
    best = Math.max(best, sharedPincodePrefix(pin, c));
  }
  return best;
}

/**
 * True when the priest doesn't serve the pincode exactly but serves a pincode
 * in the same region (shares NEARBY_PREFIX+ leading digits).
 */
export function servesNearby(pincode: string, pandit: ServiceArea): boolean {
  if (resolveTravelBand(pincode, pandit)) return false;
  return nearbyProximity(pincode, pandit) >= NEARBY_PREFIX;
}
