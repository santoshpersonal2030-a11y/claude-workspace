import { NextResponse } from "next/server";

import { getMuhuratAvailability } from "@/lib/muhurat-data";

// Public: per-window priest availability for a pincode, so the muhurat calendar
// can flag which approved dates have a free, in-area priest. Non-sensitive
// (counts only); the page itself stays statically cached.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = (searchParams.get("pincode") ?? "").trim();
  const availability = await getMuhuratAvailability(pincode);
  return NextResponse.json(
    { availability },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
