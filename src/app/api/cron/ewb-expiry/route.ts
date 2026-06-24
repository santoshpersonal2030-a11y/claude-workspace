import { NextResponse } from "next/server";

import { sendEwbExpiryAlerts } from "@/lib/notifications";

// Emails the admin about e-way bills whose validity is about to lapse, so they
// can extend Part-B or complete delivery in time. Intended to run hourly via
// Vercel Cron; guarded by CRON_SECRET when set.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const alerted = await sendEwbExpiryAlerts();
  return NextResponse.json({ ok: true, alerted });
}
