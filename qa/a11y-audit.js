#!/usr/bin/env node
/* BookMyPoojari — ACCESSIBILITY AUDIT, PRERENDERED PAGES.
 *   npm run build   then   node qa/a11y-audit.js
 *
 * The handoff says a global accessibility pass is done and a per-component sweep is still
 * outstanding. This looks for what the global pass missed.
 *
 * It reads the prerendered pages in .next/server/app/en/ — the actual HTML a screen reader
 * receives — rather than the components that produce it. Source-reading would miss exactly the
 * cases that matter: a label that exists in the code but never renders, an aria-label built from
 * a variable that comes out empty, an icon button whose only text is an emoji.
 *
 * ⚠️ THIS COVERS ONLY THE PRERENDERED THIRD OF THE SITE.
 * A route the build marks `ƒ` is server-rendered on demand and leaves no file here, so it cannot
 * appear below: the whole account area, admin, priest portal, checkout and /muhurat/find. That is
 * 65 of the 98 page routes. **Run `node qa/live-audit.js` for those** — it applies the same rules
 * (qa/a11y-rules.js, shared, not copied) against a running server.
 *
 * WHAT NEITHER AUDIT CAN SEE, and so neither claims to check:
 *   - Colour contrast. That needs computed CSS, not HTML.
 *   - Anything that only exists after a click: open drawers, dropdowns, dialogs, toasts.
 *   - Focus order and focus visibility, which need a real browser.
 *   - LAYOUT REFLOW (WCAG 1.4.10). Added to this list on 05-Aug-2026 after a browser found that
 *     every page scrolled sideways at 360px — the header needed 436px and clipped the ☰ button.
 *     This file reported zero problems while that was true on all 96 pages.
 * A clean run here is not a clean bill of health. It is one layer.
 *
 * Exit code is always 0 — this is a report. qa/checks.js is the gate.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { auditHtml, report, makeCollector } = require("./a11y-rules.js");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, ".next", "server", "app", "en");

if (!fs.existsSync(OUT)) {
  console.error("No prerendered output found. Run `npm run build` first.");
  process.exit(1);
}

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".html"))
      pages.push([path.relative(OUT, p).split(path.sep).join("/"), p]);
  }
})(OUT);

const { findings, add } = makeCollector();
for (const [route, file] of pages) {
  auditHtml(fs.readFileSync(file, "utf8"), route, add);
}

report(
  findings,
  pages.length,
  "BookMyPoojari — ACCESSIBILITY AUDIT (prerendered pages)",
  "  Prerendered pages only. 65 dynamic routes need `node qa/live-audit.js`.\n" +
    "  Contrast, focus order, reflow and anything behind a click are NOT covered — see header.",
);
