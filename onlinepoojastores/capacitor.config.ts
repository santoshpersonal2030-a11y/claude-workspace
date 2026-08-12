import type { CapacitorConfig } from '@capacitor/cli';

// Capacitor turns the SAME website into real Android and iPhone apps.
// The apps load the live site in a native shell, so every feature stays in
// perfect sync across web, Android and iOS — one codebase, no drift.
//
// IMPORTANT: set `server.url` below to your deployed site once it's live
// (e.g. https://onlinepoojastores.com or your Vercel URL). Until then the
// apps have nothing to load. See BUILD-APPS.md for the full build steps.
const config: CapacitorConfig = {
  appId: 'com.onlinepoojastores.app',
  appName: 'Online Pooja Stores',
  webDir: 'public',
  server: {
    // ▼▼▼ Replace with your real deployed URL ▼▼▼
    url: 'https://onlinepoojastores.com',
    cleartext: false,
  },
  backgroundColor: '#8b3a3a',
};

export default config;
