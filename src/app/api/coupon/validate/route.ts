import { NextResponse } from "next/server";

import { validateCoupon } from "@/lib/coupons";

// Previews a coupon for the cart. The authoritative discount is re-computed at
// checkout, so this is only a UX convenience.
export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string; subtotal?: number };
  const result = await validateCoupon(
    body.code ?? "",
    Math.max(0, Math.floor(body.subtotal ?? 0)),
  );
  return NextResponse.json(result);
}
