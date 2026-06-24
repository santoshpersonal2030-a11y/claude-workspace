# Native app wrapper

BookMyPoojari ships as an installable **PWA first**, then wraps that same web app
for the app stores. There is **no separate native codebase** — the wrappers load
the live site, so every web release is instantly an app release.

The single source of truth for app identity (name, colours, icons, shortcuts,
share target) is the web manifest in [`src/app/manifest.ts`](../src/app/manifest.ts),
served at `/manifest.webmanifest`. Change it there and both wrappers pick it up.

> The CLIs below (Bubblewrap, Capacitor, Android Studio, Xcode) run on a
> developer machine — they need the Android SDK / Xcode and are **not** part of
> `npm run build` or CI.

---

## 1. PWA (already live)

- Manifest: `src/app/manifest.ts` — installable, standalone, with app shortcuts
  (Book a Pooja, Talk to an Astrologer, Panchang, Store) and a `share_target`
  that routes shared text/links into `/search`.
- Service worker + offline page: `src/components/ServiceWorkerRegister.tsx`,
  `src/app/[locale]/offline/page.tsx`.
- Install prompt: `src/components/InstallPrompt.tsx`.
- Web push: `src/app/api/push/*`.

Users can already "Add to Home Screen" on Android and iOS. The wrappers below are
only needed for Play Store / App Store distribution.

## 2. Android — Trusted Web Activity (TWA) via Bubblewrap

A TWA is the smallest Play-Store wrapper: a Chrome-backed full-screen shell with
no browser UI. Config: [`twa-manifest.json`](../twa-manifest.json).

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://bookmypoojari.com/manifest.webmanifest
# (or, to reuse the committed config)
bubblewrap build            # produces app-release-signed.apk + .aab
```

**Digital Asset Links** — to remove the URL bar, the site must vouch for the app:

1. Get the app-signing SHA-256 fingerprint (from the upload key, or Play Console →
   App integrity once Play App Signing is on).
2. Paste it into [`public/.well-known/assetlinks.json`](../public/.well-known/assetlinks.json)
   (replace `REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FINGERPRINT`) and deploy.
3. Verify it serves at `https://bookmypoojari.com/.well-known/assetlinks.json`.

Notes
- `signingKey` in `twa-manifest.json` points at `./android-signing.keystore`
  (generate once, **do not commit** it). Add it to the build environment's
  secrets.
- `enableNotifications: true` bridges web push to Android notifications.
- Bump `appVersionCode` / `appVersionName` for each Play release.

## 3. iOS + Android — Capacitor (when native plugins are needed)

Use Capacitor if you outgrow a pure TWA (App Store presence, native plugins,
deeper OS integration). Config: [`capacitor.config.json`](../capacitor.config.json)
— `server.url` points the native shell at the hosted site, so there's still no
forked frontend.

```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios        # build/submit in Xcode
npx cap open android    # build/submit in Android Studio
```

For a fully self-hosted bundle instead of loading the live URL, drop `server.url`
and point `webDir` at a static export.

## App store metadata (both platforms)

- App ID: `com.bookmypoojari.twa` (TWA) / `com.bookmypoojari.app` (Capacitor)
- Category: Lifestyle
- Theme `#d4540a` (saffron), background `#fffaf3` (cream)
- Icons: `public/icon-512.png`, `public/icon-192.png`, `public/icon.svg`

## Release checklist

- [ ] `assetlinks.json` updated with the real signing fingerprint and deployed
- [ ] App version bumped (`twa-manifest.json` and/or native project)
- [ ] Manifest change (if any) shipped to production first
- [ ] Signing keystore / certificates available to the build, never committed
- [ ] Smoke-test deep links: `/poojas`, `/live-astrology`, `/account/*` open in-app
