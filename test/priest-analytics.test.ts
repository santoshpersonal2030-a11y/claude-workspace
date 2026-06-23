import { test } from "node:test";
import assert from "node:assert/strict";

import {
  aggregatePriestStats,
  overallTotals,
  type PriestEvent,
} from "../src/lib/priest-analytics.ts";

const t = (min: number) =>
  new Date(Date.UTC(2026, 0, 1, 10, min, 0)).toISOString();

test("pairs assignments with the next response and times them", () => {
  const events: PriestEvent[] = [
    { panditId: "p1", bookingId: "b1", action: "assigned", createdAt: t(0) },
    { panditId: "p1", bookingId: "b1", action: "accepted", createdAt: t(10) },
    { panditId: "p1", bookingId: "b2", action: "assigned", createdAt: t(0) },
    { panditId: "p1", bookingId: "b2", action: "declined", createdAt: t(30) },
    // assigned but never answered
    { panditId: "p1", bookingId: "b3", action: "assigned", createdAt: t(5) },
  ];
  const [s] = aggregatePriestStats(events);
  assert.equal(s.panditId, "p1");
  assert.equal(s.assigned, 3);
  assert.equal(s.accepted, 1);
  assert.equal(s.declined, 1);
  assert.equal(s.responded, 2);
  assert.equal(s.pending, 1);
  assert.equal(s.acceptanceRate, 0.5);
  assert.equal(s.responseCount, 2);
  assert.equal(s.avgResponseMins, 20); // (10 + 30) / 2
  assert.equal(s.medianResponseMins, 20);
});

test("handles reassignment cycles on the same booking", () => {
  const events: PriestEvent[] = [
    { panditId: "p1", bookingId: "b1", action: "assigned", createdAt: t(0) },
    { panditId: "p1", bookingId: "b1", action: "declined", createdAt: t(15) },
    { panditId: "p1", bookingId: "b1", action: "assigned", createdAt: t(60) },
    { panditId: "p1", bookingId: "b1", action: "accepted", createdAt: t(70) },
  ];
  const [s] = aggregatePriestStats(events);
  assert.equal(s.assigned, 2);
  assert.equal(s.responseCount, 2);
  assert.equal(s.pending, 0);
  assert.equal(s.avgResponseMins, 13); // (15 + 10) / 2 = 12.5 → 13
});

test("a priest with no responses has a null acceptance rate", () => {
  const events: PriestEvent[] = [
    { panditId: "p2", bookingId: "b9", action: "assigned", createdAt: t(0) },
  ];
  const [s] = aggregatePriestStats(events);
  assert.equal(s.acceptanceRate, null);
  assert.equal(s.avgResponseMins, null);
  assert.equal(s.medianResponseMins, null);
  assert.equal(s.pending, 1);
});

test("events for null priests are ignored; busiest priest sorts first", () => {
  const events: PriestEvent[] = [
    { panditId: null, bookingId: "b1", action: "assigned", createdAt: t(0) },
    { panditId: "p1", bookingId: "b1", action: "assigned", createdAt: t(0) },
    { panditId: "p2", bookingId: "b2", action: "assigned", createdAt: t(0) },
    { panditId: "p2", bookingId: "b3", action: "assigned", createdAt: t(0) },
  ];
  const stats = aggregatePriestStats(events);
  assert.equal(stats.length, 2);
  assert.equal(stats[0].panditId, "p2"); // 2 assignments
});

test("overallTotals weights response time by volume", () => {
  const events: PriestEvent[] = [
    { panditId: "p1", bookingId: "b1", action: "assigned", createdAt: t(0) },
    { panditId: "p1", bookingId: "b1", action: "accepted", createdAt: t(10) },
    { panditId: "p2", bookingId: "b2", action: "assigned", createdAt: t(0) },
    { panditId: "p2", bookingId: "b2", action: "declined", createdAt: t(40) },
  ];
  const totals = overallTotals(aggregatePriestStats(events));
  assert.equal(totals.priests, 2);
  assert.equal(totals.assigned, 2);
  assert.equal(totals.acceptanceRate, 0.5);
  assert.equal(totals.avgResponseMins, 25); // (10 + 40) / 2
});
