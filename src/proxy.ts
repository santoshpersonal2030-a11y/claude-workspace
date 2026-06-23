import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { rateLimit } from "@/lib/rate-limit";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";

// Next.js 16 renamed the `middleware` convention to `proxy`. This runs on every
// matched request to:
//   1. rate-limit the API surface (per-IP),
//   2. route locales — English at clean URLs, other locales under "/<locale>",
//   3. keep the Supabase auth session fresh (rotating cookies).

const RL_LIMIT = 60; // requests…
const RL_WINDOW_MS = 60_000; // …per minute, per IP, per instance
// Server-to-server endpoints that shouldn't be IP-rate-limited.
const RL_EXEMPT = ["/api/razorpay/webhook", "/api/cron/"];

const LOCALE_COOKIE = "bmp_locale";

// Requests that must NOT be locale-rewritten: route handlers at fixed URLs,
// metadata routes, the service worker, and any file with an extension.
function isNonLocalized(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/signout") ||
    pathname.startsWith("/_next") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.webmanifest" ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

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

  if (!isNonLocalized(pathname)) {
    const seg = pathname.split("/")[1];

    if (isLocale(seg)) {
      if (seg === DEFAULT_LOCALE) {
        // Canonicalize: the default locale is unprefixed. Strip "/en".
        const url = new URL(request.url);
        url.pathname = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
        return NextResponse.redirect(url);
      }
      // A non-default locale (e.g. /hi/...) routes to its [locale] segment.
      return updateSession(request);
    }

    // Unprefixed path → default locale, unless the visitor's cookie prefers a
    // non-default language (keeps returning visitors in their chosen locale).
    const preferred = request.cookies.get(LOCALE_COOKIE)?.value;
    if (isLocale(preferred) && preferred !== DEFAULT_LOCALE) {
      const url = new URL(request.url);
      url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
      return NextResponse.redirect(url);
    }

    // Rewrite to the default-locale segment so the [locale] tree matches; the
    // browser URL stays clean.
    const rewriteUrl = new URL(request.url);
    rewriteUrl.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
    return updateSession(request, rewriteUrl);
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
