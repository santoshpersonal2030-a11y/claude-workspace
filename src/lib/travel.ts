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
