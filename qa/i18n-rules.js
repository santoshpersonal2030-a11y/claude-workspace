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
]);
const ALLOW_RE = [
  /^[\s\d.,:%₹+\-/|()–—]+$/, // pure numbers, prices, punctuation
  /^[^\p{L}]*$/u, // emoji and symbols only
  /^https?:\/\//,
  /^[a-z0-9-]+\.(png|jpg|jpeg|svg|webp|ico|xml|txt)$/i,
];
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
