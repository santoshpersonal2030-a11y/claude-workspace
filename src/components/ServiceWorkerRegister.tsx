"use client";

import { useEffect } from "react";

// Registers the service worker in production only (dev has no SW, so HMR and
// route changes aren't intercepted). Renders nothing.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration is best-effort */
      });
    };
    // Wait for load so SW registration doesn't compete with first paint.
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
