"use client";

import { useEffect, useState } from "react";

import { useT } from "@/components/LanguageProvider";

const DISMISS_KEY = "bmp_install_dismissed_v1";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// A lightweight "Install app" banner driven by the browser's
// beforeinstallprompt event. Shows once (until dismissed), and not at all when
// the app is already installed (display-mode: standalone) or on browsers that
// don't fire the event (e.g. iOS Safari).
export default function InstallPrompt() {
  const t = useT();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      localStorage.getItem(DISMISS_KEY) === "1" ||
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDeferred(null);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  if (!deferred) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-md rounded-2xl border border-saffron-200 bg-white p-4 shadow-lg sm:inset-x-auto sm:right-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-saffron-600 text-xl">
          🪔
        </span>
        <p className="flex-1 text-sm text-foreground/80">{t("install.text")}</p>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full px-4 py-1.5 text-sm text-foreground/60 hover:text-foreground"
        >
          {t("install.dismiss")}
        </button>
        <button
          type="button"
          onClick={install}
          className="rounded-full bg-saffron-700 px-5 py-1.5 text-sm font-semibold text-white hover:bg-saffron-800"
        >
          {t("install.cta")}
        </button>
      </div>
    </div>
  );
}
