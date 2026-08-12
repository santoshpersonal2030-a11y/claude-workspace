# BookMyPoojari — 12-Aug-2026

**Read this file, not the transcript.** It follows `NIGHT-SHIFT-LOG.md` (05-Aug), which is still
accurate about everything it describes.

## ✅ THE BIG ONE: IT IS NO LONGER ONLY ON YOUR LAPTOP

**All 33 commits are on GitHub**, on the branch `night-shift-2026-08-05`. Verified from the code,
not from a success screen: the commit ID on GitHub is byte-identical to the one here.

**`main` is untouched** — still `fee43d5`, exactly as it was. Nothing was deployed, nothing went
near the database, no website changed. The push is a *backup*, not a release.

That was the single biggest risk carried over from 05-Aug, when 24 commits existed in one place
and a disk failure would have ended the project. It is closed.

> 🔑 Your GitHub login is saved now, so the one-time sign-in dance will not repeat. In future
> just say **"push it"**.

**Nine new commits today**, on top of the 24 from the night shift.

---

# THE SIX-PART SUMMARY

## 1. What I BUILT

| # | Commit | What it is |
|---|---|---|
| 25 | `13c549e` | Translated the site-wide header chrome and the fallback page title |
| 26 | `b56041f` | **Translated the ten public pages that translated nothing** |
| 27 | `5bfcc01` | 🚨 **Both audits had never once looked at the homepage** |
| 28 | `a9cfbbb` | Localised the dates — and measured what is actually translatable |
| 29 | `cc752a0` | 🆕 **City × pooja pages** — "Griha Pravesh pandit in Hyderabad" |
| 30 | `315c155` | Translated the twelve moon-sign traits |
| 31 | `e663d1e` | **Finished the dates — 42 translatable date strings down to 1** |
| 32 | `43bd033` | 🚨 **Stopped the invoices inventing a GSTIN**, and took your real seller details |
| 33 | `e0a2476` | Recorded your English-names decision — **the interface work list hits zero** |

## 2. What I TESTED

After every commit: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `node qa/checks.js`,
`npm test`. On anything that changed rendered output: the Hindi/Telugu audit, the accessibility
audit, the browser reflow suite, and **a real browser in all three languages**.

## 3. What PASSED

| | Start of day | Now |
|---|---|---|
| Type check | ✅ clean | ✅ clean |
| Lint | ✅ clean | ✅ clean |
| Build | ✅ 788 pages | ✅ **956 pages** |
| `qa/checks.js` | 128 passed | ✅ **253 passed, 0 failed, 0 controls broken** |
| Unit tests | 177 | ✅ **198** |
| Accessibility | 0 issues / **198** pages | ✅ 0 issues / **255** pages |
| Reflow (real browser) | 34/34 | ✅ **46/46** |

## 4. The translation numbers — the thing you asked for

| | Start | Now | |
|---|---:|---:|---|
| **Interface text** | **134** | **39** | **and all 39 are the three legal pages.** The interface work list is empty |
| Catalog content | 392 | 343 | |
| Times and dates | 995 | 781 | **exactly 1 is still translatable** — the rest are clock times, identical in every language |
| Pages fully translated | **0** | **2** | the first in this project's history |

---

# THE FIVE THINGS WORTH READING

## 🚨 1. The invoices were about to carry a fake GSTIN

You sent me your GST certificate for a "ten-minute job". It turned up something worse than a
missing number.

The code had a GSTIN built in as a fallback: **`29ABCDE1234F1Z5`**. Invented. Three things made
that dangerous rather than merely incomplete:

1. **It passes this project's own GSTIN validator.** Structurally perfect, entirely fictitious.
   No check anywhere could have caught it.
2. **That fallback is used whenever the database is unreachable** — which it is, because the
   project is paused. It was not a theoretical path; it was the only path.
3. **The state was wrong, and the state is not a label.** Your certificate says **Telangana**;
   the code said Karnataka. The seller's state decides CGST+SGST versus IGST, so **every invoice
   would have split the tax the wrong way** — and the totals would still have added up perfectly.

Now: no invented values anywhere. If a detail is missing the invoice prints **"NOT A VALID TAX
INVOICE — missing GSTIN, state"** in words, instead of quietly looking correct.

**Confirmed with you:** BookMyPoojari bills as **PROVIDENT GLOBAL SERVICES** (Ambika Shinde,
proprietorship, Telangana). That is configured. The real values live in `.env.local`, which is
gitignored — a check asserts it stays that way.

**Still blank, because I will not invent them:** support email and phone. Neither is legally
required on a GST invoice, so neither blocks anything.

## 🚨 2. Both audits had never once looked at the homepage

`qa/i18n-audit.js` and `qa/a11y-audit.js` walk `.next/server/app/<locale>/`. Next writes the
locale **root** page to `.next/server/app/<locale>.html` — a *sibling* of that folder.

So from the day they were written, **neither audit had ever checked the most-visited page on the
site, in any language**, while printing a confident *"198 pages compared"* and *"0 issues across
198 pages."* It was hiding seven English phrases.

This is the **second** blind spot of exactly this shape in these tools. Both were *silent about
part of the site while sounding definitive*, so the fix is not just "add the file": **both audits
now refuse to run if the homepage is missing**, rather than quietly reporting a smaller number.

I found it by accident, and only because I distrusted my own scratch script — it disagreed with a
grep of the built Hindi homepage, and it was right about being wrong: it had copied the audit's
own walk.

## 📉 3. The date plan promised more than dates can deliver

`docs/I18N-MIGRATION-PLAN.md` said one helper would close *"almost all"* of the ~1,000 date
strings. **I measured before converting, and it does not.**

| | Count | |
|---|---:|---|
| Contain a real weekday or month name | **236** | genuinely translatable — **235 done, 1 left** |
| Pure clock digits + AM/PM | **757** | **identical in every language** |

The one left is `"Last updated: June 2026"` on the three legal pages you keep in English.
Translating just the date stamp would put a Hindi date inside an English contract.

**Why "1:47 PM" is not translatable:** `Intl` renders it `1:47 pm` for *both* English and Hindi.
Routing the clock through it would have lower-cased the marker for every English visitor and
translated nothing for anyone. The only thing it could change is the digits (१:४७), and
Devanagari numerals are not what Indian panchang sites use — and not my choice to make. A unit
test now says so, in case someone "fixes" it later.

**Finishing the last 41 found five more nobody knew about, including the homepage.** I wrote the
check to catch the *shape* — any file building its own English month or weekday array — rather
than the three places I already knew about, and it immediately named ten files. Five were real
and reader-facing. Four were **correct** and are now an explicit allowlist with a reason each,
because a check that reports everything as broken is the first thing to suspect.

**And the reason none of this glues strings together — Telugu puts the weekday last:**

```
en   Wed, 12 August 2026
te   12, ఆగస్టు 2026, బుధ
```

Building `"{weekday}, {date}"` by hand would have produced fluent-looking nonsense in one of the
three languages, and nothing would have flagged it.

## 📋 4. Four of the five "not built" features were already built

`docs/WHAT-ELSE-TO-BUILD.md` listed five ideas as *"already built, just not surfaced — all
unused"*. I checked each function instead of trusting the list:

| Idea | Reality |
|---|---|
| Which pandits serve my pincode? | ✅ **Already shipped** — a working pincode filter |
| Priest day-planner | ❌ **Correct — genuinely not built** |
| RASHI_TRAITS | ✅ **Already shipped** — but **English only**, a different gap. Now translated |
| Retrograde warnings | ✅ **Already shipped** on the panchang page |
| Per-ceremony date guidance | ✅ Built on 05-Aug, hours after that list was written |

**That list went stale the same night it was written.** Corrected in the document rather than
quietly edited away.

## 🆕 5. City × pooja pages

`/poojas/[slug]/in/[city]` — *"Griha Pravesh pandit in Hyderabad"*, the crossing of two pages
that both already existed. **700 routes**, 14 cities × 50 poojas, in all three languages.

**The risk with this page type is that it is thin** — 700 pages differing only in a swapped city
name are worth nothing and can hurt. So each page carries three things that genuinely differ by
city and are **computed, not templated**: the auspicious dates for that ceremony at that city's
sunrise, that city's panchang today, and the priests serving it. Checks assert all three are
still there.

**⚠️ It will not invent a muhurat.** Only 14 of the 50 poojas have real rules; the other 36 say
the timing is flexible. Verified in a browser.

**Build cost bounded:** the 4 popular poojas × 14 cities are prerendered (788 → 956 pages); the
other 646 routes render on demand and cache for a day.

---

# WHAT THE BROWSER FOUND — again

Opening pages found things every automated check passed. Again.

1. The five auspicious dates read **11 Feb, 8 Feb, 20 Nov, 15 Jan** — which looks broken. The
   engine sorts *best first* deliberately, and the muhurat finder shows a quality badge that
   makes the order legible; this page showed none. Fixed by **showing the tier, not by
   re-sorting**, so the two pages still agree about the same data.
2. The muhurat window rendered **"12:07 – 12:54"** directly above a panchang reading **"5:58
   AM"**. Two clock formats on one page. Both correct; together they read as a bug.
3. Hindi rendered **"21 जून – 22 जुल॰"** — Hindi abbreviates some months and not others, so a
   short range mixes a full name with an abbreviation and reads as a typo. Full months now.
4. On the Hindi pandits page the category **filter** said "जीवन संस्कार" while the **badge** on
   the card below it said "Life Event". Third time those components have drifted.

**And once, a stale server lied.** A leftover process on port 3000 was serving the *old* build, so
every new URL 404'd — including valid ones, which reads exactly like a broken page. Suspecting
the server before the page is the only reason that was thirty seconds and not an hour.

---

# YOUR TWO DECISIONS, RECORDED

**Names stay in English.** Cities and rashis read "Hyderabad" and "Simha" on the Hindi and Telugu
pages, not हैदराबाद and सिंह. Fifteen phrases are now recorded as a *decision* in the audit tool
rather than sitting there forever looking like unfinished work.

**⚠️ Three of them were not names.** "Life Event" and "Home" sat in that list looking exactly like
the proper nouns — they are pooja-category **labels**. Waving them through would have hidden a
real bug behind a real decision, which is how an allowlist stops being worth anything. The tool
now **refuses to start** if a category label is ever allowlisted. Proven by poisoning it and
watching it throw — the first poison silently failed to apply, and the harness refused to claim
anything rather than reporting a pass.

**BookMyPoojari bills as PROVIDENT GLOBAL SERVICES.** Confirmed, and configured.

**The GSTIN in commit `43bd033` stays.** I used the real one as test data — my slip — and replaced
it with a fictional one afterwards, but it remains in that commit's history on GitHub. Offered to
rewrite the history and force-push; Santosh said leave it. **Settled — do not raise again.** It is
public information (searchable on the GST portal, printed on every invoice), and his name and
address are not in the repository.

---

# WHAT I DID NOT DO — and why

- **The three legal pages are still English.** Terms, Privacy, Refund. Your decision, and now
  **asserted by a check**: if one ever starts translating, the gate goes red and someone has to
  say who signed off the wording. **All 39 remaining interface phrases are these three pages.**
- **The priest day-planner is not built.** `scheduling.ts` has four unused functions, but a route
  view is only worth anything against real bookings, and there are none.
- **Retrograde warnings on the booking date picker.** They already exist on the panchang page.
  Adding them to the booking form means putting the 42 KB muhurat engine into the client bundle
  of your most performance-sensitive page. Worth a deliberate decision, not a footnote.
- **Nothing reached Vercel, DNS or the database. No real secrets in any committed file.**

---

# ⚠️ WHAT IS STILL OUTSTANDING — and none of it is code

1. 🔴 **The database is still paused.** It alone blocks the two written-but-unapplied migrations,
   Cash on Delivery, guest checkout, and auditing anything behind a login. One click in Supabase,
   but you paused it deliberately while IC-38 is the live business.
2. 🟠 **Roughly 350 Hindi and Telugu phrases were written by me, not a translator** — this session
   added about 250, including twelve moon-sign personality lines and religious proper nouns. A
   native speaker should read them before launch. That warning is not boilerplate: I once put
   three wrong-script characters into the Telugu and **every check passed at the time.**
3. 🟠 **Product photographs.** All storage buckets are empty. Not a code problem.
4. 🟡 **Support email and phone** — still blank, because I will not invent them.
5. 🟡 **Telugu has no font.** The site loads a typeface with no Telugu version, so Telugu renders
   in whatever the visitor's phone has. Choosing one is a design decision.

---

# HOW TO RE-RUN ANY OF THIS

```bash
cd "D:\Desktop\Claude Code\bookmypoojari\app"
```

```bash
node qa/checks.js
```

```bash
npm test
```

```bash
npm run build && node qa/i18n-audit.js && node qa/a11y-audit.js
```

The reflow suite needs the server started separately:

```bash
npm run build && npm start
```

```bash
npx playwright test e2e/reflow.spec.ts
```
