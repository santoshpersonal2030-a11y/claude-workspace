'use client';

import { useEffect } from 'react';

// Registers the service worker so the site can be installed as an app.
export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration is best-effort; the site works fine without it.
      });
    }
  }, []);
  return null;
}
