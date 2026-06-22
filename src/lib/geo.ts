// Geo travel-time via Google Distance Matrix — an OPTIONAL upgrade over the
// manual pincode bands in travel.ts. Active only when GOOGLE_MAPS_API_KEY is
// set AND the environment allows egress; every failure path returns null so
// callers fall back to resolveTravelBand(). Server-only.

import { TRAVEL_BANDS, type TravelBand } from "@/lib/travel";

export function geoConfigured(): boolean {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY);
}

// Maps a real driving distance (km) to one of the existing flat fee bands,
// using the geo-ready maxKm thresholds already declared on TRAVEL_BANDS.
function bandForKm(km: number): TravelBand {
  if (km <= (TRAVEL_BANDS.local.maxKm ?? 10)) return TRAVEL_BANDS.local;
  if (km <= (TRAVEL_BANDS.nearby.maxKm ?? 25)) return TRAVEL_BANDS.nearby;
  return TRAVEL_BANDS.extended;
}

type GeoResult = { band: TravelBand; distanceKm: number; durationMins: number };

// Resolves a travel band by real driving distance/time between two Indian
// pincodes. Returns null when geo is unconfigured, the priest can't reach in
// time (durationMins > maxTravelMins), or any error/egress block occurs — so
// the caller transparently falls back to the manual band.
export async function resolveTravelBandGeo(
  originPincode: string | null,
  destPincode: string,
  maxTravelMins: number,
): Promise<GeoResult | null> {
  if (!geoConfigured() || !originPincode || !destPincode) return null;
  const key = process.env.GOOGLE_MAPS_API_KEY!;

  try {
    const url =
      "https://maps.googleapis.com/maps/api/distancematrix/json" +
      `?origins=${encodeURIComponent(`${originPincode},India`)}` +
      `&destinations=${encodeURIComponent(`${destPincode},India`)}` +
      `&mode=driving&key=${key}`;

    const res = await fetch(url, {
      // Cache identical lookups for a day; never block a booking on geo.
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      rows?: { elements?: { status?: string; distance?: { value: number }; duration?: { value: number } }[] }[];
    };
    const el = data.rows?.[0]?.elements?.[0];
    if (!el || el.status !== "OK" || !el.distance || !el.duration) return null;

    const distanceKm = el.distance.value / 1000;
    const durationMins = el.duration.value / 60;
    if (maxTravelMins > 0 && durationMins > maxTravelMins) return null; // out of range

    return { band: bandForKm(distanceKm), distanceKm, durationMins };
  } catch {
    return null; // egress blocked / timeout / parse error → manual fallback
  }
}
