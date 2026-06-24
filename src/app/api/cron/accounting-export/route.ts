import { NextResponse } from "next/server";

import { buildOrdersCsv, buildBookingsCsv } from "@/lib/exports";
import { sendAccountingExport } from "@/lib/notifications";

// Emails the last 7 days of orders & bookings as CSV to the accounting address.
// Scheduled via Vercel Cron; guarded by CRON_SECRET when set.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 7);
  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);

  const [ordersCsv, bookingsCsv] = await Promise.all([
    buildOrdersCsv(fromStr, toStr),
    buildBookingsCsv(fromStr, toStr),
  ]);

  await sendAccountingExport(`${fromStr} to ${toStr}`, [
    { filename: `orders-${fromStr}_${toStr}.csv`, csv: ordersCsv },
    { filename: `bookings-${fromStr}_${toStr}.csv`, csv: bookingsCsv },
  ]);

  return NextResponse.json({ ok: true, period: `${fromStr}..${toStr}` });
}
