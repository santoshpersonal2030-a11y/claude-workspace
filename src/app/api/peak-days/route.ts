import { NextResponse } from "next/server";

import { upcomingPeakDays } from "@/lib/peak-days";

// Public: upcoming peak days so the booking form can preview the premium for a
// chosen date. The authoritative charge is still computed server-side at
// booking time — this is display-only.
export async function GET() {
  const days = await upcomingPeakDays();
  return NextResponse.json(
    { peakDays: days },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
