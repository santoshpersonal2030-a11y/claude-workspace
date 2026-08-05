/* The accessibility rules, extracted so that MORE THAN ONE auditor can use them.
 *
 * They used to live inline in qa/a11y-audit.js, which reads prerendered HTML from .next. That
 * covered 33 of the 98 page routes; the other 65 are server-rendered on demand and leave no file
 * behind, so they were never checked by anything — the whole account area, admin, priest portal,
 * and the wedding-date page. The audit still printed a confident "0 instances", which is the
 * worst possible combination: silent about two thirds of the site while sounding definitive.
 *
 * qa/live-audit.js now runs the SAME rules against a running server. They are here, in one file,
 * rather than copied — two copies of a rule drift, and then the two reports disagree and nobody
 * knows which to believe.
 *
 * Everything below is a pure function of an HTML string. No filesystem, no network.
 */

"use strict";

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return m ? m[1] : null;
};
const has = (tag, name) => new RegExp(`\\b${name}[\\s=>]`, "i").test(tag);
const stripTags = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
// Emoji, symbols and whitespace are not an accessible name to a screen reader.
const hasWords = (s) => /[\p{L}\p{N}]/u.test(s || "");

/* Runs every rule over one page.
 * `add(rule, detail, route)` is supplied by the caller so each auditor can collect as it likes. */
function auditHtml(html, route, add) {
  const body = html.slice(html.indexOf("<body"));

  // ── 1. images without alt ────────────────────────────────────────────────
  for (const m of body.matchAll(/<img\b[^>]*>/gi)) {
    if (attr(m[0], "alt") === null) {
      add("img-no-alt", (attr(m[0], "src") || "?").slice(0, 70), route);
    }
  }

  // ── 2. buttons with no accessible name ───────────────────────────────────
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

  // ── 3. links with no accessible name ─────────────────────────────────────
  for (const m of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const [, attrs, inner] = m;
    const name = attr(`<a${attrs}>`, "aria-label") || stripTags(inner);
    if (!hasWords(name) && !has(`<a${attrs}>`, "aria-labelledby")) {
      add("link-no-name", (attr(`<a${attrs}>`, "href") || "?").slice(0, 60), route);
    }
  }

  /* ── 4. form controls with no label ──────────────────────────────────────
     There are TWO valid ways to label a control and this must know both. The first version of
     this rule only knew `<label for="…">` and aria-label, and duly reported 22 blocking defects
     across 58 pages — including every field on the priest application form, which is in fact
     labelled correctly by a wrapping `<label>Full name *<input/></label>`. Implicit association
     is valid HTML and screen readers honour it. A rule that flags correct markup as a blocker is
     worse than no rule: it buries the real ones. */
  const labelFor = new Set(
    [...body.matchAll(/<label\b[^>]*\bfor="([^"]+)"/gi)].map((m) => m[1]),
  );
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

  // ── 5. heading structure ─────────────────────────────────────────────────
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
  for (const h of levels.filter((h) => !hasWords(h.text))) {
    add("empty-heading", `empty <h${h.level}>`, route);
  }

  // ── 6. duplicate ids (breaks label-for and aria-labelledby) ──────────────
  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) add("duplicate-id", id, route);
    seen.add(id);
  }

  // ── 7. aria-hidden wrapping something focusable ──────────────────────────
  for (const m of body.matchAll(
    /<([a-z]+)\b[^>]*aria-hidden="true"[^>]*>([\s\S]{0,400}?)<\/\1>/gi,
  )) {
    if (/<(a|button|input|select|textarea)\b/i.test(m[2])) {
      add("aria-hidden-focusable", `<${m[1]} aria-hidden> contains a focusable element`, route);
    }
  }

  // ── 8. expandable controls without aria-expanded ─────────────────────────
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

  // ── 9. generic link text ─────────────────────────────────────────────────
  for (const m of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const text = stripTags(m[2]).toLowerCase();
    if (/^(click here|here|read more|more|link|this)$/.test(text)) {
      add("vague-link-text", `"${text}"`, route);
    }
  }

  // ── 10. lang attribute ───────────────────────────────────────────────────
  if (!/<html[^>]*\blang="[a-z]{2}/i.test(html)) add("no-lang", "<html> has no lang", route);
}

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

/* Shared reporter, so the two audits cannot disagree about how a finding is described. */
function report(findings, pageCount, header, footerNote) {
  console.log(header);
  console.log("=".repeat(78));
  console.log(`Pages scanned: ${pageCount}\n`);

  let total = 0;
  const rules = [...findings.entries()].sort(
    (a, b) =>
      ORDER.indexOf((SEVERITY[a[0]] || ["MINOR"])[0]) -
      ORDER.indexOf((SEVERITY[b[0]] || ["MINOR"])[0]),
  );
  if (!rules.length) console.log("  Nothing found by these ten rules.");

  for (const [rule, details] of rules) {
    const [sev, why] = SEVERITY[rule] || ["MINOR", ""];
    const pages = new Set([...details.values()].flatMap((s) => [...s])).size;
    const instances = [...details.values()].reduce((n, s) => n + s.size, 0);
    total += instances;
    console.log("-".repeat(78));
    console.log(`${sev}  ${rule}  — ${details.size} distinct, on ${pages} pages`);
    console.log(`  ${why}`);
    for (const [detail, where] of [...details.entries()]
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 12)) {
      console.log(`    • ${detail}`);
      console.log(`        ${where.size} page(s), e.g. ${[...where].slice(0, 2).join(", ")}`);
    }
    if (details.size > 12) console.log(`    … and ${details.size - 12} more`);
  }

  console.log("\n" + "=".repeat(78));
  console.log(`  ${total} instances across ${rules.length} rules, ${pageCount} pages scanned.`);
  if (footerNote) console.log(footerNote);
  console.log("=".repeat(78));
  return total;
}

/* A collector matching the shape both auditors use. */
function makeCollector() {
  const findings = new Map();
  const add = (rule, detail, page) => {
    if (!findings.has(rule)) findings.set(rule, new Map());
    const m = findings.get(rule);
    if (!m.has(detail)) m.set(detail, new Set());
    m.get(detail).add(page);
  };
  return { findings, add };
}

module.exports = { auditHtml, report, makeCollector, SEVERITY, ORDER };
