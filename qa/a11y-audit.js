#!/usr/bin/env node
/* BookMyPoojari — ACCESSIBILITY AUDIT.   Run:  npm run build   then   node qa/a11y-audit.js
 *
 * The handoff says a global accessibility pass is done and a per-component sweep is still
 * outstanding. This looks for what the global pass missed.
 *
 * It reads the 181 prerendered pages in .next/server/app/en/ — the actual HTML a screen reader
 * receives — rather than the components that produce it. Source-reading would miss exactly the
 * cases that matter: a label that exists in the code but never renders, an aria-label built from
 * a variable that comes out empty, an icon button whose only text is an emoji.
 *
 * WHAT IT CANNOT SEE, and so does not claim to check:
 *   - Colour contrast. That needs computed CSS, not HTML. Checked separately by hand.
 *   - Anything that only exists after a click: open drawers, dropdown menus, dialogs, toasts.
 *     Those are the highest-risk surfaces for keyboard traps and are NOT covered here.
 *   - Focus order and focus visibility, which need a real browser.
 *   - LAYOUT REFLOW (WCAG 1.4.10). Added to this list on 05-Aug-2026 after a browser found that
 *     every page on the site scrolls sideways at 360px wide — the header needs 436px and clips
 *     the ☰ menu button off the right edge. That is a CSS problem that only exists once a page
 *     is measured at a width; nothing in the HTML shows it. This file reported zero problems
 *     while that was true on all 96 pages. Reflow needs a real browser at a real viewport.
 * A clean run here is not a clean bill of health. It is one layer.
 *
 * Exit code is always 0 — this is a report. qa/checks.js is the gate.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

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

const findings = new Map(); // rule -> Map(detail -> Set(pages))
const add = (rule, detail, page) => {
  if (!findings.has(rule)) findings.set(rule, new Map());
  const m = findings.get(rule);
  if (!m.has(detail)) m.set(detail, new Set());
  m.get(detail).add(page);
};

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return m ? m[1] : null;
};
const has = (tag, name) => new RegExp(`\\b${name}[\\s=>]`, "i").test(tag);
const stripTags = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
// Emoji, symbols and whitespace are not an accessible name to a screen reader.
const hasWords = (s) => /[\p{L}\p{N}]/u.test(s || "");

for (const [route, file] of pages) {
  const html = fs.readFileSync(file, "utf8");
  const body = html.slice(html.indexOf("<body"));

  // ── 1. images without alt ──────────────────────────────────────────────────
  for (const m of body.matchAll(/<img\b[^>]*>/gi)) {
    if (attr(m[0], "alt") === null) {
      add("img-no-alt", (attr(m[0], "src") || "?").slice(0, 70), route);
    }
  }

  // ── 2. buttons with no accessible name ─────────────────────────────────────
  for (const m of body.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const [, attrs, inner] = m;
    const name =
      attr(`<b${attrs}>`, "aria-label") ||
      attr(`<b${attrs}>`, "title") ||
      stripTags(inner);
    if (!hasWords(name) && !has(`<b${attrs}>`, "aria-labelledby")) {
      add(
        "button-no-name",
        `<button${attrs.slice(0, 60)}> "${stripTags(inner).slice(0, 20)}"`,
        route,
      );
    }
  }

  // ── 3. links with no accessible name ───────────────────────────────────────
  for (const m of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const [, attrs, inner] = m;
    const name = attr(`<a${attrs}>`, "aria-label") || stripTags(inner);
    if (!hasWords(name) && !has(`<a${attrs}>`, "aria-labelledby")) {
      add("link-no-name", (attr(`<a${attrs}>`, "href") || "?").slice(0, 60), route);
    }
  }

  /* ── 4. form controls with no label ────────────────────────────────────────
     There are TWO valid ways to label a control and this must know both. The first version of
     this rule only knew `<label for="…">` and aria-label, and duly reported 22 blocking defects
     across 58 pages — including every field on the priest application form, which is in fact
     labelled correctly by a wrapping `<label>Full name *<input/></label>`. Implicit association
     is valid HTML and screen readers honour it. A rule that flags correct markup as a blocker is
     worse than no rule: it buries the real ones. */
  const labelFor = new Set(
    [...body.matchAll(/<label\b[^>]*\bfor="([^"]+)"/gi)].map((m) => m[1]),
  );
  // Byte ranges of every <label> that contains actual words, so a control inside one is named.
  const labelRanges = [];
  for (const m of body.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/gi)) {
    if (hasWords(stripTags(m[1]))) labelRanges.push([m.index, m.index + m[0].length]);
  }
  const insideLabel = (i) => labelRanges.some(([a, b]) => i > a && i < b);

  for (const m of body.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
    const [, tag, attrs] = m;
    const type = (attr(`<x${attrs}>`, "type") || "text").toLowerCase();
    if (["hidden", "submit", "button", "reset", "image"].includes(type)) continue;
    const id = attr(`<x${attrs}>`, "id");
    const named =
      (id && labelFor.has(id)) ||
      insideLabel(m.index) ||
      hasWords(attr(`<x${attrs}>`, "aria-label")) ||
      has(`<x${attrs}>`, "aria-labelledby") ||
      hasWords(attr(`<x${attrs}>`, "title"));
    if (!named) {
      add(
        "control-no-label",
        `<${tag} type=${type} name=${attr(`<x${attrs}>`, "name") || "?"} id=${id || "none"}>`,
        route,
      );
    }
  }

  // ── 5. heading structure ───────────────────────────────────────────────────
  const levels = [...body.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({
    level: Number(m[1]),
    text: stripTags(m[2]),
  }));
  const h1s = levels.filter((h) => h.level === 1);
  if (h1s.length === 0) add("no-h1", "page has no <h1>", route);
  if (h1s.length > 1) add("multiple-h1", `${h1s.length} <h1> elements`, route);
  for (let i = 1; i < levels.length; i++) {
    const jump = levels[i].level - levels[i - 1].level;
    if (jump > 1) {
      add(
        "heading-skip",
        `h${levels[i - 1].level} → h${levels[i].level} at "${levels[i].text.slice(0, 40)}"`,
        route,
      );
    }
  }
  const emptyHeads = levels.filter((h) => !hasWords(h.text));
  for (const h of emptyHeads) add("empty-heading", `empty <h${h.level}>`, route);

  // ── 6. duplicate ids (breaks label-for and aria-labelledby) ────────────────
  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) add("duplicate-id", id, route);
    seen.add(id);
  }

  // ── 7. aria-hidden wrapping something focusable ────────────────────────────
  for (const m of body.matchAll(
    /<([a-z]+)\b[^>]*aria-hidden="true"[^>]*>([\s\S]{0,400}?)<\/\1>/gi,
  )) {
    if (/<(a|button|input|select|textarea)\b/i.test(m[2])) {
      add("aria-hidden-focusable", `<${m[1]} aria-hidden> contains a focusable element`, route);
    }
  }

  // ── 8. expandable controls without aria-expanded ───────────────────────────
  // A control that opens a drawer, menu or dropdown must say whether it is open.
  for (const m of body.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const [, attrs, inner] = m;
    const label = (
      (attr(`<b${attrs}>`, "aria-label") || "") + " " + stripTags(inner)
    ).toLowerCase();
    const looksExpandable = /(menu|open|toggle|filter|sort|dropdown|drawer|more|options)/.test(
      label,
    );
    if (looksExpandable && !has(`<b${attrs}>`, "aria-expanded")) {
      add("no-aria-expanded", `"${label.trim().slice(0, 40)}"`, route);
    }
  }

  // ── 9. generic link text ───────────────────────────────────────────────────
  for (const m of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const text = stripTags(m[2]).toLowerCase();
    if (/^(click here|here|read more|more|link|this)$/.test(text)) {
      add("vague-link-text", `"${text}"`, route);
    }
  }

  // ── 10. lang attribute ─────────────────────────────────────────────────────
  if (!/<html[^>]*\blang="[a-z]{2}/i.test(html)) add("no-lang", "<html> has no lang", route);
}

// ── report ───────────────────────────────────────────────────────────────────
const SEVERITY = {
  "control-no-label": ["BLOCKER", "A form field a screen reader cannot name. Unusable."],
  "button-no-name": ["BLOCKER", "A button announced only as 'button'. Unusable."],
  "link-no-name": ["BLOCKER", "A link with nothing to announce."],
  "img-no-alt": ["SERIOUS", "An image with no alt attribute at all."],
  "no-h1": ["SERIOUS", "No top-level heading — nothing to orient by."],
  "duplicate-id": ["SERIOUS", "Two elements share an id, so label-for points at the wrong one."],
  "aria-hidden-focusable": ["SERIOUS", "Hidden from screen readers but still reachable by Tab."],
  "no-aria-expanded": ["MODERATE", "An expandable control that never says whether it is open."],
  "heading-skip": ["MODERATE", "A heading level was skipped."],
  "multiple-h1": ["MODERATE", "More than one top-level heading."],
  "empty-heading": ["MODERATE", "A heading with no text."],
  "vague-link-text": ["MINOR", "Link text that means nothing out of context."],
  "no-lang": ["SERIOUS", "The page does not declare its language."],
};
const ORDER = ["BLOCKER", "SERIOUS", "MODERATE", "MINOR"];

console.log("BookMyPoojari — ACCESSIBILITY AUDIT (rendered HTML)");
console.log("=".repeat(78));
console.log(`Pages scanned: ${pages.length}\n`);

let total = 0;
const rules = [...findings.entries()].sort(
  (a, b) =>
    ORDER.indexOf((SEVERITY[a[0]] || ["MINOR"])[0]) -
    ORDER.indexOf((SEVERITY[b[0]] || ["MINOR"])[0]),
);

if (!rules.length) console.log("  Nothing found by these ten rules.");

for (const [rule, details] of rules) {
  const [sev, why] = SEVERITY[rule] || ["MINOR", ""];
  const pageCount = new Set([...details.values()].flatMap((s) => [...s])).size;
  const instances = [...details.values()].reduce((n, s) => n + s.size, 0);
  total += instances;
  console.log("-".repeat(78));
  console.log(`${sev}  ${rule}  — ${details.size} distinct, on ${pageCount} pages`);
  console.log(`  ${why}`);
  for (const [detail, where] of [...details.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 12)) {
    const eg = [...where].slice(0, 2).join(", ");
    console.log(`    • ${detail}`);
    console.log(`        ${where.size} page(s), e.g. ${eg}`);
  }
  if (details.size > 12) console.log(`    … and ${details.size - 12} more`);
}

console.log("\n" + "=".repeat(78));
console.log(`  ${total} instances across ${rules.length} rules, ${pages.length} pages scanned.`);
console.log("  Contrast, focus order, and anything behind a click are NOT covered — see header.");
console.log("=".repeat(78));
