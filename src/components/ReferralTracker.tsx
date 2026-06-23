"use client";

import { useEffect } from "react";

import { normalizeReferralCode } from "@/lib/referral-code";

const REF_COOKIE = "bmp_ref";

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

// Captures a `?ref=CODE` referral into a cookie and tries to attribute it.
// The claim endpoint is a no-op until the visitor signs in, so the cookie
// persists across the login round-trip. Mounted once in the root layout.
export default function ReferralTracker() {
  useEffect(() => {
    const ref = normalizeReferralCode(
      new URLSearchParams(window.location.search).get("ref") ?? "",
    );
    if (ref) {
      document.cookie = `${REF_COOKIE}=${ref}; path=/; max-age=2592000; samesite=lax`;
    }
    if (!ref && !readCookie(REF_COOKIE)) return;

    fetch("/api/referral/claim", { method: "POST" })
      .then((r) => r.json())
      .then((d: { claimed?: boolean; ineligible?: boolean }) => {
        // Drop the cookie once resolved (kept only while still signed out).
        if (d.claimed || d.ineligible) {
          document.cookie = `${REF_COOKIE}=; path=/; max-age=0`;
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
