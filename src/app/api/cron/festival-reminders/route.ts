import { NextResponse } from "next/server";

import { upcomingVrats } from "@/lib/muhurat-engine";
import { broadcastPush } from "@/lib/push";

// One-line suggestion + emoji per observance, so the push nudges toward the
// pooja we'd recommend booking. Names match VRAT_TITHIS in the muhurat engine.
const VRAT_PUSH: Record<string, { emoji: string; suggest: string }> = {
  Ekadashi: { emoji: "🪔", suggest: "Observe the fast and book a Satyanarayan Katha." },
  Purnima: { emoji: "🌕", suggest: "An auspicious day for Satyanarayan Katha." },
  Amavasya: { emoji: "🌑", suggest: "A day for Tarpan and remembering ancestors." },
  "Sankashti Chaturthi": { emoji: "🐘", suggest: "Seek Ganesha's blessings with a Ganesh Puja." },
  "Vinayaka Chaturthi": { emoji: "🐘", suggest: "Begin anew with a Ganesh Puja." },
  "Pradosh Vrat": { emoji: "🕉️", suggest: "An auspicious evening for Rudrabhishek." },
};

// Reminds every push-subscribed user the day before a vrat/festival, so they
// have time to book a pandit. Scheduled via Vercel Cron; guarded by CRON_SECRET.
// A no-op until VAPID keys are configured (broadcastPush is push-gated).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Tomorrow in IST (fixed +05:30) — fire a day's notice.
  const tomorrow = new Date(Date.now() + 5.5 * 3600 * 1000 + 86_400_000)
    .toISOString()
    .slice(0, 10);

  // Window of 2 days from today catches anything landing on `tomorrow`.
  const today = new Date(Date.now() + 5.5 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
  const vrat = upcomingVrats(today, 2).find((v) => v.date === tomorrow);

  if (!vrat) {
    return NextResponse.json({ ok: true, date: tomorrow, festival: null });
  }

  const info = VRAT_PUSH[vrat.name];
  const sent = await broadcastPush({
    title: `${info?.emoji ?? "🗓️"} ${vrat.name} is tomorrow`,
    body: info?.suggest ?? "Plan your observance and book a pandit in advance.",
    url: "/festivals",
    tag: `festival-${vrat.date}`,
  });

  return NextResponse.json({
    ok: true,
    date: tomorrow,
    festival: vrat.name,
    sent,
  });
}
