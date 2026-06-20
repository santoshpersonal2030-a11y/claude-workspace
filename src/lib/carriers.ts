// Supported shipping carriers and how to build a tracking URL for each.

export type Carrier = {
  key: string;
  name: string;
  // Returns the public tracking URL for a given tracking number.
  url: (trackingNumber: string) => string;
};

export const CARRIERS: Carrier[] = [
  {
    key: "delhivery",
    name: "Delhivery",
    url: (n) => `https://www.delhivery.com/track/package/${encodeURIComponent(n)}`,
  },
  {
    key: "bluedart",
    name: "Blue Dart",
    url: (n) =>
      `https://www.bluedart.com/web/guest/trackdartresultthirdparty?trackFor=0&trackNo=${encodeURIComponent(n)}`,
  },
  {
    key: "dtdc",
    name: "DTDC",
    url: (n) =>
      `https://www.dtdc.in/tracking/tracking_results.asp?strCnno=${encodeURIComponent(n)}`,
  },
  {
    key: "ekart",
    name: "Ekart",
    url: (n) => `https://ekartlogistics.com/shipmenttrack/${encodeURIComponent(n)}`,
  },
  {
    key: "indiapost",
    name: "India Post",
    url: () => "https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx",
  },
  {
    key: "other",
    name: "Other",
    url: () => "",
  },
];

const BY_KEY = new Map(CARRIERS.map((c) => [c.key, c]));

export function carrierName(key: string | null): string | null {
  if (!key) return null;
  return BY_KEY.get(key)?.name ?? key;
}

// Returns a tracking URL for the carrier + number, or null if not linkable.
export function trackingUrl(
  carrier: string | null,
  trackingNumber: string | null,
): string | null {
  if (!carrier || !trackingNumber) return null;
  const entry = BY_KEY.get(carrier);
  if (!entry) return null;
  const url = entry.url(trackingNumber);
  return url || null;
}
