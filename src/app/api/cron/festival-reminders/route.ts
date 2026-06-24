import { NextResponse } from "next/server";

import { upcomingVrats } from "@/lib/muhurat-engine";
import {
  upcomingFestivals,
  FESTIVAL_INFO,
  FESTIVALS_THROUGH,
} from "@/lib/festivals";
import { broadcastPush } from "@/lib/push";

// One-line suggestion + emoji per recurring monthly observance (tithi-based),
// so the day-before push nudges toward the pooja we'd recommend booking.
const VRAT_PUSH: Record<string, { emoji: string; suggest: string }> = {
  Ekadashi: { emoji: "🪔", suggest: "Observe the fast and book a Satyanarayan Katha." },
  Purnima: { emoji: "🌕", suggest: "An auspicious day for Satyanarayan Katha." },
  Amavasya: { emoji: "🌑", suggest: "A day for Tarpan and remembering ancestors." },
  "Sankashti Chaturthi": { emoji: "🐘", suggest: "Seek Ganesha's blessings with a Ganesh Puja." },
  "Vinayaka Chaturthi": { emoji: "🐘", suggest: "Begin anew with a Ganesh Puja." },
  "Pradosh Vrat": { emoji: "🕉️", suggest: "An auspicious evening for Rudrabhishek." },
};

const FESTIVAL_LEAD_DAYS = 3; // give time to book a pandit

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function istDateOffset(days: number): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000 + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

function labelOf(dateISO: string): string {
  const dt = new Date(`${dateISO}T00:00:00Z`);
  return `${WD[dt.getUTCDay()]}, ${dt.getUTCDate()} ${MO[dt.getUTCMonth()]}`;
}

// Two reminder streams to every push-subscribed user (best-effort, push-gated —
// a no-op until VAPID keys are configured), scheduled via Vercel Cron and
// guarded by CRON_SECRET:
//   1. Major festivals, FESTIVAL_LEAD_DAYS ahead, deep-linked to the pooja.
//   2. Recurring monthly vrats, the day before, linked to /festivals.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = istDateOffset(0);
  const results: Array<{ kind: string; name: string; date: string; sent: number }> = [];

  // 1. Festivals at the lead date.
  const festDate = istDateOffset(FESTIVAL_LEAD_DAYS);
  for (const f of upcomingFestivals(festDate, 1)) {
    const info = FESTIVAL_INFO[f.name];
    const sent = await broadcastPush({
      title: `${info?.emoji ?? "🗓️"} ${f.name} — ${labelOf(f.date)}`,
      body: info?.push ?? "Book your pandit in advance.",
      url: `/poojas/${f.slug}`,
      tag: `festival-${f.date}`,
    });
    results.push({ kind: "festival", name: f.name, date: f.date, sent });
  }

  // 2. Recurring monthly observance tomorrow.
  const tomorrow = istDateOffset(1);
  const vrat = upcomingVrats(today, 2).find((v) => v.date === tomorrow);
  if (vrat) {
    const info = VRAT_PUSH[vrat.name];
    const sent = await broadcastPush({
      title: `${info?.emoji ?? "🗓️"} ${vrat.name} is tomorrow`,
      body: info?.suggest ?? "Plan your observance and book a pandit in advance.",
      url: "/festivals",
      tag: `vrat-${vrat.date}`,
    });
    results.push({ kind: "vrat", name: vrat.name, date: vrat.date, sent });
  }

  // Warn (in the cron response / logs) once the curated table runs dry so it
  // gets refreshed before festival reminders silently stop.
  const stale = today > FESTIVALS_THROUGH;
  if (stale) {
    console.warn(
      `festival-reminders: curated table ends ${FESTIVALS_THROUGH}; add more years to src/lib/festivals.ts`,
    );
  }

  return NextResponse.json({ ok: true, today, results, tableEndsAfter: FESTIVALS_THROUGH, stale });
}
