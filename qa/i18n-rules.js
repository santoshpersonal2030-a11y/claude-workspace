/* Shared i18n analysis, extracted for the same reason as qa/a11y-rules.js.
 *
 * qa/i18n-audit.js reads PRERENDERED pages; qa/live-audit.js reads a running server. They were
 * finding untranslated text in two different ways, and only the prerendered one sorted its
 * findings into a work list — so the live audit reported a flat "187 phrases", which is a number
 * without an action attached.
 *
 * One copy, used by both. Pure functions of strings: no filesystem, no network.
 */

"use strict";

const INLINE =
  "a|abbr|b|bdi|bdo|cite|code|data|dfn|em|i|kbd|mark|q|s|samp|small|span|strong|sub|sup|time|u|var|wbr";

const decode = (s) =>
  s
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&#x2F;/g, "/");

/* Inline tags must be transparent, not breaks. An early version turned EVERY tag into a newline,
   so "Book a <strong>verified</strong> pandit" came out as three strings and the fragment "a" was
   reported as untranslated copy — 1,545 findings, most of them rubbish. A closing inline tag
   followed by another tag IS a boundary (two links side by side); anywhere else it sits inside
   one sentence. */
/* NOTE: this deliberately does NOT slice to <body>. The <title> and meta description live in the
   <head> and are user-visible — in the browser tab and in search results — so an untranslated one
   is a real finding. Slicing them away while "refactoring" quietly dropped 120 findings and made
   the report look better than the site. */
function visibleText(html) {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<template[\s\S]*?<\/template>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(new RegExp(`</(?:${INLINE})>(?=\\s*<)`, "gi"), "\n")
    .replace(new RegExp(`</?(?:${INLINE})(?:\\s[^>]*)?>`, "gi"), "")
    .replace(/<[^>]+>/g, "\n");
  return new Set(
    body
      .split("\n")
      .map((s) => decode(s).replace(/\s+/g, " ").trim())
      .filter(Boolean),
  );
}

// Attributes a screen reader or a search engine reads. Untranslated ones are still leaks.
function attrText(html) {
  const out = new Set();
  const re = /\b(aria-label|alt|title|placeholder)="([^"]{2,})"/g;
  let m;
  while ((m = re.exec(html))) out.add(decode(m[2]).replace(/\s+/g, " ").trim());
  return out;
}

const ALLOW = new Set([
  "BookMyPoojari", // the brand, identical in every language by design
  "English", // the language switcher must name each language in that language
  "हिन्दी",
  "తెలుగు",
  "Skip to content",

  /* ── PROPER NOUNS THAT STAY IN ENGLISH — Santosh's decision, 12-Aug-2026 ──────────────────
     Asked directly whether city and rashi names should read हैदराबाद and सिंह on the Hindi and
     Telugu pages, or stay in the Roman alphabet. Answer: English.

     This is the one call in the whole i18n job that is about his own customers rather than
     about code, so it is recorded here rather than left as 15 phrases that look like unfinished
     work forever. They were never defects; the audit simply could not tell a proper noun from a
     forgotten button.

     ⚠️ Everything below is a NAME. Nothing here is a label. "Life Event" and "Home" looked like
     they belonged in this list and did NOT — they are pooja-category badges, and the fix was
     that PoojaCard printed the raw value while PoojaList already translated it. Adding a label
     here would hide a real bug behind a real decision, which is the way an allowlist goes bad. */

  // Cities. Also the sunrise reference on every panchang page, hence the reach.
  "New Delhi",

  // Languages a pandit performs in. Shown as-is on 98 pages.
  "Hindi",
  "Sanskrit",
  "Marathi",
  "Hindi, Sanskrit, Marathi",

  // Rashi (moon-sign) names from the muhurat engine.
  "Simha",
  "Kanya",
  "Karka",

  // Vrat and festival names the engine computes.
  "Vinayaka Chaturthi",
  "Pradosh Vrat",
  "Sankashti Chaturthi",

  // People's names in the testimonials.
  "Priya & Aniket",
  "Ramesh Gupta",
  "Lakshmi Iyer",

  /* Religious vocabulary deliberately kept transliterated in ALL THREE languages — an older
     decision, already written down in src/lib/i18n.ts: "muhurat, nakshatra, tithi, Rahu Kalam
     … because that is what people actually say and search for." */
  "Muhurat",
]);
const ALLOW_RE = [
  /^[\s\d.,:%₹+\-/|()–—]+$/, // pure numbers, prices, punctuation
  /^[^\p{L}]*$/u, // emoji and symbols only
  /^https?:\/\//,
  /^[a-z0-9-]+\.(png|jpg|jpeg|svg|webp|ico|xml|txt)$/i,
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // an email address is not translatable in any language
];

/* A guard on the allowlist itself. These are LABELS, not names — a developer typed them into
   the interface — and each one looked exactly like the proper nouns above. "Life Event" and
   "Home" are pooja-category badges: PoojaCard was printing the raw English value while
   PoojaList already translated it via pcat.*, so they showed up in the audit looking like
   another name to wave through. Waving them through would have hidden a real bug behind a real
   decision, which is how an allowlist quietly stops being worth anything. */
const MUST_NOT_BE_ALLOWED = ["Life Event", "Home", "Festival", "Remedial", "Ancestral"];
for (const label of MUST_NOT_BE_ALLOWED) {
  if (ALLOW.has(label)) {
    throw new Error(
      `qa/i18n-rules.js: "${label}" is a UI label, not a proper noun, and must not be ` +
        `allowlisted. If it is showing up untranslated, translate it — do not excuse it.`,
    );
  }
}
const isAllowed = (s) => ALLOW.has(s) || ALLOW_RE.some((re) => re.test(s));
const hasLatinLetters = (s) => /[A-Za-z]/.test(s);
// Devanagari or Telugu characters mean the string has clearly been through translation.
const hasIndicScript = (s) => /[ऀ-ॿఀ-౿]/.test(s);

/* Is this phrase, seen on a non-English page, untranslated?
   It must be identical to the English page, written in Latin script, and not allowlisted. */
function isUntranslated(phrase, englishStrings) {
  return (
    englishStrings.has(phrase) &&
    hasLatinLetters(phrase) &&
    !hasIndicScript(phrase) &&
    !isAllowed(phrase)
  );
}

const WEEKDAYS = /\b(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day\b/;
const MONTHS =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/;
const CLOCK = /\d{1,2}:\d{2}\s*(AM|PM)/i;

/* Three very different things get mixed together, and they need three different decisions:
     CHROME  interface text a developer wrote — the actual bug, and the actual work
     DATA    names of poojas, pandits, products, cities, festivals — a content decision
     FORMAT  clock times, weekdays, months — one date-formatting job, not many translations
   `writers` is the list of source files that contain the phrase as a literal; when the caller
   cannot work that out (the live audit has no file map) pass an empty array and the phrase is
   classified on its shape alone. */
function classify(phrase, writers = [], { shapeFallback = false } = {}) {
  /* A clock time is always a formatting matter. A weekday or month name is only a formatting
     matter when the phrase IS a date — "Wednesday · New Delhi" yes, "Order samagri by 3 November
     to receive it in time" no. Without the length guard that sentence, which is interface copy I
     wrote myself, was filed under date-formatting and would never have been translated. */
  if (CLOCK.test(phrase)) return "FORMAT";
  const wordCount = phrase.split(/\s+/).filter(Boolean).length;
  if ((WEEKDAYS.test(phrase) || MONTHS.test(phrase)) && wordCount <= 6) return "FORMAT";
  const inUi = writers.some(
    (w) => w.startsWith("src/components/") || w.startsWith("src/app/"),
  );
  if (inUi) return "CHROME";
  if (writers.length || !shapeFallback) return "DATA";

  /* Only for callers with no file map — the live audit reads a running server and cannot say
     which file wrote a phrase. Fall back on shape: a short Title Case phrase with no sentence
     punctuation is almost always a name (a city, a pandit, a product); anything longer or with
     punctuation is interface copy.
     OFF by default. Switching it on for the prerendered audit, where writers ARE known, moved 65
     phrases from DATA to CHROME and made a refactor look like a change in the site. */
  /* A name is Title Case all the way through. Separators (·, /, –, ✓) join names together —
     "Revati · Shukla Saptami" is two Sanskrit proper nouns, not a sentence.
     The first version tested only for punctuation and a 3-word limit, so it filed every
     nakshatra-and-tithi pair under "interface text". That put 121 astrological proper nouns at the
     top of the work list as things a developer should translate, which is the wrong instruction. */
  const tokens = phrase
    .replace(/[·•|/–—✓()]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return "CHROME";
  if (/[.,;:!?]/.test(phrase)) return "CHROME"; // sentence punctuation ⇒ prose
  const CONNECTORS = new Set(["of", "the", "and", "in", "at", "de", "e"]);
  const looksLikeAName = tokens.every(
    (w) => /^[A-Z0-9]/.test(w) || CONNECTORS.has(w.toLowerCase()),
  );
  return looksLikeAName ? "DATA" : "CHROME";
}

module.exports = {
  visibleText,
  attrText,
  isAllowed,
  hasLatinLetters,
  hasIndicScript,
  isUntranslated,
  classify,
  INLINE,
};
