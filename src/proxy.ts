import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { rateLimit } from "@/lib/rate-limit";

// Next.js 16 renamed the `middleware` convention to `proxy`. This runs on every
// matched request to keep the Supabase auth session fresh (rotating cookies),
// and applies a lightweight per-IP rate limit to the API surface.

const RL_LIMIT = 60; // requests…
const RL_WINDOW_MS = 60_000; // …per minute, per IP, per instance
// Server-to-server endpoints that shouldn't be IP-rate-limited.
const RL_EXEMPT = ["/api/razorpay/webhook", "/api/cron/"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") &&
    !RL_EXEMPT.some((p) => pathname.startsWith(p))
  ) {
    const ip =
      (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
      "unknown";
    const { ok, retryAfterSec } = rateLimit(
      `api:${ip}`,
      RL_LIMIT,
      RL_WINDOW_MS,
    );
    if (!ok) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
      );
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico and common image assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
