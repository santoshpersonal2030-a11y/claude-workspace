"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { GA_ID, trackPageView } from "@/lib/analytics";
import { useConsent } from "@/lib/consent";

// SPA page_view on every route change (GA4 config sends none itself —
// send_page_view:false — so we control it here, including query changes).
function PageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    const qs = searchParams?.toString();
    trackPageView(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);
  return null;
}

// Loads gtag.js and wires SPA page views. Dormant unless a GA id is configured,
// we're in production (dev/preview stay clean), AND the user has granted
// consent — so no analytics cookies/requests fire before opt-in.
export default function Analytics() {
  const consent = useConsent();
  if (
    !GA_ID ||
    process.env.NODE_ENV !== "production" ||
    consent !== "granted"
  ) {
    return null;
  }
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false});`}
      </Script>
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}
