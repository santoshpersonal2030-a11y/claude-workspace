# Hindi & Telugu coverage — audit and plan

**Written 05-Aug-2026.**
**Part 1 — the audit: what is true today.** No code was changed to produce it.
**Part 2 — the plan: what to do about it, in what order, and what could break.** Starts
[here](#part-2--the-plan).

---

## The short version

The handoff document lists "full Hindi/Telugu coverage" as the number-one outstanding job, and
describes the fix as migrating the site to an `app/[locale]/` route segment with server-side
dictionaries — *"Large; its own effort."*

**That migration already exists in the code.** It appears to have been done in June and the
pending list was never updated. Specifically:

| The handoff says this is needed | Actually |
|---|---|
| An `app/[locale]/` route segment | ✅ Done — all 96 pages live under it |
| Server-side dictionaries | ✅ Done — `getDictionary(locale)` in `src/lib/i18n.ts` |
| `generateStaticParams` per locale | ✅ Done — `src/app/[locale]/layout.tsx` |
| Locale-aware `<html lang>` | ✅ Done — verified in the built HTML |
| Locale-aware metadata | ⚠️ Partly — see gap 3 |
| Locale-aware sitemap | ❌ **Not done** — see gap 2 |

The dictionary itself is **complete**: 632 phrases in English, 632 in Hindi, 632 in Telugu.
Nothing is missing and there are no orphans. This was verified by parsing the dictionary, and
it is now a permanent check in `qa/checks.js`.

**So the big migration is not the job.** The job that remains is different and smaller: English
that was typed straight into components and never routed through the dictionary at all. A
dictionary cannot help a phrase that never asks it for a translation.

---

## How this was measured

Source-reading is not testing. A phrase can be in the dictionary and never reach the screen, and
a phrase can be missing from the dictionary and look perfectly fine in the code. The only ground
truth for *"is this page actually in Hindi"* is the page a Hindi visitor is served.

`npm run build` prerenders **181 pages per language** into `.next/server/app/<locale>/`.
`qa/i18n-audit.js` reads those and compares them, character for character:

> A visible string that appears in the Hindi page **and identically in the English page**, and
> that is written in the Latin alphabet, was never translated. It was passed through.

Brand names, the language switcher's own labels, and pure numbers/symbols are allowlisted.
Re-run it any time with:

```bash
npm run build && node qa/i18n-audit.js
```

### Two mistakes worth recording, because both produced convincing wrong answers

1. **The first version split text at every HTML tag.** "Book a **verified** pandit" came out as
   three separate strings, and the fragment `"a"` was reported as untranslated interface copy.
   It reported 1,545 problems, most of them rubbish. Splitting only at block-level tags fixed it.
2. **The first version blamed the wrong files.** A plain substring search attributed the word
   "Poojas" to twenty files, which is useless as a work list. It now only counts a phrase as
   written by a file if it appears there as a complete quoted string or as the whole text of an
   element.

---

## What the audit found

**Result: 0 of 181 Hindi pages and 0 of 181 Telugu pages are fully translated.** Every single
page has some English left in it. But that headline is misleading on its own, because three very
different things are mixed together:

| | Count | What it is | What to do |
|---|---:|---|---|
| **Interface text** | **158** | English a developer typed into a button, heading, nav item or form label | **This is the bug. This is the work.** |
| **Catalog content** | 353 | Names of poojas, pandits, products, festivals | **A decision for Santosh**, not a defect |
| **Times and dates** | 1,038 | Clock times, weekday and month names, AM/PM | **One date-formatting job**, not 1,038 translations |

### The 1,038 is one bug, not a thousand

Every "10:47 AM – 12:26 PM" and every "Wednesday · New Delhi" counts as a separate untranslated
string, which is why the raw number looks terrifying. They all have the same single cause:
nothing passes the current language to the date and time formatter. One helper function, applied
in the handful of places that format a time, closes almost all of it.

### ⚠️ Correction — the 353 is NOT a pending decision

**This section originally said the catalog names needed a decision from Santosh before anyone
wrote code. That was wrong, and it is corrected here rather than quietly edited away.**

The decision was already made in June, and the work is already done:

- `src/lib/poojas-i18n.ts` translates **all 48 poojas — 48/48 in Hindi and 48/48 in Telugu**,
  names and descriptions.
- Five more helpers exist and do the same job: `localizeProduct`, `localizePandit`,
  `localizeTemplePuja`, `localizeConsultation`, `localizeLifeEvent`.

So the answer to *"should Griha Pravesh appear as गृह प्रवेश"* is **yes, and it already does** —
on every surface that calls `localizePooja()`.

**The 353 is therefore not a content decision. It is the same defect as the interface text, in a
different place: surfaces that render a catalog name without calling the localize helper.** The
footer was one of them — it hardcoded "Satyanarayan Katha" while the catalog had सत्यनारायण कथा
sitting right there.

The lesson worth keeping: the audit classified by *where a string was written* rather than by
*whether a translation existed for it*. That is a reasonable-sounding rule that produced a
confident wrong answer, and it took opening `poojas-i18n.ts` to notice.

---

## The interface work list — 158 phrases across 74 files

### Where it hurts most

| File | Phrases | Appears on | Why it matters |
|---|---:|---:|---|
| `src/components/Footer.tsx` | **30** | **every page** | The whole footer link tree is a hardcoded English array |
| `src/components/PanditApplicationForm.tsx` | 27 | 2 | Every label on the priest sign-up form |
| `src/app/[locale]/terms/page.tsx` | 15 | 2 | Terms & Conditions, entirely English |
| `src/app/[locale]/privacy/page.tsx` | 13 | 2 | Privacy Policy, entirely English |
| `src/app/[locale]/login/page.tsx` | 11 | 2 | Sign-in screen |
| `src/app/[locale]/refund-policy/page.tsx` | 11 | 2 | Refund policy |
| `src/lib/muhurat-engine.ts` | 9 | many | Muhurat names and quality labels |
| `src/app/[locale]/become-a-pandit/page.tsx` | 9 | 2 | Priest recruitment page |
| `src/components/ContactForm.tsx` | 8 | 2 | Contact form labels |
| `src/components/PackageBookingForm.tsx` | 7 | many | Wedding-package booking |

The remaining 64 files have 1–7 phrases each. The full list is the output of `qa/i18n-audit.js`.

### `Footer.tsx` is the single biggest win in the codebase

It calls `t()` correctly for its tagline and copyright line — and then renders **five column
headings and twenty-four links from a hardcoded English array**, plus "Made with devotion in
India". Thirty English strings, on all 96 pages, in all three languages. One file, one change,
and roughly a fifth of the entire interface problem disappears.

---

## Which files can and cannot translate today

This is the "server or client" census the audit was asked for. It matters because the two halves
of the app get their translations by different routes: server components call
`getDictionary(locale)`, client components call the `useT()` hook.

| | Total | Server | Client | Translates something | Translates **nothing** |
|---|---:|---:|---:|---:|---:|
| Pages | 96 | 93 | 3 | 30 | **66** |
| Components | 70 | 18 | 52 | 18 | **52** |
| Layouts | 3 | 3 | 0 | 0 | 3 |

**Nothing here is *untranslatable*.** That is the important correction to the handoff. Both
routes work today; 118 files simply never take either of them.

### The 66 non-translating pages are not 66 equal problems

| Area | Pages | Who sees it |
|---|---:|---|
| Admin console | 33 | Staff only |
| Customer account area | 14 | Signed-in customers |
| Priest portal | 6 | Signed-in priests |
| **Public pages** | **13** | **Anyone, including a first-time visitor** |

The 13 public ones are: `terms`, `privacy`, `refund-policy`, `contact`, `become-a-pandit`,
`login`, `auth/reset`, `blog`, `blog/[slug]`, `live-astrology` (×3) and `offline`.

Whether the admin console should be translated at all is a decision, not an oversight — it is
staff-facing, and English admin screens are a perfectly normal choice.

---

## Three concrete gaps found while auditing

These are not "phrases missing"; they are things that are wired up wrongly.

### Gap 1 — Telugu has no hreflang entry, and the comment says "both locales"

`src/app/[locale]/layout.tsx` declares which language versions exist:

```ts
languages: { en: "/", hi: "/hi", "x-default": "/" }
```

**Telugu is not in the list.** The comment above `generateStaticParams` still says *"Pre-render
both locales"* — written when there were two languages. Telugu was added later and this was
never updated. Same shape as the unit test that still asserted the app had 2 languages.

Consequence: search engines are told the Telugu pages do not exist.

Also in the same file, `openGraph.locale` is `loc === "hi" ? "hi_IN" : "en_IN"` — so a Telugu
page tells Facebook and WhatsApp it is **English**.

### Gap 2 — The sitemap is English-only

`src/app/sitemap.ts` lists every page once, at its unprefixed (English) URL. There is not a
single `/hi/…` or `/te/…` entry, and no `alternates.languages` hreflang block.

Consequence: **Google will never index the Hindi or Telugu version of any page.** All the
translation work already done is invisible to search. For a business whose customers search in
Hindi, this is the highest-value item in this document relative to its size.

### Gap 3 — The site's default title and description are English in every language

The layout hardcodes an English title, description, keywords and Open Graph block for all three
locales. Individual pages do set their own translated titles (the Hindi About page correctly
renders **हमारे बारे में**), so this only affects pages that fall back to the default — but the
`meta.*` keys already exist in Hindi and Telugu in the dictionary and are simply not used here.

### Also noticed — Telugu has no font

`src/app/[locale]/layout.tsx` loads Mukta with `subsets: ["latin", "devanagari"]`. There is no
Telugu subset, and Mukta has no Telugu family member. Telugu text is being rendered in whatever
fallback font the device happens to have. It is legible — but it is not the designed typeface,
and it will look different on every phone. **Choosing the Telugu font is a design decision**, so
it is flagged here rather than guessed at.

---

## What this audit did **not** cover

Honesty about the edges of the measurement:

- **Pages behind a login could not be rendered.** The Supabase database is paused by design, so
  the 115 dynamic pages (account, admin, priest, checkout) were built with no data. Their static
  labels were audited; anything that only appears once real data loads was not.
- **Client-side text that appears after interaction** — validation messages, toasts, error
  banners, drawer contents — is not in the prerendered HTML and is therefore not counted. The
  158 is a floor, not a ceiling.
- **Machine translation was not used and must not be.** These are religious and legal texts.
  A wrong translation of a refund policy or a ceremony name is worse than an English one.

---
---

# Part 2 — the plan

**The migration the handoff describes does not need to be written. It is already there.** What
follows is the plan for the work that genuinely remains, ordered so that the cheapest and safest
things — the ones with no visual change and no new words to write — come first.

Three of the six slices below need **no new translated text at all**. They are plumbing.

## The order, and why

| # | Slice | Size | New words needed? | Risk |
|---|---|---|---|---|
| **1** | Locale-aware sitemap, hreflang and `og:locale` | Small | **None** | **Low** |
| **2** | `Footer.tsx` → the dictionary | Small | 30 phrases × 2 | Low |
| **3** | `AnnouncementBar` + the last header strings | Tiny | 3 phrases × 2 | Low |
| **4** | Date and time formatting | Medium | **None** | Medium |
| **5** | The 13 public pages that translate nothing | Large | ~150 phrases × 2 | Medium |
| **6** | Catalog content (pooja/pandit/product names) | Medium | **None — already translated** | Low |

### Slice 1 — sitemap, hreflang, og:locale *(do this first)*

**Why first:** it is the only item where work already finished is being thrown away. Hindi and
Telugu pages exist, are correctly translated, and search engines are being told they do not
exist. It changes nothing a visitor can see, so it cannot break the look of the site, and it
needs no new words.

Three edits:

1. `src/app/sitemap.ts` — emit every route three times (`/x`, `/hi/x`, `/te/x`) with an
   `alternates.languages` block on each, so Google knows they are the same page in three
   languages rather than three duplicates.
2. `src/app/[locale]/layout.tsx` — add `te` to the `languages` map. It is missing.
3. Same file — `openGraph.locale` currently returns `en_IN` for Telugu. Make it `te_IN`.

**Verification:** the sitemap is a build artifact, so it can be checked directly — count the
URLs before and after and confirm it triples, and confirm each entry carries all three
alternates. No database needed.

### Slice 2 — `Footer.tsx`

Thirty English strings on all 96 pages. Move the `columns` array inside the component and read
each label from the dictionary. The Hindi and Telugu words for most of these already exist in
the dictionary (`nav.*`) — the footer just never asked for them.

**The one real trap:** `columns` is currently a module-level constant, evaluated once when the
file loads. The translator is per-render. Moving it inside the component is required, not
cosmetic — leaving it outside would silently freeze the footer in whichever language rendered
first.

### Slice 3 — `AnnouncementBar` and the header remnants

"🎉 Free delivery on orders over ₹999 — shop today's best deals", "Dismiss announcement",
"Announcement". On every page. Trivial, but note that the promo copy contains a **price** — if
that offer changes the string must change in three places, so it is worth a single dictionary
key with a `{amount}` variable rather than three hardcoded sentences.

### Slice 4 — dates and times

1,038 of the 1,549 findings are this one thing. Nothing passes the locale to
`toLocaleDateString` / `toLocaleTimeString`, so every date and clock time renders in English on
every page in every language.

This is a **medium** risk, not a low one, despite being one helper function: times appear on
invoices, payslips, GST exports and booking confirmations, where the format is not merely
cosmetic. **The formatting used in anything financial or legal must not change** — only the
formatting of times shown to a browsing visitor. That boundary needs drawing carefully before
any code moves.

### Slice 5 — the 13 public pages with no translation at all

`terms`, `privacy`, `refund-policy`, `contact`, `become-a-pandit`, `login`, `auth/reset`,
`blog`, `blog/[slug]`, `live-astrology` (×3), `offline`.

**Three of these are legal documents.** Terms & Conditions, Privacy Policy and Refund &
Cancellation are the contract with the customer. They must be translated by a person who
accepts responsibility for the wording, not by me and not by a machine. Until that person
exists, the correct behaviour is to **leave them in English**, not to publish an approximate
Hindi contract. This is a blocker to be raised, not worked around.

The other ten are ordinary interface copy and can proceed normally.

### Slice 6 — catalog content *(not blocked after all)*

**Originally listed here as blocked pending a decision. It is not.** All 48 poojas are already
translated into both languages, and there are five more `localize*` helpers for products,
pandits, temple pujas, consultations and life events.

The work is to find every surface that renders a catalog name **without** calling its helper and
route it through. Same shape as slice 2, which fixed exactly this in the footer. No new
translations required, and no decision needed.

## What could break — the risk list

| Risk | Where | How likely | What it looks like if it happens |
|---|---|---|---|
| Footer freezes in one language | Slice 2 | **High if the array is not moved inside the component** | Footer shows Hindi to English visitors, seemingly at random |
| A dictionary key is added to English but not Hindi/Telugu | 2, 3, 5 | Medium | The English word appears mid-Hindi-sentence. **`qa/checks.js` already fails on this** |
| Invoice or payslip date format changes | Slice 4 | Medium | GST filings and payslips disagree with previously issued documents |
| Sitemap triples and hits a size limit | Slice 1 | Low | 50,000 URLs is the limit; this goes from ~300 to ~900 |
| A translated string breaks a layout | 2, 5 | Medium | Hindi and Telugu are **longer than English**. Test the longest language at the narrowest width, not the other way round |
| Legal text translated without sign-off | Slice 5 | **Low but severe** | An unenforceable or misleading contract in Hindi |
| `{n}` placeholders not interpolated | 2, 3 | Low | Users see a literal "{amount}". The translator returns its fallback **without** interpolating if the key is missing |
| Telugu renders in a fallback font | Not fixed here | Certain — happening now | Telugu looks different on every device |

## What must be decided before the blocked slices can move

*(Item 1 was "catalog names". It turned out to be already decided and already done — see the
correction above. Three real decisions remain.)*

1. **Legal pages** — who signs off a Hindi and Telugu Terms, Privacy and Refund policy? Until
   there is a name, they stay English. (Blocks 3 of the 13 pages in slice 5.)
2. **Admin console** — translate it at all? 33 of the 66 untranslated pages are staff-only.
   English admin screens are a normal and defensible choice, and skipping them removes half the
   remaining work.
3. **Telugu font** — which typeface? Mukta has no Telugu family member, so this is a new font
   choice, not a configuration change.

## How progress will be measured

Not by reading code. `qa/i18n-audit.js` re-renders all 181 pages in all three languages and
counts what is still English. The numbers to beat, as of today:

```
interface text   158
catalog content  353
times and dates  1038
```

Run `npm run build && node qa/i18n-audit.js` after each slice. A slice that does not move its
number did not work, whatever the code looks like.
