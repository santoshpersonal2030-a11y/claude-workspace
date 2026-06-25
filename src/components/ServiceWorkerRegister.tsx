"use client";

import { useEffect } from "react";

// Registers the service worker in production only (dev has no SW, so HMR and
// route changes aren't intercepted) and keeps it auto-updating: when a new
// version is deployed it activates and the page reloads once, so users see the
// latest build without a manual hard-refresh / cache-clear. Renders nothing.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let refreshing = false;
    // When the controlling worker changes, a new version has taken over.
    // Reload exactly once so the page runs the fresh assets. (This does NOT
    // fire on the very first install, since there's no prior controller.)
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    // Ask a waiting worker to take over. Only meaningful when a worker is
    // already controlling the page (i.e. this is an update, not first load).
    const promote = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting && navigator.serviceWorker.controller) {
        reg.waiting.postMessage("SKIP_WAITING");
      }
    };

    let registration: ServiceWorkerRegistration | undefined;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          registration = reg;
          // A new worker may already be waiting from a prior visit.
          promote(reg);
          // Promote any worker that finishes installing while the tab is open.
          reg.addEventListener("updatefound", () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed") promote(reg);
            });
          });
        })
        .catch(() => {
          /* registration is best-effort */
        });
    };

    // Wait for load so SW registration doesn't compete with first paint.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    // Check for a new deploy when the tab regains focus and on a slow timer,
    // so long-lived tabs and installed PWAs don't get stuck on an old build.
    const checkForUpdate = () => {
      if (registration && document.visibilityState === "visible") {
        registration.update().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", checkForUpdate);
    const interval = window.setInterval(checkForUpdate, 60 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
