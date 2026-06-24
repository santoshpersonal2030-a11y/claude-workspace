// Scheduling engine for priest availability & throughput.
//
// Pure and dependency-free so it runs on server or client and is easy to unit
// test. All times within a day are modelled as "minutes from midnight" to stay
// timezone-safe (a single calendar day, in the priest's local time).
//
// Design goals:
//  - Maximise how many poojas a priest can do on a busy/auspicious day (more
//    bookings = more income) by using the *minimum safe* gap between jobs —
//    never a wasteful fixed block.
//  - Never make a priest late: the spacing between two jobs always covers the
//    earlier ceremony's duration + travel between locations + a delay buffer.
//  - Muhurat ceremonies anchor the day (fixed windows); flexible poojas fill
//    the time around them via slot generation.

// Tunables (minutes). Adjust here to trade throughput vs safety margin.
export const DELAY_BUFFER_MIN = 30; // absorbs ceremony overruns / traffic
export const SAME_PINCODE_TRAVEL_MIN = 15; // quick hop within a pincode
export const DEFAULT_SLOT_STEP_MIN = 30; // slot generation granularity

export type DayJob = {
  /** Start time, minutes from local midnight. */
  startMin: number;
  /** Ceremony length in minutes. */
  durationMin: number;
  /** Location pincode (for travel estimation). */
  pincode: string | null;
};

/** "HH:MM" → minutes from midnight. */
export function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** minutes from midnight → "HH:MM" (24h, zero-padded). */
export function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Manual travel-time proxy (v1). Same pincode is a quick hop; a different
 * pincode uses the priest's declared max travel time as a safe upper bound.
 * A geo/Maps distance matrix can replace this later without touching callers.
 */
export function travelMinutes(
  fromPincode: string | null,
  toPincode: string | null,
  maxTravelMins: number,
): number {
  if (fromPincode && toPincode && fromPincode === toPincode) {
    return SAME_PINCODE_TRAVEL_MIN;
  }
  return maxTravelMins;
}

/**
 * Can a priest serve both jobs without being late? They must not overlap and
 * must leave enough time to travel between locations plus a delay buffer.
 */
export function jobsCompatible(
  a: DayJob,
  b: DayJob,
  maxTravelMins: number,
  delayBufferMin: number = DELAY_BUFFER_MIN,
): boolean {
  const earlier = a.startMin <= b.startMin ? a : b;
  const later = a.startMin <= b.startMin ? b : a;
  const travel = travelMinutes(earlier.pincode, later.pincode, maxTravelMins);
  const gap = later.startMin - (earlier.startMin + earlier.durationMin);
  return gap >= travel + delayBufferMin;
}

/** True when the candidate job can be slotted alongside every existing job. */
export function fitsSchedule(
  candidate: DayJob,
  existing: DayJob[],
  maxTravelMins: number,
  delayBufferMin: number = DELAY_BUFFER_MIN,
): boolean {
  return existing.every((job) =>
    jobsCompatible(candidate, job, maxTravelMins, delayBufferMin),
  );
}

export type SlotQuery = {
  /** Priest working window, "HH:MM". */
  workStart: string;
  workEnd: string;
  /** Duration of the pooja being booked, in minutes. */
  durationMin: number;
  /** Customer location for the new booking. */
  pincode: string | null;
  /** The priest's already-booked jobs for the day. */
  existing: DayJob[];
  /** Priest's max travel minutes (cross-pincode upper bound). */
  maxTravelMins: number;
  stepMin?: number;
  delayBufferMin?: number;
};

/**
 * Generates the bookable start times (as "HH:MM") for a pooja on a given day,
 * walking the working window at `stepMin` granularity and keeping only the
 * candidates that fit around the priest's existing jobs with safe gaps.
 */
export function availableStartTimes(q: SlotQuery): string[] {
  const ws = parseHHMM(q.workStart);
  const we = parseHHMM(q.workEnd);
  const step = q.stepMin ?? DEFAULT_SLOT_STEP_MIN;
  const buffer = q.delayBufferMin ?? DELAY_BUFFER_MIN;
  const out: string[] = [];

  for (let t = ws; t + q.durationMin <= we; t += step) {
    const candidate: DayJob = {
      startMin: t,
      durationMin: q.durationMin,
      pincode: q.pincode,
    };
    if (fitsSchedule(candidate, q.existing, q.maxTravelMins, buffer)) {
      out.push(toHHMM(t));
    }
  }
  return out;
}

/** Whether the priest is fully unavailable on a date (leave/blackout). */
export function isBlackedOut(date: string, blackoutDates: string[]): boolean {
  return blackoutDates.includes(date);
}
