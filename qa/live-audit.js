#!/usr/bin/env node
/* BookMyPoojari — LIVE AUDIT of the pages nothing else can see.
 *
 *   npm run build
 *   npm start                 (in another terminal)
 *   node qa/live-audit.js     [baseUrl]      default http://localhost:3000
 *
 * WHY THIS EXISTS
 * qa/a11y-audit.js and qa/i18n-audit.js both read .next/server/app, which holds only PRERENDERED
 * html. 65 of the 98 page routes are server-rendered on demand and leave no file there, so they
 * were checked by nothing at all — the entire account area, admin console, priest portal,
 * checkout, search, panchang, gun-milan, and /muhurat/find.
 *
 * Both audits nonetheless printed a confident "0 instances" and "181 pages scanned". That is the
 * dangerous shape: silent about two thirds of the site while sounding definitive. This closes it.
 *
 * It uses the SAME accessibility rules, imported from qa/a11y-rules.js rather than copied, so the
 * two reports cannot drift apart and disagree.
 *
 * WHAT IT STILL CANNOT DO, stated rather than glossed:
 *   - It is NOT logged in. Account, admin and priest pages answer with a redirect to the login
 *     screen, so their real content is still unaudited. Those are counted and named at the end
 *     rather than quietly folded into the "scanned" number — an unauditable page must not look
 *     like a clean one.
 *   - Contrast, focus order, reflow and anything behind a click: unchanged, still out of reach.
 *
 * Exit code is always 0 — this is a report. qa/checks.js is the gate.
 */

"use strict";

const { auditHtml, report, makeCollector } = require("./a11y-rules.js");
const { visibleText, isUntranslated, classify } = require("./i18n-rules.js");

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");

/* Public routes that are server-rendered on demand. Concrete URLs, because a route pattern like
   /blog/[slug] cannot be fetched. Kept explicit so adding a page to the site and forgetting to
   add it here is a visible omission rather than a silent one — the summary prints the count. */
const PUBLIC_DYNAMIC = [
  "/muhurat/find",
  "/muhurat/find?ceremony=griha-pravesh&city=Hyderabad&months=12",
  "/search",
  "/search?q=diwali",
  "/panchang",
  "/choghadiya",
  "/gun-milan",
  "/calendar",
  "/store",
  "/store?category=Puja+Kits&sort=price",
  // A real astrologer slug from the seed roster. The first version of this list used an invented
  // one and 404'd — the run reported it rather than skipping it, which is the behaviour wanted.
  "/live-astrology/pandit-rajesh-sharma",
];

/* Routes behind a login. Fetched anyway, to prove they really do redirect rather than leak — a
   page that returns 200 to a stranger is a finding in itself. */
const AUTH_GATED = [
  "/account/profile",
  "/account/orders",
  "/account/bookings",
  "/account/wallet",
  "/account/wishlist",
  "/admin",
  "/admin/orders/1",
  "/admin/products",
  "/admin/settings",
  "/priest",
  "/priest/calendar",
  "/priest/payslips",
];

const LOCALES = ["", "/hi", "/te"];

async function fetchPage(url) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    const status = res.status;
    const location = res.headers.get("location");
    const html = status >= 200 && status < 300 ? await res.text() : "";
    return { ok: true, status, location, html };
  } catch (err) {
    return { ok: false, status: 0, location: null, html: "", error: String(err) };
  }
}

(async () => {
  // Fail loudly rather than report a clean run against a server that is not there.
  const probe = await fetchPage(`${BASE}/`);
  if (!probe.ok) {
    console.error(`Could not reach ${BASE} — start the server first:\n`);
    console.error("    npm run build && npm start\n");
    console.error(probe.error);
    process.exit(1);
  }

  const { findings, add } = makeCollector();
  let scanned = 0;
  const placeholderLeaks = new Map();
  const i18nLeaks = new Map(); // kind -> Map(phrase -> count)
  const englishByRoute = new Map();
  const unreachable = [];
  const gated = [];
  const leaked = [];

  // ── public dynamic pages: full accessibility + i18n ────────────────────────
  for (const route of PUBLIC_DYNAMIC) {
    const byLocale = {};
    for (const loc of LOCALES) {
      const url = `${BASE}${loc}${route}`;
      const r = await fetchPage(url);
      if (!r.ok || r.status !== 200) {
        unreachable.push(`${loc || "/en"}${route} → ${r.status || r.error}`);
        continue;
      }
      const label = `${loc || ""}${route}`;
      auditHtml(r.html, label, add);
      scanned++;
      byLocale[loc || "en"] = r.html;

      // A {placeholder} that reached the screen — the {amount} class of bug.
      const body = r.html.slice(r.html.indexOf("<body")).replace(/<script[\s\S]*?<\/script>/gi, " ");
      for (const p of new Set(body.replace(/<[^>]+>/g, "\n").match(/\{[a-z][a-zA-Z0-9_]*\}/g) || [])) {
        placeholderLeaks.set(p, (placeholderLeaks.get(p) || 0) + 1);
      }
    }

    // i18n: text identical in English and Hindi/Telugu, in Latin script, is untranslated.
    const en = byLocale.en ? visibleText(byLocale.en) : null;
    if (!en) continue;
    for (const loc of ["/hi", "/te"]) {
      if (!byLocale[loc]) continue;
      for (const s of visibleText(byLocale[loc])) {
        if (!isUntranslated(s, en)) continue;
        const kind = classify(s, [], { shapeFallback: true });
        if (!i18nLeaks.has(kind)) i18nLeaks.set(kind, new Map());
        const bucket = i18nLeaks.get(kind);
        bucket.set(s, (bucket.get(s) || 0) + 1);
        if (!englishByRoute.has(route)) englishByRoute.set(route, new Map());
        const r = englishByRoute.get(route);
        r.set(kind, (r.get(kind) || 0) + 1);
      }
    }
  }

  // ── auth-gated pages: confirm they redirect rather than leak ───────────────
  for (const route of AUTH_GATED) {
    const r = await fetchPage(`${BASE}${route}`);
    if (!r.ok) {
      unreachable.push(`${route} → ${r.error}`);
      continue;
    }
    if (r.status === 200) {
      // A stranger got a page. Audit it AND flag it.
      leaked.push(route);
      auditHtml(r.html, route, add);
      scanned++;
    } else {
      gated.push(`${route} → ${r.status}${r.location ? ` ${r.location}` : ""}`);
    }
  }

  // ── report ────────────────────────────────────────────────────────────────
  report(
    findings,
    scanned,
    "BookMyPoojari — LIVE AUDIT (server-rendered pages)",
    "  These are the routes the prerendered audits cannot see. See the coverage note below.",
  );

  console.log("\n" + "=".repeat(78));
  console.log("PLACEHOLDERS AND UNTRANSLATED TEXT ON DYNAMIC PAGES");
  console.log("=".repeat(78));

  console.log(
    `\n  {placeholder} leaks : ${placeholderLeaks.size}` +
      (placeholderLeaks.size
        ? "  " + [...placeholderLeaks.entries()].map(([k, n]) => `${k}×${n}`).join(", ")
        : ""),
  );

  /* Classified, not a flat list. A bare count of 187 is a number without an action attached;
     the prerendered audit has sorted its findings into three buckets since it was written and
     this one now uses the SAME classifier from qa/i18n-rules.js.
     ⚠️ With one difference, stated because it matters: this tool reads a running server and
     cannot know which source file wrote a phrase, so it classifies on shape alone. That is
     coarser than the prerendered audit's file-based answer — treat DATA/CHROME here as a
     strong hint, not a verdict. */
  const kindTotal = (k) => (i18nLeaks.get(k) ? i18nLeaks.get(k).size : 0);
  console.log(
    `\n  ${kindTotal("CHROME")}  interface text   — a developer typed English into the UI` +
      `\n  ${kindTotal("DATA")}  catalog content  — city, pandit and product names` +
      `\n  ${kindTotal("FORMAT")}  times and dates  — the same date-formatting job` +
      `\n       (classified by shape — this tool cannot see which file wrote a phrase)`,
  );

  console.log("\n  by route:");
  const routeTotal = (m) => [...m.values()].reduce((a, b) => a + b, 0);
  for (const [route, kinds] of [...englishByRoute.entries()].sort(
    (a, b) => routeTotal(b[1]) - routeTotal(a[1]),
  )) {
    const parts = [...kinds.entries()].map(([k, n]) => `${k.toLowerCase()} ${n}`).join(", ");
    console.log(`      ${String(routeTotal(kinds)).padStart(4)}  ${route}   (${parts})`);
  }

  for (const kind of ["CHROME", "DATA", "FORMAT"]) {
    const m = i18nLeaks.get(kind);
    if (!m || !m.size) continue;
    console.log(`\n  ${kind} — most common:`);
    for (const [s, n] of [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
      console.log(`      • ${s.length > 64 ? s.slice(0, 64) + "…" : s}  (${n})`);
    }
  }
  console.log("\n" + "=".repeat(78));
  console.log("COVERAGE — what this run did and did NOT check");
  console.log("=".repeat(78));
  console.log(`  audited          : ${scanned} page loads across ${PUBLIC_DYNAMIC.length} public dynamic routes × 3 locales`);
  console.log(`  behind a login   : ${gated.length} routes redirected, so their CONTENT IS STILL UNAUDITED`);
  for (const g of gated) console.log(`      · ${g}`);
  if (leaked.length) {
    console.log(`\n  🔴 ${leaked.length} route(s) returned 200 to a signed-out stranger:`);
    for (const l of leaked) console.log(`      · ${l}`);
  }
  if (unreachable.length) {
    console.log(`\n  ⚠️ ${unreachable.length} route(s) could not be fetched:`);
    for (const u of unreachable) console.log(`      · ${u}`);
  }
  console.log(
    "\n  Auditing the logged-in pages needs a session cookie, which needs the database.\n" +
      "  Until then they are counted here, not hidden inside a passing number.",
  );
  console.log("=".repeat(78));
})();
