// Pure sales analytics: monthly revenue trend, conversion funnels and simple
// derived rates. Dependency-free for unit testing; callers pass already-fetched
// rows.

export type DatedAmount = { createdAt: string; amount: number };

const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM

// Revenue per calendar month for the store and bookings, merged and sorted
// ascending. Months with no revenue on one side still appear if the other side
// has revenue.
export function monthlyRevenue(
  store: DatedAmount[],
  booking: DatedAmount[],
): { month: string; store: number; booking: number; total: number }[] {
  const map = new Map<string, { store: number; booking: number }>();
  const add = (rows: DatedAmount[], key: "store" | "booking") => {
    for (const r of rows) {
      const m = monthKey(r.createdAt);
      const e = map.get(m) ?? { store: 0, booking: 0 };
      e[key] += r.amount;
      map.set(m, e);
    }
  };
  add(store, "store");
  add(booking, "booking");
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({
      month,
      store: v.store,
      booking: v.booking,
      total: v.store + v.booking,
    }));
}

export type FunnelStage = { label: string; count: number; pct: number };

// Builds a funnel where each stage's pct is relative to the first (top) stage.
export function funnel(
  stages: { label: string; count: number }[],
): FunnelStage[] {
  const top = stages[0]?.count ?? 0;
  return stages.map((s) => ({
    ...s,
    pct: top === 0 ? 0 : Math.round((s.count / top) * 100),
  }));
}

// Conversion rate of a denominator → numerator as a 0..1 ratio (null if no
// denominator).
export function rate(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

// Average value (rounded) across paid rows.
export function averageValue(rows: DatedAmount[]): number {
  if (rows.length === 0) return 0;
  return Math.round(rows.reduce((s, r) => s + r.amount, 0) / rows.length);
}

// Tallies a list of status strings into a count per status.
export function countByStatus(statuses: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of statuses) out[s] = (out[s] ?? 0) + 1;
  return out;
}
