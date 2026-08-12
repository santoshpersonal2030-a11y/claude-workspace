# BookMyPoojari — night shift log, 05-Aug-2026

**Read this file, not the transcript.**

Everything is on a branch on your laptop called **`night-shift-2026-08-05`**, inside
`bookmypoojari\app`. **Nothing was pushed to GitHub. Nothing was deployed. Nothing touched the
database** — it is still paused, exactly as you left it. If you don't like any of this, the whole
branch can be thrown away and nothing is lost.

**24 commits.**

> **This log describes commits 1–19 in detail. Five more landed afterwards, closing the QA gaps
> the earlier work exposed:**
>
> | # | Commit | What |
> |---|---|---|
> | 20 | `4d3dc05` | **Closed the audit blind spot.** Both audits read prerendered HTML only — 65 of 98 page routes were checked by *nothing* while reporting a confident "0 issues". `qa/live-audit.js` covers them against a running server. It found an untranslated dropdown on my own day-old page within a minute. |
> | 21 | `223ab13` | Classified the live audit's findings so "187 phrases" became a work list. **The refactor changed the reported numbers twice and both were my error** — restored, then the classifier itself turned out to be filing 121 astrological proper nouns as "interface text". |
> | 22 | `c6e80c0` | `src/lib/dates.ts` — locale-aware dates, **frozen for invoices, receipts, payslips and GST exports**, which are records rather than reading matter. A check enforces that boundary. |
> | 23 | `07b858b` | `e2e/reflow.spec.ts` — 8 pages × 4 widths in Telugu. **The E2E suite had never been runnable**: it rebuilt inside a 180-second budget against a build that takes minutes. |
> | 24 | `c210ad5` | Fixed the 23px sideways scroll it found. Took three attempts — see below. |
>
> **The reflow fix is worth reading if you read nothing else about these five.** Two wrong answers
> came first: the cart drawer (it is `position: fixed`, which does not extend the page, and
> `overflow-hidden` moved the measurement by *zero* pixels — the second time I blamed it), and
> `min-w-0` alone (correct but insufficient; it changed *which element was reported* while the page
> still scrolled exactly 23px). The real fix needed **both** `min-w-0` — permission to shrink — and
> `break-words` — somewhere to break. A Telugu pooja name has no space in it, so the word itself
> set the minimum width. **Permission to shrink is useless when the content cannot reflow.**
>
> Current gate: tsc clean · lint clean · build success · `qa/checks.js` **128 passed / 0 failed /
> 0 controls broken** · **177/177** unit tests · a11y audit **0 across 198 pages** · reflow suite
> **34/34**.

> **Update — you reversed the parking.** This log started out as an overnight job on a project
> waiting for 2027. You then said: *"i want to build it and keep it and if i get time and people i
> might launch it."* So the last five commits are **new features**, not repairs, and I have
> stopped calling the project parked. `HANDOFF.md` has been corrected too — it still asserted the
> 2027 decision as settled fact, and it is the first thing anyone reads.

---

# THE SIX-PART SUMMARY

## 1. What I BUILT

Three re-runnable test tools, three planning documents, two database migrations written but not
applied, six new unit-tested libraries, **three new features**, and nine real fixes.

| # | Commit | What it is |
|---|---|---|
| 1 | `2b35438` | A safety net — automated checks over the whole app |
| 2 | `73def57` | The Hindi/Telugu audit + a written plan |
| 3 | `e6c1c62` | Made the Hindi and Telugu site findable by Google |
| 4 | `362dab0` | Translated the footer and the promo bar |
| 5 | `8ee976d` | Accessibility fixes + your two parked layout ideas |
| 6 | `eb517da` | Fixed `{amount}` showing on screen — **found in the browser** |
| 7 | `7c0ddbb` | Recorded a blind spot in the accessibility tool |
| 8 | `1798f68` | Stopped every page scrolling sideways on a phone |
| 9 | `39852d2` | The e-commerce gap analysis you asked for |
| 10 | `02f138f` | **Stopped the store overselling** |
| 11 | `5747e7d` | Marked that fixed in the gap analysis |
| 12 | `e175ccf` | **Stopped admin edits corrupting stock** |
| 13 | `4e01541` | Linked the two halves of the stock fix |
| 14 | `9b15088` | **COD + guest checkout** — schema, rules, tests. Wiring blocked on the database |
| 15 | `e936b0e` | The product deep-dive you asked for |
| 16 | `8ec605d` | Corrected the "parked until 2027" premise |
| 17 | `3691c34` | 🆕 **"Find your wedding date"** — the muhurat engine, finally on a page |
| 18 | `70e5de9` | 🆕 **A page per festival**, and the festival calendar translated |
| 19 | `a132540` | 🆕 **The store joined to the calendar** |

## 2. What I TESTED

After every single commit, all four gates:

- **`npx tsc --noEmit`** — does the code make sense
- **`npm run lint`** — is it written to the project's own standards
- **`npm run build`** — does the whole site build, and did the page count drop
- **`node qa/checks.js`** — the checks I wrote, each with a control

Plus, beyond the required gate: the unit tests (**114 when I started, 169 now — I added 55**), a
Hindi/Telugu audit of every rendered page, an accessibility audit of every rendered page, and —
after you asked — **a real browser at five screen widths in two languages.**

You also asked for a **complete QA pass over everything**. That ran: `.next` deleted and rebuilt
from scratch, all four gates, all three audit tools, **the original eight-poison lab re-run
against the now much larger check suite** (all eight still caught — it has not rotted), five
probes aimed specifically at what I had changed, and live interaction tests in a browser. It
found **no defect in the code**. It did find three of my own *checks* misleading me, which is
recorded further down.

## 3. What PASSED

Final state, all green:

| | Result |
|---|---|
| Type check | ✅ clean |
| Lint | ✅ clean |
| Build | ✅ success — **153 route entries.** Was 151; the two new pages account for the change, and nothing was lost |
| `qa/checks.js` | ✅ **102 passed, 0 failed, 0 controls broken** (was 40 when I wrote it) |
| Unit tests | ✅ **169 of 169** (was 113 of 114 when I started; I added 55) |
| Accessibility audit | ✅ **0 issues across 198 pages** (was 189 issues across 181) |
| Browser, 320–1920px | ✅ no sideways scroll, English and Telugu |

**The route count moved twice, and both times the safety net caught it and failed** — once for the
wedding-date page, once for the festival pages. That is exactly what it is for: the number changes
only when someone writes a new one down and says why. **A route disappearing looks identical**,
which is the case it exists to catch.

## 4. What FAILED — what was actually broken when I arrived

**Nine genuine defects.** Seven are fixed. Two are partly fixed and need the database.

| | Defect | Status |
|---|---|---|
| 1 | A unit test had been failing since Telugu was added | ✅ fixed |
| 2 | Google could never have found the Hindi or Telugu site | ✅ fixed |
| 3 | Every page told Google it was a copy of the homepage | ✅ fixed |
| 4 | Telugu missing from the language list; Telugu pages claimed to be English | ✅ fixed |
| 5 | 189 accessibility problems | ✅ fixed |
| 6 | Every page scrolled sideways on a phone; ☰ button clipped | ✅ fixed |
| 7 | **The store could oversell, and the oversell left no trace** | ⚠️ mostly — see below |
| 8 | **Admin edits and cancellations corrupted stock** | ✅ fixed |
| 9 | The footer was English on all 96 pages in all 3 languages | ✅ fixed |

I also introduced one bug myself and fixed it — see "What the browser found".

## 5. What I FIXED

**Search and language**
- The sitemap now lists **351 pages** — every page in all three languages, with 1,404 "same page,
  another language" links. **Your translation work is visible to search engines for the first
  time.** It listed 117 English-only URLs before.
- Every page now declares itself correctly instead of claiming to be the homepage.
- Telugu added to the site's language list; Telugu pages no longer tell WhatsApp they're English.
- **The footer** — five headings and twenty-four links — was hardcoded English on all 96 pages.
  Now translated. The single biggest translation win available.
- The promo bar likewise, which turned out to be permanently English on every non-English page.

**Money and stock — the most serious things found all night**
- **The checkout never checked stock.** Now it does, and refuses before any money moves.
- **An oversell used to erase its own evidence.** Now reported.
- **Admin edits and cancellations silently corrupted stock.** Now they keep it honest.

**Accessibility and layout**
- All 189 accessibility problems.
- Every page used to scroll sideways on a 360px phone with the ☰ menu button clipped off the
  edge. Fixed, down to 320px.
- Your two parked layout ideas from June, both done and both now seen in a browser.

## 6. What RISKS remain

**Read this section even if you skip the rest.** Worst first.

### 🔴 Three things are waiting on the paused database

**Every one of the red items below has the same single cause.** Un-pausing Supabase is the one
action that unblocks all three, and until then no amount of code closes them.

1. 🔴 **Two customers can still both buy the last item at the exact same instant.** The checkout
   now refuses a cart it can't fill, which closes the everyday cases. Closing the final gap needs
   a change inside the database, so I wrote it down instead of applying it:
   `app/supabase/migrations/20260805_stock_reservation.sql`. It is marked **NOT APPLIED** and
   lists the three code changes that must land with it. **Do not apply it piecemeal** — the file
   explains why.
2. 🔴 **COD cannot be switched on — you asked for it, and it is blocked.** Structural, not
   caution: there is no "how was this paid" field anywhere in the database, and no order state
   meaning *"confirmed, cash not yet collected"*. **What needs no database is built and tested** —
   the eligibility and fee rules, shipped switched off. The checkout is untouched.
3. 🔴 **Guest checkout cannot be switched on either.** `user_id` is a *required* field on every
   order and payment, and every security rule says "you may read an order only if it is yours" —
   someone with no account has no identity, so they cannot own an order or read it back. The
   order-access links are built and tested; the checkout is untouched. Both are covered in
   `app/supabase/migrations/20260805_cod_and_guest_checkout.sql`, along with **five decisions only
   you can make.** See "COD and guest checkout" below.

### 🟠 Worth acting on before launch

4. 🟠 **Around 100 Hindi and Telugu phrases are now mine, not a translator's** — up from 34, because
   the three new features needed their own words, and the 17 festival names and blurbs on top.
   ⚠️ **This one grew a lot and it now includes religious proper nouns**, not just menu labels. A
   native speaker should read the appendix before launch.
   **I got three characters wrong writing the Telugu** — a Tamil letter and two Devanagari ones
   inside Telugu words — and **every existing check passed while they were wrong.** There is a new
   check for that class of mistake now, but it is evidence the rest deserve a human read.
5. 🟠 **A green build here does not prove the pages have content.** The database is paused, so
   every page that reads from it was built empty. The app handles that gracefully — the pooja
   catalog falls back to the 48 built-in poojas, which is good design — but nothing behind a
   login was testable, and neither was anything whose content lives only in the database.

### 🟡 Decisions and known gaps

6. 🟡 **Three legal pages are still English** — Terms, Privacy, Refund. Deliberate. They are your
   contract with the customer and need a person who will take responsibility for the wording.
   **A decision waiting for you, not an oversight.**
7. 🟡 **Telugu has no font.** The site loads a typeface covering English and Hindi with no Telugu
   version, so Telugu text renders in whatever font the visitor's phone has. Readable, but
   different on every device. Choosing a font is a design decision, so I left it alone.
8. 🟡 **134 English phrases remain in the interface**, plus dates and times. Down from 158. The
   plan for the rest is in `app/docs/I18N-MIGRATION-PLAN.md`.
9. 🟡 **The store has other gaps for an Indian shop** — no product photographs, no returns flow.
   Full write-up in `app/docs/ECOMMERCE-GAP-ANALYSIS.md`.
10. 🟡 **`SAMAGRI_LEAD_DAYS` is unset, on purpose — so the site promises no delivery date.** It
    needs a real measured number once there is a courier. Until then the countdown works and the
    "order by" line stays hidden. See the store-calendar section.

### 🔵 Housekeeping

10. 🔵 **Your laptop is short of memory.** 7.8 GB total with 0.4 GB free while I worked. A build
    that took 3 minutes at the start took over 10 minutes later. Not a project problem, but it
    will make future work on this slow.

---
---

# THE HEADLINE

**The handoff's number-one pending job was already done.**

`HANDOFF.md` says the biggest outstanding work is full Hindi and Telugu coverage, needing a
migration to an `app/[locale]/` structure with server-side translation — *"Large; its own
effort."*

**That migration is already in the code.** All 96 pages already live under `app/[locale]/`. The
server-side translator already exists and works. The dictionary was already complete: 632 phrases
in English, **632 in Hindi and 632 in Telugu, nothing missing.** All 48 poojas were already
translated into both languages, names and descriptions.

The handoff was accurate about nearly everything and stale about this — exactly as it warned the
README was stale about Supabase.

**So the frightening job was not the job.** The real problems were smaller, different, and nobody
had found them: the site being invisible to Google in two of three languages, and — far more
seriously — a shop that could take money for stock it did not have and leave no record of it.

---

# THE MOST SERIOUS THING FOUND ALL NIGHT

**The store could sell you something it did not have, take your money, and leave no trace.**

Two faults stacked on top of each other.

**One: nothing checked the stock existed.** The checkout asked the database for each product's
price, name and whether it was active — but never for how many were in stock. The only stock
check in the entire purchase path lived in the customer's browser, against a number baked into a
page cached for five minutes. A cart left open for an hour, or an item that sold out after the
page loaded, went straight through to payment.

**Two, and worse: the shortfall erased itself.** Stock was reduced only *after* the money was
taken, by a line that read "subtract the quantity, but never go below zero". Sell three of
something you have one of and all three payments succeed, while the stock afterwards reads a
perfectly ordinary **0**. Nothing anywhere records that two units are owed.

**The money is real and the shortfall is invisible.** That combination is the dangerous part — an
invisible failure cannot be reconciled, refunded, or even counted. You would have found out from
the customer.

**Now:** the checkout reads stock and refuses before a rupee moves, naming what is short and how
many are left, in the customer's own language. If one ever does slip through, it is reported
instead of vanishing.

**Still open:** two people checking out in the same instant. That needs the database, which is
paused. Written up, not applied. See risk #1.

## And the same disease on the admin side

Three admin actions never touched stock at all:

- changing a line's quantity
- deleting a line
- **cancelling a paid order — which lost that stock permanently**

Every correction an admin made pushed the recorded stock further from reality, and that same
number feeds the "only 2 left" badge, the sold-out state, the dashboard's reorder suggestions and
the back-in-stock emails.

Fixed, with two judgement calls made explicitly rather than by default:

- **A cancellation restocks only from `paid` or `packed`.** A cancelled `shipped` or `delivered`
  order does *not* restock — those goods have physically left, and getting them back is a return
  that needs someone to open the box first. Auto-restocking would invent inventory you don't have.
- **An adjustment that would push stock below zero is refused, not clamped.** Silently clamping at
  zero is exactly the bug above.

---

# WHAT THE BROWSER FOUND

You asked to see the pooja pages. Opening the site found **two bugs every automated check had
passed.** This is the clearest evidence the session produced that a green gate is not a working
page.

## Bug 1 — one I introduced, fixed. Commit `eb517da`

The promo bar was printing the literal text **"Free delivery on orders over {amount}"** — curly
brackets visible — on all 96 pages in all three languages.

Nothing caught it. Not the build, the type checker, lint, the unit tests, every check I had
written by that point, or the accessibility audit. And — the interesting one — **not the Hindi/Telugu audit either**, because
that works by finding text identical across languages. The broken text was *equally* broken in
all three, so it looked consistent.

Two causes stacked: the promo bar sits outside the part of the app that knows the current
language, and the fallback used in that situation quietly **threw the ₹999 away** while returning
something that looked like a real answer.

Same shape as the `SafeAreaProvider` bug on IC-38: **a hook outside its provider returns a
plausible default, and a plausible default is indistinguishable from a working one.**

A second thing fell out of the fix: the promo bar had been *permanently English* on every Hindi
and Telugu page for the same reason. It now translates. I had read the earlier "−30 phrases" as
"the footer's 30" — it was exactly the footer's 30, and the promo bar contributed nothing. I did
not notice at the time.

There is now a check that scans every rendered page for a stray `{placeholder}`. Against the
broken build it found `{amount}` on **546 of 548 pages**.

## Bug 2 — pre-existing. You decided; fixed. Commit `1798f68`

**Every page scrolled sideways on a 360px phone**, and the ☰ menu button — the whole navigation
on a phone — was clipped off the right edge.

| | Before | After |
|---|---|---|
| Width a 360px phone needed | **436px** | 360px |
| ☰ button | clipped | fully visible |

The cause was that both sides of the header row were marked "never shrink": the logo block
(171px) and the icon row (232px). Neither would give way, so the page grew instead.

You chose to drop the search icon on phones. That recovered 48 of the 76 pixels; the rest came
from phone-only tweaks — slightly tighter spacing, and the logo and brand name a touch smaller
(36px and 16px, from 40px and 18px). **Above tablet width nothing moves at all**; I checked at
1920 and the header is identical to before.

⚠️ **One thing you should know: the ☰ menu had no search link in it at all.** Dropping the icon
on its own would have made search unreachable on a phone — a worse bug than the one being fixed.
Search is now the first item in the menu, in all three languages.

I also added a backstop so the header can never overflow again at any width in any language.
**That backstop broke something, and measuring caught what looking would not have:** letting the
brand block shrink also let the layout squash the round logo from 40px to 32px and distort the
artwork. The logo is now protected so only text can shrink.

### Measured in a real browser, English and Telugu

| Width | Result |
|---|---|
| **320px** | ✅ No sideways scroll. ☰ reachable. Brand name clips slightly — the backstop working |
| **360px** | ✅ No sideways scroll. Nothing truncated. ☰ fully visible |
| **390px** | ✅ Clean |
| **768px** | ✅ Desktop nav and 🔎 return, ☰ hides — the intended handover |
| **1920px** | ✅ Logo 40px, brand 18px — **desktop exactly as it was** |

320px is the accessibility standard's minimum (WCAG 1.4.10 Reflow) and it now passes.

**My accessibility audit could never have caught this.** It reads the page's HTML; this is a CSS
layout problem that only exists once a page is measured at a width. I have added layout reflow to
that tool's stated blind spots.

---

# TASK 1 — get it building, and build the safety net ✅

**Commit `2b35438`**

**It installs and builds.** Baseline recorded: **151 routes** (96 pages + 49 API routes + 6
others). That number is now the line in the sand.

I made a `.env.local` with **fake values only** — no real keys, and it's gitignored. For a real
run you need exactly two things: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Everything else — Razorpay, WhatsApp, email, push, Sentry, Google — stays off until its key is
set. **That design holds up: the whole app builds and runs with none of them.**

### The safety net — `qa/checks.js`

**74 checks**, about four seconds to run. They do not hunt for new bugs; they **lock in what is
true today** so a future change cannot quietly break it: the 96 pages and 49 API routes, every
page under `[locale]`, all 48 poojas valid, the three storage bucket names, no secret exposed to
the browser, no real API key in the code, Hindi and Telugu at full parity, the sitemap covering
three languages, no page claiming to be another page, no stray `{placeholder}`, the checkout
checking stock, admin edits keeping stock honest, **COD staying switched off until you say
otherwise**, and the KYC form never writing a plaintext ID.

**How I know the checks are real.** A check that cannot fail is decoration. I copied the codebase
to a scratch folder, broke it deliberately, and ran the checks against the broken copy. Every
planted defect was caught. For the later fixes I restored the original files from git and
confirmed the new checks fail against them.

### Verified while I was in there, no change made

The handoff asked someone to check the KYC masking **actually** holds rather than trust the
comment. **It holds.** The code writes an encrypted ID and a masked ID; the raw number is not in
the list of things it saves at all. Without a key the full number is thrown away. Now a locked-in
check. I changed nothing there — KYC hardening was off-limits per your instruction.

---

# TASK 2 — Hindi and Telugu ✅

**Commits `73def57`, `e6c1c62`, `362dab0`**

## How it was measured

**Source-reading is not testing.** A phrase can be in the dictionary and never reach the screen.
So `qa/i18n-audit.js` reads the **181 pages the build actually produces in each language** and
compares them character by character.

| | Then | Now | What it is |
|---|---:|---:|---|
| Interface text | 158 | **134** | English typed into a button or heading — the real work |
| Catalog content | 353 | 352 | Pooja and product names |
| Times and dates | 1,038 | 1,038 | One date-formatting job, not a thousand translations |

## The three wiring faults — the important part

**1. The sitemap was English-only.** 117 URLs, all English, no language links. Google could never
have found the Hindi or Telugu version of any page. **Now 351 URLs with 1,404 language links.**

**2. Telugu did not officially exist.** The "which languages this page comes in" list said English
and Hindi only. Telugu pages also told Facebook and WhatsApp they were English. Both now built
from the language list automatically, so a fourth language cannot silently miss them.

**3. Every page claimed to be the homepage — the worst of the three.** Found while fixing the
others. All 96 pages declared their official address as the site root. To a search engine that
reads as "these are all the same page", which would have kept the site out of the index no matter
how good the sitemap was.

## A wrong conclusion I had to correct

My own audit first said the 353 catalog names "need a decision — transliterate or not". **That was
wrong.** You already decided in June: all 48 poojas are fully translated, and there are five more
helpers doing the same for products, pandits, temple pujas, consultations and life events. The
defect is surfaces that don't use them — the footer was one, hardcoding "Satyanarayan Katha" while
सत्यनारायण कथा sat right there in the catalog. The correction is written into the plan document
rather than quietly edited away.

---

# TASK 3 — accessibility ✅

**Commit `8ee976d`.** `qa/a11y-audit.js`, ten rules over the rendered pages. **189 problems found,
189 fixed, now reporting zero.**

**The global pass mentioned in the handoff was genuinely thorough** — header menu, account menu
and notification bell all had the right markup. What it missed:

- **The cart button, on all 96 pages**, never said whether the cart had opened.
- **The contact form had no labels at all** — five boxes with grey hint text. Hint text is not a
  label: announced inconsistently, and it vanishes the moment you type.
- **The login page had labels on screen attached to nothing.** You saw "Mobile number"; a screen
  reader announced an unnamed box.
- **The wedding package form** had three date fields and three dropdowns with no names — no way to
  tell which ceremony each belonged to.
- Headings in the wrong order on "Become a Pandit".
- The contact form's error was drawn on screen but never spoken.

**A mistake worth recording.** The audit's first version reported **22 blocking defects across 58
pages**, including every field on the priest application form. That form is labelled correctly —
just in a different valid way my rule didn't know. **A rule that calls correct markup a blocker is
worse than no rule, because it buries the six real ones.** Fixed before touching any code. Then,
because "zero problems" is exactly the answer that should not be believed, I planted eight defects
in a copy of a rendered page and confirmed all eight were caught.

**Honest trade:** fixing the forms added six new English labels, which is why interface text is
134 rather than 128. Both forms were already on the translation list.

---

# TASK 4 — your two parked layout ideas ✅

Both done in `8ee976d`, and **both now confirmed in a real browser** in all three languages.

- **The search box sits beside the "Book a Pooja" heading.** On a phone it stacks underneath; from
  tablet width up it shares the line.
- **The pooja card icon is inline beside the name** rather than stacked above it — in all four
  places a pooja card is drawn: the catalog grid, the ceremony sections, the homepage and the city
  pages.

---

# THE E-COMMERCE GAP ANALYSIS — `39852d2`

You asked what a normal e-commerce site has that this doesn't. Full write-up in
`app/docs/ECOMMERCE-GAP-ANALYSIS.md`. The headline: **the gap list is short and what you already
have is not.**

Already built: cart, wishlist, coupons, reviews, back-in-stock alerts, abandoned-cart recovery,
reorder, wallet, loyalty, referrals, related products, image gallery, live stock display, GST
invoices, e-invoicing, e-way bills, credit notes, admin low-stock widget. The GST and e-invoice
work is well beyond what most small stores launch with.

**The five that would cost you money on day one:** no Cash on Delivery · no guest checkout · the
overselling bug (**now fixed**) · **no product photographs at all** · no customer-facing
cancellation or returns.

**The one specific to you rather than generic:** no delivery-date promise. Samagri is bought *for
a ceremony on a fixed date* — a kit arriving the day after the muhurat is worthless, not just
late. Your site already knows the muhurat dates; the store has no idea they exist.

**Also:** `company_settings` is entirely blank — no business name, no GSTIN. The invoicing code is
correct but will print placeholders, and **a GST invoice without a GSTIN is not a valid tax
invoice.** Ten-minute fix, easy to forget because everything works without it.

---

# COD AND GUEST CHECKOUT — `9b15088`

You asked for both. **Neither can be switched on, and the reason is not that I was being careful.**

## Why they are blocked

I checked the database's own record rather than guessing, and both are stopped by the schema:

**Guest checkout.** `user_id` is a *required* field on every order and every payment. And every
security rule on orders, order items and payments says the same thing: *you may read this only if
it is yours.* A visitor with no account has no identity, so they cannot own an order — and could
not read it back even if they could. On top of that, the order confirmation email finds the
recipient by looking the customer up from their account. A guest has no account, so the lookup
returns nothing and **the email is simply skipped — silently.**

**Cash on Delivery.** There is no "how was this paid" field anywhere in the database, and no order
state meaning *"confirmed, cash not yet collected"*. The existing `paid` state cannot be borrowed:
it is the thing that grants loyalty points, settles store credit and pays referral rewards — none
of which may happen before the cash actually exists.

**The database is paused, so I can neither add these nor test them.**

## What I built anyway

The parts that need no database, written and **unit-tested — 21 new tests at the time** (the suite
has since grown to 169):

- **The COD rules** — is cash allowed for this order, and what does it cost? It ships **switched
  off, with an empty list of serviceable pincodes.** There is no delivery-serviceability data
  anywhere in this project, and the right default for a payment method is to offer it nowhere
  until someone says where. Failing closed is the safe direction.
- **Guest order links** — how someone with no account proves an order is theirs, via an
  unguessable link in their confirmation email. The link is stored only as a fingerprint, so a
  leaked database backup contains no working links; it is tied to its own order, so one link
  cannot open somebody else's; and it is checked in a way that does not leak the answer.

**I deliberately did not wire either into the checkout.** It is the money path, none of it can be
run while the database is paused, and payment code that looks finished but has never once executed
is exactly how money bugs reach customers.

## What is waiting for you

`app/supabase/migrations/20260805_cod_and_guest_checkout.sql` — **NOT APPLIED**. It sets out two
ways to do guest checkout and recommends the cheaper one (Supabase's built-in anonymous sign-in),
because it leaves every existing security rule working untouched instead of rewriting them all.
It lists the six code changes needed, and **five decisions only you can make**:

1. The COD order value floor and ceiling
2. The COD fee, if any
3. **Which pincodes get COD** — there is no serviceability data at all today
4. Which of the two guest-checkout routes to take
5. Whether a guest may use a coupon

**One concern worth a sentence, then I'll leave it:** COD brings refused deliveries, and a refused
COD parcel costs you the shipping both ways plus the samagri if it is perishable. That is normal
and manageable, but it needs a way to record it and put the stock back — otherwise inventory
drifts exactly as it did before the admin fix. It is listed in the migration.

---

# 🆕 THE THREE NEW FEATURES

Once you said you wanted to build and keep this, I stopped repairing and started building. You
picked these three off the deep-dive: *"the wedding-muhurat page, festival pages, the store-calendar
join. These are code. They sit on a branch losing nothing."*

## 1. "Find your wedding date" — `/muhurat/find` · commit `3691c34`

**The engine to do this has been sitting in the code since June, switched off.**
`src/lib/muhurat-engine.ts` is 42 KB of real astrological computation, and **thirteen of its
capabilities had no caller anywhere in the app** — including the one that generates auspicious
wedding dates, the one that scores them, and the one that explains why a date fails.

The only thing that ever used it was the **admin** screen, which produces candidates for a human to
publish. The public muhurat page shows only what has been published, and nothing ever was. So the
single most common question in this business — *"which dates are auspicious for my wedding?"* — got
an empty page and a contact form.

It now works: 14 ceremonies, 14 cities, 3/6/12 months ahead, in all three languages, and **every
result links to a pooja you can actually book** (I checked that all 14 ceremony names really are
real poojas rather than assuming it). It computes on the spot and touches no database, so it works
today with Supabase paused. 100–920ms on a production server.

**Three deliberate choices:**

- It does **not** reuse the engine's existing description, which ends *"Computed (strict rules) —
  verify before publishing."* Right for an admin curating a list; wrong for a family reading it.
- **Strict rules always.** Only dates passing every rule appear — never a near-miss dressed up as a
  suggestion.
- **An honesty note on every state of the page, including the empty one.** A computed muhurat
  presented as authoritative is the one way this feature could genuinely harm someone: a wrong
  auspicious date is a ruined ceremony, not a bad search result. The checks assert it renders *and*
  that it exists in all three languages.

⚠️ **Reading the real output caught a content bug.** The very first result had its auspicious
window (12:10–12:52) sitting **inside** Rahu Kalam (11:12–12:31). Abhijit is held to override Rahu
Kalam so the date is not wrong — but showing a recommended time and an "avoid" time that silently
overlap reads as a mistake. The page now says which it means.

## 2. A page per festival — commit `70e5de9`

**51 pages** (17 festivals × 3 languages), each with its own address, all in the sitemap with
language links and with the markup that lets a date appear directly in a search result.

📌 **A correction to what I told you earlier: I said 85 festivals. That is the ROW count.** It is
**17 distinct festivals repeated across five years** (2026–2030). 17 pages, not 85.

**One trap worth knowing about.** Three poojas serve more than one festival — `durga-puja` is both
Navratri *and* Dussehra; `lakshmi-puja` is Diwali, Dhanteras *and* Akshaya Tritiya. Keying the
pages off the pooja would have silently merged five festivals into two URLs. The address comes from
the festival's own name instead, with a test guarding it.

**Festival names had no translation layer at all.** There was no `festivals-i18n.ts`, so they were
English on the Hindi and Telugu calendar and in the reminder messages. Added, matching the five
content-translation files that already existed. Untranslated catalog phrases fell 352 → 332.

⚠️ **Two things only reading the real output caught.** The "around the same time" list first
anchored one end of its window on the festival and the other on *today*, so the Diwali page offered
Krishna Janmashtami — two months earlier — as nearby. Then, once centred, it still dropped
**Govardhan Puja, the day after Diwali**, while keeping Navratri a month before, because it sorted
by date before cutting the list. It now cuts on closeness and only *displays* in date order.

## 3. The store joined to the calendar — commit `a132540`

The two halves of the site did not know each other existed. Two weeks before Ganesh Chaturthi the
store looked exactly as it does in a quiet week, and a pooja page never mentioned the festival it
is performed for.

Now: the store leads with *"Diwali is in 12 days"*; festival pages carry the same countdown; and a
pooja page names the festival it serves — **nearest first, because `lakshmi-puja` serves three**, so
showing only one would be wrong for most of the year.

### ⚠️ The important part is what it does NOT say

I told you a delivery-date promise was the highest-value gap specific to your business. Building
one needs a real dispatch-and-transit time, and **there is no such data anywhere in this project** —
the courier file holds tracking links and nothing else.

So the lead time is a setting called `SAMAGRI_LEAD_DAYS`, and it **ships blank**. With it unset the
site shows the countdown and **promises no delivery date at all.**

That is deliberate, and it is the same rule as COD: fail closed. Samagri is bought for a ceremony
on a fixed date — a kit arriving the day after the muhurat is not late, it is **worthless**. A
family told it will arrive in time does not buy elsewhere, and the ceremony goes ahead without it.
**A missing promise is a gap. A wrong promise built on a number nobody measured is a ruined
ceremony.** Guessing five days would have looked more finished and been worse.

I checked it both ways rather than asserting it: unset → no order-by line in any language; set to 5
→ "order by 3 November" for a Diwali of 8 November. **Silent because it is unconfigured, not
because it is broken.**

**📋 One thing for you:** `SAMAGRI_LEAD_DAYS` is a real number you will need to measure once there
is a courier. Until then this part stays switched off on purpose.

---

# WHAT I DID NOT DO

- **KYC hardening.** Off-limits per your instruction. I only verified read-only that the masking
  holds — it does — and locked that in with a check.
- **Nothing reached GitHub, Vercel, DNS or the database.**
- **No real secrets** written anywhere. Placeholders only.
- **Nothing under `IC38\`** was edited. I read one file there as a style reference, and added one
  entry to the shared `.claude\launch.json` at the workspace root so the site could be previewed —
  that file is outside IC38.
- **Legal pages left in English**, deliberately.
- **Dates and times not touched.** One job, but it reaches invoices, payslips and GST exports
  where format is not cosmetic. That boundary needs drawing carefully.

---

# TEN TIMES A CHECK LIED TO ME

Worth reading, because each one looked exactly like a real finding and would have gone into this
log as fact.

1. **"All 48 poojas have no price."** The field is called `startingPrice`, not `basePrice`. The
   code was right; my check was wrong. **A check that reports EVERYTHING as broken should be
   suspected first.**
2. **"Two i18n defects went undetected."** My test poisons used Unix line endings; the files are
   Windows. Two of eight edits silently changed nothing — which reads *identically* to the checks
   being blind. I nearly recorded a false gap.
3. **"22 accessibility blockers."** Valid markup my rule didn't recognise. It would have buried
   the six real ones.
4. **"All seventeen e-commerce features are missing."** The command was erroring on every one and
   I was reading the error as absence. A control that must return a hit is what caught it. The
   corrected scan then produced false *positives* — "returns present" was the phrase
   `return request.cookies`, "shipping by weight" was `font-weight`.
5. **Two stock checks PASSED against the broken code.** The worst kind. `indexOf` returns −1 for
   something absent, and −1 is less than everything — so "A comes before B" cheerfully confirmed
   the correct ordering of code that did not exist.
6. **"The guest-token test cannot see a real security hole."** Testing the new COD and guest code,
   I deliberately broke both to check the tests would notice. The COD break was caught; the guest
   one appeared not to be. It was the *same mistake as number 2* — my break had silently failed to
   apply, so I was looking at untouched code and calling the test blind. The break now refuses to
   run rather than do nothing. Once applied for real, the test caught it immediately.
7. **"The English pooja pages were never built."** During the full QA pass, my probe looked for
   them in the wrong folder. English lives under `en/`, not at the top. All three languages had
   exactly 181 pages — I checked before believing my own alarm.
8. **"The hamburger menu has no accessibility wiring."** My selector took the *last* button in the
   header — and once the menu opens, that is the Telugu language button, not the hamburger.
   Selecting it properly showed it was correct all along.
9. **Twice, a pattern that could not cross a bracket.** `[^)]*` stops at the first `)`, so a check
   for `Math.min(Math.max(1, Math.floor(x)), MAX)` reported correctly-clamped code as unclamped.
   The same shape had already bitten me earlier in the night on the bucket check. **Second time,
   same cause.**
10. **My own new script check flagged a file that was perfectly fine.** It reported a pile of
    wrong-script letters in the calendar translations — which legitimately carry **seven**
    languages, because the calendar lets a visitor read it in any script. My boundary rule only
    knew three, so the Telugu section ran on through Tamil and Kannada. **A brand-new check's first
    finding deserves the same suspicion as an old one's.**

**And once, the code was wrong and every check passed.** Writing the Telugu festival names by hand
I used a Tamil letter inside one word and a Devanagari letter inside another, twice. Reading it
back did not catch it — the glyphs look near enough right. The key existed, translation parity was
intact, the build was green, the tests passed. Only comparing the actual character codes found it.
That is now check number 100-and-something, and it caught a planted example on the first try.

   A second lesson fell out of that one, and it was careless of me: I had broken **files git did
   not yet know about**, so there was nothing to restore from and I had to reverse both edits by
   hand. Break a copy, or commit first.

The habit that caught all of them: **every check needs a control that must come out the opposite
way**, and a new check must be proven to fail against the old code before it is worth anything.
Three times that habit was nearly defeated by the same thing — a test of a test that quietly did
nothing. **A broken poison and a blind check are indistinguishable from the outside**, so the
harnesses now refuse to run rather than silently change nothing.

Six of the ten were checks *I had just written*. That is the real lesson: **the newest check in the
room is the least trustworthy thing in it.**

---

# APPENDIX — the phrases that need a native speaker

I reused existing wording wherever it existed. These I wrote; they should be checked before
launch. All short menu labels.

| Key | English | Hindi | Telugu |
|---|---|---|---|
| `footer.allPoojas` | All Poojas | सभी पूजाएँ | అన్ని పూజలు |
| `footer.templeEPuja` | Temple e-Puja | मंदिर ई-पूजा | ఆలయ ఇ-పూజ |
| `footer.shop` | Shop | स्टोर | స్టోర్ |
| `footer.poojaKits` | Pooja Kits | पूजा किट | పూజ కిట్‌లు |
| `footer.almanac` | Almanac | पंचांग व ज्योतिष | పంచాంగం & జ్యోతిష్యం |
| `footer.astrologyConsultation` | Astrology Consultation | ज्योतिष परामर्श | జ్యోతిష్య సంప్రదింపులు |
| `footer.dailyPanchang` | Daily Panchang | दैनिक पंचांग | దైనిక పంచాంగం |
| `footer.becomeAPandit` | Become a Pandit | पंडित बनें | పండితులుగా చేరండి |
| `footer.blog` | Blog | ब्लॉग | బ్లాగ్ |
| `footer.contact` | Contact | संपर्क करें | సంప్రదించండి |
| `footer.terms` | Terms & Conditions | नियम व शर्तें | నిబంధనలు & షరతులు |
| `footer.refund` | Refund & Cancellation | रिफंड व रद्दीकरण | వాపసు & రద్దు |
| `footer.madeWithDevotion` | Made with devotion in India | भारत में भक्ति के साथ बनाया गया | భారతదేశంలో భక్తితో రూపొందించబడింది |
| `announce.label` | Announcement | घोषणा | ప్రకటన |
| `announce.freeDelivery` | Free delivery on orders over {amount} | {amount} से अधिक के ऑर्डर पर मुफ़्त डिलीवरी | {amount} పైబడిన ఆర్డర్‌లపై ఉచిత డెలివరీ |
| `announce.shopDeals` | shop today's best deals | आज के बेहतरीन ऑफ़र देखें | నేటి ఉత్తమ ఆఫర్‌లను చూడండి |
| `announce.dismiss` | Dismiss announcement | घोषणा बंद करें | ప్రకటనను మూసివేయండి |
| `cart.stockChanged` | Some items are no longer available… | (Hindi in file) | (Telugu in file) |
| `cart.stockOnlyLeft` | {name}: only {n} left | {name}: केवल {n} बचे | {name}: కేవలం {n} మిగిలాయి |
| `cart.stockSoldOut` | {name} is sold out | {name} बिक चुका है | {name} అమ్ముడైపోయింది |

All in `app/src/lib/i18n.ts`, commented as needing review.

## Added later, with the three new features — ⚠️ the bigger and riskier half

These are **not** menu labels. They include religious proper nouns and a promise about ceremony
timing, and they are the ones most worth a native speaker's eye.

| Where | What | How many |
|---|---|---:|
| `app/src/lib/festivals-i18n.ts` | **All 17 festival names and their one-line descriptions**, in Hindi and Telugu — दीपावली, గణేశ, वसंत पंचमी, వినాయక చవితి and so on | 68 |
| `app/src/lib/i18n.ts` — `mf.*` | The wedding-date finder: headings, labels, quality words (उत्तम / शुभ / సాధారణం), and **the honesty note** | 42 |
| `app/src/lib/i18n.ts` — `fp.*` | Festival pages: "next", "in N days", "upcoming dates", the panchang caveat | 26 |
| `app/src/lib/i18n.ts` — `sc.*` | The store↔calendar banner and the order-by line | 18 |

⚠️ **Two to look at first**, because they are the ones that carry a claim rather than a label:

- `mf.disclaimer` — *"these dates are calculated… always confirm before fixing a ceremony."*
  It is on every state of the wedding-date page and it is what keeps that feature honest.
- `sc.orderBy` — *"order samagri by {date} to receive it in time."* Currently never shown, because
  the lead time is unset. **Check the wording before you set it.**

📌 And the reason this section exists at all: **I put three wrong-script characters into the Telugu
festival names and no check noticed.** They are fixed and guarded now — but that is the argument
for reading the rest.

---

# HOW TO RE-RUN ANY OF THIS YOURSELF

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
npm run build && node qa/i18n-audit.js
```

```bash
npm run build && node qa/a11y-audit.js
```

To see the branch, or throw it away:

```bash
git -C "D:\Desktop\Claude Code\bookmypoojari\app" log --oneline main..night-shift-2026-08-05
```

---

# THE FIVE DOCUMENTS I LEFT YOU

| File | What it is |
|---|---|
| `app/docs/I18N-MIGRATION-PLAN.md` | The Hindi/Telugu audit and a six-slice plan, with the decisions that block work |
| `app/docs/ECOMMERCE-GAP-ANALYSIS.md` | What the store lacks versus a normal e-commerce site, tiered by cost |
| `app/supabase/migrations/20260805_stock_reservation.sql` | ⚠️ **NOT APPLIED** — the database half of the overselling fix |
| `app/supabase/migrations/20260805_cod_and_guest_checkout.sql` | ⚠️ **NOT APPLIED** — everything COD and guest checkout need, plus your five decisions |
| `app/docs/WHAT-ELSE-TO-BUILD.md` | What else this site could become. Three of its ideas are now built; the rest is a live backlog |

---

# SMALL THINGS, NOTED NOT HIDDEN

- `npm install` on Windows makes a one-line change to `package-lock.json` (a Mac-only optional
  dependency). Noise, so I reverted it rather than commit it.
- Both `npm run build` and `npm run dev` need `NEXT_TELEMETRY_DISABLED=1` in this sandbox — Next
  writes a file into AppData on first run and the sandbox blocks it. Now set in `.env.local`.
  **Not a project problem**; it runs fine outside the sandbox.
- I set a git name and email **on this repository only** (`Santosh` /
  `santosh.personal2030@gmail.com`) because commits are impossible without one. Nothing global
  changed.
- Added a three-line exception to the lint config so it doesn't object to `qa/` being plain Node
  scripts rather than app code.
- Added a `bookmypoojari` entry to `D:\Desktop\Claude Code\.claude\launch.json` so the site can be
  previewed. Your two IC-38 entries are untouched.
- The 105 KB pooja catalog is deliberately **not** imported into the footer just to render three
  link names; the three names are duplicated into the dictionary instead. Because a duplicate
  nobody checks is a divergence waiting to happen, `qa/checks.js` asserts they still match the
  catalog in all three languages.
- The admin stock adjustments are read-modify-write and so not atomic. Fair for a screen with one
  or two operators, very different from the public checkout. Stated in the code, and the atomic
  version is in the migration waiting on the database.
