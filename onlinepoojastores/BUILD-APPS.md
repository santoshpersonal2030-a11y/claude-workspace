# Getting Online Pooja Stores onto phones

You have **three** ways customers can use the store — all from this one
codebase, so every feature stays identical:

| Way | What the customer does | Effort for you |
| --- | --- | --- |
| **1. Mobile website** | Opens the site in any phone browser | Already done ✅ |
| **2. Installable app (PWA)** | "Add to Home Screen" → app icon, full-screen | Already done ✅ |
| **3. Store apps** | Installs from Google Play / Apple App Store | Steps below |

Ways 1 and 2 work the moment your site is deployed — no app stores, no fees.
Most small stores start here. Way 3 (real store listings) uses **Capacitor**,
which wraps this same website as native Android and iOS apps.

---

## Way 2 is automatic

Once the site is live on HTTPS (Vercel gives you this):

- **Android (Chrome):** visitors get an "Install app" prompt, or Menu → *Add to
  Home screen*. It opens full-screen with the diya icon.
- **iPhone (Safari):** Share → *Add to Home Screen*.

Nothing else to do — the manifest, icon, and service worker are already built in.

---

## Way 3 — real Play Store & App Store apps (Capacitor)

The apps load your live site inside a native shell, so they always match the
website. You do this on your own computer (it needs developer tools that can't
run in the cloud), but it's a one-time setup.

### Before you start
- Deploy the website first, then open `capacitor.config.ts` and set
  `server.url` to your real address (e.g. `https://onlinepoojastores.com`).
- Install [Node.js](https://nodejs.org).

### Android (needs Android Studio — Windows/Mac/Linux)
```bash
cd onlinepoojastores
npm install
npx cap add android      # creates the android/ project (one time)
npx cap sync android
npx cap open android     # opens Android Studio → Build → Generate Signed Bundle
```
Upload the resulting `.aab` to the [Google Play Console](https://play.google.com/console)
(one-time US$25 developer account).

### iPhone (needs a Mac with Xcode)
```bash
cd onlinepoojastores
npm install
npx cap add ios          # creates the ios/ project (one time)
npx cap sync ios
npx cap open ios         # opens Xcode → set your Team → Archive → Distribute
```
Submit through [App Store Connect](https://appstoreconnect.apple.com)
(Apple Developer Program, US$99/year).

### When you change the site later
Because the apps load your live URL, **most updates need no new app release** —
you just redeploy the website. Only re-submit an app if you change the icon,
name, or add native features (like push notifications).

---

## Recommended path
1. **Deploy the website** (see `README.md`). Done → you instantly have the
   mobile site *and* the installable app.
2. Share the link; let customers "Add to Home Screen".
3. When you're ready for store listings, do the Capacitor steps above
   (Android first — it's cheaper and simpler than iOS).
