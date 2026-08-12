#!/usr/bin/env node
/* BookMyPoojari — i18n AUDIT.    Run:  npm run build   then   node qa/i18n-audit.js
 *
 * WHY THIS READS HTML AND NOT SOURCE CODE
 * Source-reading is not testing. A phrase can be missing from the dictionary and still look
 * fine in the code; a phrase can be in the dictionary and never reach the screen. The only
 * ground truth for "is this page actually in Hindi" is the page Hindi visitors are served.
 * `npm run build` prerenders 181 pages per locale into .next/server/app/<locale>/. This reads
 * those and compares them.
 *
 * WHAT COUNTS AS A LEAK
 * A visible string that appears in the Hindi (or Telugu) page AND, character for character, in
 * the English page, and that contains Latin letters. If a phrase is identical in both languages
 * and is written in the English alphabet, it was never translated — it was passed through.
 *
 * WHAT IS DELIBERATELY NOT A LEAK
 * Brand names, the language switcher's own labels, and Sanskrit/Hindu terms that are correctly
 * left in Roman script are allowlisted at the bottom of this file, with a reason for each.
 *
 * BLIND SPOT — DYNAMIC PAGES. This compares PRERENDERED html. A route the build marks `ƒ`
 * (server-rendered on demand) writes no file into .next/server/app and so is not compared at all:
 * /[locale]/muhurat/find, plus every account, admin and priest page. The counts below are honest
 * about the 181 pages they cover and say nothing about the rest.
 *
 * Exit code is always 0 — this is a report, not a gate. qa/checks.js is the gate.
 */

"use strict";

if (!process.env.__BMP_QA_CHILD) {
  const { spawnSync } = require("node:child_process");
  const r = spawnSync(
    process.execPath,
    ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", __filename, ...process.argv.slice(2)],
    { stdio: "inherit", env: { ...process.env, __BMP_QA_CHILD: "1" } },
  );
  process.exit(r.status === null ? 1 : r.status);
}

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, ".next", "server", "app");
const SRC = path.join(ROOT, "src");
const LOCALES = ["hi", "te"];

if (!fs.existsSync(path.join(OUT, "hi"))) {
  console.error("No prerendered output found. Run `npm run build` first.");
  process.exit(1);
}

/* Text extraction, the allowlist and the classifier now live in qa/i18n-rules.js so that
   qa/live-audit.js uses exactly the same ones. Two copies drift, and then the two reports
   disagree about what counts as untranslated and nobody knows which to believe. */
const { visibleText, attrText, isUntranslated, classify } = require("./i18n-rules.js");

// ── walk the prerendered pages ───────────────────────────────────────────────
function pagesFor(locale) {
  const base = path.join(OUT, locale);
  const out = new Map();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".html"))
        out.set(path.relative(base, p).split(path.sep).join("/"), p);
    }
  };
  walk(base);

  /* ⚠️ THE HOMEPAGE IS NOT IN THAT FOLDER. Next writes the locale ROOT to
     .next/server/app/hi.html, a sibling of the app/hi/ directory rather than a file inside it.
     So from the day this audit was written until 12-Aug-2026 it walked app/hi/ and never once
     looked at the most-visited page on the site — in any language — while reporting a confident
     "198 pages compared".
     It was missing five leaks on the homepage strip alone (Tithi, Nakshatra, Rahu Kalam,
     "Today's Panchang · New Delhi", "Full panchang →"). Exactly the shape the a11y audit's own
     header warns about: silent about something while sounding definitive. */
  const root = path.join(OUT, `${locale}.html`);
  if (fs.existsSync(root)) out.set("index.html", root);
  return out;
}

const enPages = pagesFor("en");

/* A control, not a nicety. The homepage went unaudited for a week precisely because nothing
   asserted it was in the list — the count went up by one and nobody was counting. Refuse to run
   rather than quietly report on 198 pages again. */
for (const loc of ["en", ...LOCALES]) {
  if (!pagesFor(loc).has("index.html")) {
    console.error(
      `The ${loc} homepage is not in the page list. It lives at .next/server/app/${loc}.html,\n` +
        `a SIBLING of app/${loc}/ rather than a file inside it. Refusing to report on a\n` +
        `partial site — that is how it went unchecked in the first place.`,
    );
    process.exit(1);
  }
}

const leaksByString = new Map(); // string -> Set of "locale:page"
const pagesClean = { hi: 0, te: 0 };
const pagesDirty = { hi: 0, te: 0 };
const worstPages = [];

for (const locale of LOCALES) {
  for (const [route, file] of pagesFor(locale)) {
    const enFile = enPages.get(route);
    if (!enFile) continue;
    const loc = fs.readFileSync(file, "utf8");
    const en = fs.readFileSync(enFile, "utf8");

    const enStrings = new Set([...visibleText(en), ...attrText(en)]);
    const locStrings = [...visibleText(loc), ...attrText(loc)];

    const leaks = locStrings.filter((s) => isUntranslated(s, enStrings));
    if (leaks.length) {
      pagesDirty[locale]++;
      worstPages.push({ locale, route, count: leaks.length });
      for (const s of leaks) {
        if (!leaksByString.has(s)) leaksByString.set(s, new Set());
        leaksByString.get(s).add(`${locale}:${route}`);
      }
    } else {
      pagesClean[locale]++;
    }
  }
}

// ── trace each leaked phrase back to the file that writes it ─────────────────
const TS_FILES = (function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
})(SRC);
const FILE_TEXT = new Map(TS_FILES.map((f) => [f, fs.readFileSync(f, "utf8")]));
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const isClient = (f) => /^\s*["']use client["']/.test(FILE_TEXT.get(f) || "");

/* Attribute a phrase to the file that WRITES it, not every file that happens to contain the
   characters. A bare `includes()` blamed 20 files for the word "Poojas" — useless as a work list.
   A phrase only counts as written here if it appears as a complete quoted string literal, or as
   the entire text of a JSX element. */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function writersOf(phrase) {
  if (phrase.length < 2) return [];
  const p = esc(phrase);
  // "phrase"  |  'phrase'  |  `phrase`  |  >phrase<  (whole JSX text node)
  const asLiteral = new RegExp(`(["'\`])${p}\\1`);
  const asJsxText = new RegExp(`>\\s*${p}\\s*<`);
  return TS_FILES.filter((f) => {
    const src = FILE_TEXT.get(f);
    return asLiteral.test(src) || asJsxText.test(src);
  }).map(rel);
}

/* ── classify ────────────────────────────────────────────────────────────────
   A flat list of 1,300 "untranslated phrases" is not a work list, it is a wall. Three very
   different things are mixed together and they need three different decisions:

     CHROME   interface text a developer wrote — buttons, headings, nav, form labels.
              This is the actual bug, and the actual work.
     DATA     names of poojas, pandits, products, festivals. Whether "Griha Pravesh" should
              appear in Devanagari on the Hindi site is a decision for Santosh, not a defect.
     FORMAT   clock times, weekday and month names, "AM"/"PM". Real, but it is a date-formatting
              job (one helper), not hundreds of separate translations. */
// ── report ───────────────────────────────────────────────────────────────────
const sorted = [...leaksByString.entries()].sort((a, b) => b[1].size - a[1].size);

console.log("BookMyPoojari — i18n AUDIT (rendered output, not source)");
console.log("=".repeat(78));
console.log(
  `\nPages compared: ${enPages.size} routes × 2 non-English locales = ${enPages.size * 2}`,
);
console.log(`Hindi   : ${pagesClean.hi} fully translated, ${pagesDirty.hi} with English left in`);
console.log(`Telugu  : ${pagesClean.te} fully translated, ${pagesDirty.te} with English left in`);
console.log(`\nDistinct untranslated phrases: ${sorted.length}`);

const buckets = { CHROME: new Map(), DATA: new Map(), FORMAT: new Map() };
const reach = new Map(); // phrase -> pages affected

for (const [phrase, where] of sorted) {
  const writers = writersOf(phrase);
  const kind = classify(phrase, writers);
  reach.set(phrase, where.size);
  const keys = writers.length ? writers : ["(no source literal — composed at runtime or from data)"];
  for (const w of keys) {
    if (!buckets[kind].has(w)) buckets[kind].set(w, []);
    buckets[kind].get(w).push(phrase);
  }
}

const total = (b) => new Set([...buckets[b].values()].flat()).size;

console.log(`\n  ${total("CHROME")}  interface text   — a developer typed English into the UI`);
console.log(`  ${total("DATA")}  catalog content  — pooja / pandit / product names, a content decision`);
console.log(`  ${total("FORMAT")}  times and dates  — one date-formatting job, not many translations`);

const show = (bucket, title, blurb, limit) => {
  console.log("\n" + "=".repeat(78));
  console.log(title);
  console.log("=".repeat(78));
  console.log(blurb);
  const rank = [...buckets[bucket].entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [file, phrases] of rank) {
    const kind = file.startsWith("src/")
      ? isClient(path.join(ROOT, file))
        ? " [client]"
        : " [server]"
      : "";
    console.log(`\n  ${file}${kind}  — ${phrases.length} phrase(s)`);
    const top = phrases.sort((a, b) => (reach.get(b) || 0) - (reach.get(a) || 0));
    for (const p of top.slice(0, limit)) {
      console.log(
        `      • ${p.length > 62 ? p.slice(0, 62) + "…" : p}   (${reach.get(p)} pages)`,
      );
    }
    if (phrases.length > limit) console.log(`      … and ${phrases.length - limit} more`);
  }
};

show(
  "CHROME",
  "1. INTERFACE TEXT — THIS IS THE WORK LIST",
  "English hardcoded into components and pages. Every one of these is visible to a Hindi or\nTelugu visitor. Ordered by how many pages each appears on.",
  25,
);
show(
  "DATA",
  "2. CATALOG CONTENT — NEEDS A DECISION, NOT A FIX",
  "Names of poojas, pandits, products and festivals. Leaving these in Roman script may well be\ncorrect — that is Santosh's call, not a defect to be fixed silently.",
  10,
);
show(
  "FORMAT",
  "3. TIMES AND DATES — ONE HELPER, NOT MANY TRANSLATIONS",
  "Clock times, weekday and month names. Hundreds of distinct strings, one underlying cause:\nnothing passes the locale to toLocaleString/toLocaleDateString.",
  6,
);

console.log("\n" + "=".repeat(78));
console.log(
  `  ${sorted.length} untranslated phrases total. ` +
    `${pagesDirty.hi + pagesDirty.te} of ${enPages.size * 2} rendered pages affected.`,
);
console.log("=".repeat(78));
