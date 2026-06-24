"use client";

import { useSyncExternalStore } from "react";

// Cookie/analytics consent, persisted in localStorage. `null` = not yet chosen
// (the banner is showing). Analytics only loads once this is "granted", so no
// tracking cookies or requests happen before the user opts in.

export type Consent = "granted" | "denied";

const KEY = "bmp_consent_v1";
const listeners = new Set<() => void>();
let cache: Consent | null | undefined;

function read(): Consent | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "granted" || v === "denied" ? v : null;
}

function getSnapshot(): Consent | null {
  if (cache === undefined) cache = read();
  return cache;
}

function getServerSnapshot(): Consent | null {
  return null;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setConsent(value: Consent): void {
  cache = value;
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // storage may be unavailable; in-memory state still updates
  }
  listeners.forEach((l) => l());
}

export function useConsent(): Consent | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
