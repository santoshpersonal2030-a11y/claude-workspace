"use client";

import { useEffect, useState } from "react";

import { useT } from "@/components/LanguageProvider";

// VAPID public key → the Uint8Array applicationServerKey the Push API expects.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Status = "loading" | "unsupported" | "off" | "on" | "blocked";

// Lets a signed-in user opt this device in/out of web-push. Renders nothing
// when push isn't configured (no VAPID key) or the browser can't support it.
export default function PushToggle() {
  const t = useT();
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Detect support + current subscription off the render path (no synchronous
    // setState in the effect body).
    Promise.resolve().then(async () => {
      if (cancelled) return;
      const supported =
        !!vapid &&
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      if (!supported) return setStatus("unsupported");
      if (Notification.permission === "denied") return setStatus("blocked");
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setStatus(sub ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vapid]);

  async function enable() {
    if (!vapid) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setStatus(res.ok ? "on" : "off");
    } catch {
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      /* best-effort */
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading" || status === "unsupported") return null;

  return (
    <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
      <h2 className="font-heading text-lg text-maroon-700">{t("push.title")}</h2>
      <p className="mt-1 text-sm text-foreground/65">{t("push.desc")}</p>
      <div className="mt-3" aria-live="polite">
        {status === "blocked" ? (
          <p className="text-sm text-maroon-600">{t("push.blocked")}</p>
        ) : status === "on" ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-emerald-700">
              ✓ {t("push.enabled")}
            </span>
            <button
              type="button"
              onClick={disable}
              disabled={busy}
              className="rounded-full border border-stone-200 px-4 py-1.5 text-sm text-foreground/65 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
            >
              {busy ? t("push.busy") : t("push.disable")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className="rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-50"
          >
            {busy ? t("push.busy") : t("push.enable")}
          </button>
        )}
      </div>
    </div>
  );
}
