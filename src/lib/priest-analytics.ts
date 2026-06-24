// Pure priest-performance analytics derived from the booking_priest_events
// audit log. Acceptance rate and response time are computed by pairing each
// "assigned" event with the same priest's next response on that booking
// (accept / decline / propose), which also survives reassignment cycles.
// Dependency-free so it can be unit-tested.

export type PriestEvent = {
  panditId: string | null;
  bookingId: string;
  action: "assigned" | "accepted" | "declined" | "proposed";
  createdAt: string; // ISO timestamp
};

export type PriestStats = {
  panditId: string;
  assigned: number;
  accepted: number;
  declined: number;
  proposed: number;
  responded: number; // accepted + declined + proposed
  pending: number; // assigned but never responded
  acceptanceRate: number | null; // accepted / responded, null if no responses
  responseCount: number; // assignments that got a timed response
  avgResponseMins: number | null;
  medianResponseMins: number | null;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const RESPONSES = new Set(["accepted", "declined", "proposed"]);

// Aggregates raw events into per-priest stats, keyed and sorted by assignment
// volume (busiest first). Events for unknown/null priests are ignored.
export function aggregatePriestStats(events: PriestEvent[]): PriestStats[] {
  // Group by priest, then by booking, preserving chronological order.
  const byPriest = new Map<string, PriestEvent[]>();
  for (const e of events) {
    if (!e.panditId) continue;
    const list = byPriest.get(e.panditId) ?? [];
    list.push(e);
    byPriest.set(e.panditId, list);
  }

  const out: PriestStats[] = [];
  for (const [panditId, evs] of byPriest) {
    const sorted = [...evs].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    );
    let assigned = 0,
      accepted = 0,
      declined = 0,
      proposed = 0;
    const responseMins: number[] = [];

    // Track the open (unanswered) assignment time per booking.
    const openAssign = new Map<string, number>();
    let matchedAssignments = 0;

    for (const e of sorted) {
      if (e.action === "assigned") {
        assigned++;
        openAssign.set(e.bookingId, Date.parse(e.createdAt));
      } else if (RESPONSES.has(e.action)) {
        if (e.action === "accepted") accepted++;
        else if (e.action === "declined") declined++;
        else proposed++;
        const t0 = openAssign.get(e.bookingId);
        if (t0 !== undefined) {
          responseMins.push((Date.parse(e.createdAt) - t0) / 60000);
          openAssign.delete(e.bookingId);
          matchedAssignments++;
        }
      }
    }

    const responded = accepted + declined + proposed;
    const avg =
      responseMins.length === 0
        ? null
        : responseMins.reduce((s, x) => s + x, 0) / responseMins.length;

    out.push({
      panditId,
      assigned,
      accepted,
      declined,
      proposed,
      responded,
      pending: Math.max(0, assigned - matchedAssignments),
      acceptanceRate: responded === 0 ? null : accepted / responded,
      responseCount: responseMins.length,
      avgResponseMins: avg === null ? null : Math.round(avg),
      medianResponseMins: (() => {
        const m = median(responseMins);
        return m === null ? null : Math.round(m);
      })(),
    });
  }

  return out.sort((a, b) => b.assigned - a.assigned);
}

export type PriestTotals = {
  priests: number;
  assigned: number;
  accepted: number;
  declined: number;
  proposed: number;
  acceptanceRate: number | null;
  avgResponseMins: number | null;
};

// Roll up per-priest stats into a programme-wide summary.
export function overallTotals(stats: PriestStats[]): PriestTotals {
  const assigned = stats.reduce((s, x) => s + x.assigned, 0);
  const accepted = stats.reduce((s, x) => s + x.accepted, 0);
  const declined = stats.reduce((s, x) => s + x.declined, 0);
  const proposed = stats.reduce((s, x) => s + x.proposed, 0);
  const responded = accepted + declined + proposed;
  // Volume-weighted average response time across priests that have one.
  let weighted = 0,
    weight = 0;
  for (const s of stats) {
    if (s.avgResponseMins !== null && s.responseCount > 0) {
      weighted += s.avgResponseMins * s.responseCount;
      weight += s.responseCount;
    }
  }
  return {
    priests: stats.length,
    assigned,
    accepted,
    declined,
    proposed,
    acceptanceRate: responded === 0 ? null : accepted / responded,
    avgResponseMins: weight === 0 ? null : Math.round(weighted / weight),
  };
}
