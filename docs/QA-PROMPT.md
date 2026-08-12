# The QA prompt

**To run QA, paste the block in [§1](#1-the-prompt) to Claude.** Everything after it is the
reasoning — read it once, then don't bother again.

For the fast version, run this yourself:

```bash
node qa/run-all.js --full
```

It runs every gate in order and prints one verdict: **GREEN** (everything ran and passed),
**AMBER** (everything that ran passed, but not everything ran) or **RED**. It will not say green
when a step was skipped, because on this project a silent skip has hidden real bugs three times.

---

## 1. THE PROMPT

> Do a full QA pass on bookmypoojari.
>
> **Run `node qa/run-all.js --full` first** with `npm start` up in another terminal. That is the
> floor, not the ceiling — a green run means the automated gate passed, nothing more.
>
> Then do the things the gate cannot:
>
> 1. **Open the site in a real browser** and use it: book a pooja, add to cart, switch to Hindi
>    and Telugu, open a receipt. Opening a browser has found a bug every single time it has been
>    tried on this project, on pages the gate called clean.
> 2. **Check the database, not the screen.** If a form said "success", go and look for the row.
> 3. **Re-read anything you changed as a stranger would.** Numbers in a sensible order? Dates and
>    money formatted the same way in every block? Two names for one thing?
> 4. **Pick two checks and try to fool them.** Break the code they guard and confirm they fail.
>    If a check cannot fail, it is decoration.
>
> Report in six parts: what you **BUILT**, what you **TESTED**, what **PASSED**, what **FAILED**,
> what you **FIXED**, what **RISKS** remain. Lead with what it means, not how it works.
>
> **Rules that are not negotiable:**
> - Never report a number you did not just measure.
> - Never call something verified that you could not reach. Name it as unreachable instead.
> - If a check fails, suspect the check before the code.
> - Never invent a fact, count, price or date. Fail closed and say what is missing.

---

## 2. THE SEVEN METHODS, AND WHAT EACH ONE IS BLIND TO

No single method here has ever been sufficient. Each row's **blind spot** column is a bug that
actually shipped.

| # | Method | Command | Blind to |
|---|---|---|---|
| 1 | **Types** | `npx tsc --noEmit` | Anything that is valid code and wrong behaviour |
| 2 | **Lint** | `npm run lint` | Everything about whether it works |
| 3 | **Unit tests** | `npm test` | Whether the tested function is ever *called* |
| 4 | **Static checks** | `node qa/checks.js` | Anything that only exists once rendered |
| 5 | **Rendered-page audits** | `qa/i18n-audit.js`, `qa/a11y-audit.js` | Dynamic routes; anything behind a login; anything behind a click; **layout** |
| 6 | **Live audit** | `qa/live-audit.js` | Still not logged in. Still not measured at a width |
| 7 | **Real browser** | `npx playwright test e2e/reflow.spec.ts` | Only the pages and widths someone listed |

**And one that is not automatable: opening the site and using it.** Every single time that has
been done here it found something all seven had passed.

---

## 3. THE TEN RULES, EACH PAID FOR

### 1. Every check needs a control that must come out the opposite way
A check that cannot fail is decoration. `qa/checks.js` prints `ctrl` lines for exactly this.
*Paid for:* two stock checks passed against code that did not exist, because `indexOf` returns
−1 and −1 is less than everything.

### 2. A new check must be proven to FAIL against the old code
```bash
git archive HEAD | tar -x -C /tmp/old && cp qa/checks.js /tmp/old/qa/ && node /tmp/old/qa/checks.js /tmp/old
```
If it passes against the unfixed code, it is not testing your fix.

### 3. When a check fails, suspect the check first
Ten times on this project a check lied, and **six of those were checks written minutes earlier.**
The newest check in the room is the least trustworthy thing in it.

### 4. A poison that silently does nothing is indistinguishable from a blind check
Harnesses must **refuse to run** rather than quietly change nothing. Line endings caused this
more than once: patterns spanning a newline match zero times in a CRLF file, and zero matches
looks exactly like a passing check.

### 5. Source-reading is not testing
A phrase can be in the dictionary and never reach the screen. Ground truth is the rendered page.

### 6. A green gate is not a working page
Opening a browser has found a bug every time it has been tried here.

### 7. A success screen is not proof of a row
Go and look in the database. A sister project once showed a success screen with no row behind it.

### 8. A plausible default is indistinguishable from a working one
*Paid for:* a fake GSTIN that **passed this project's own GSTIN validator**, and would have
printed on a real tax invoice. Also a hook outside its provider returning zero insets, and a
`{amount}` placeholder that threw the value away while looking like a real answer.

### 9. Never invent a fact, count, price or date — fail closed
`SAMAGRI_LEAD_DAYS`, COD serviceability, the samagri GST rate and the WhatsApp number all ship
**unset**, and the site says nothing rather than something plausible. A missing promise is a gap;
a wrong promise built on a guessed number is a ruined ceremony.

### 10. A tool that is silent about part of the site is worse than no tool
*Paid for three times:* both audits skipped **65 dynamic routes**; both skipped **the homepage**
for weeks while printing "0 issues across 198 pages"; and both reported a clean store while the
database was empty and **216 accessibility failures** had no pages to appear on.
⇒ **Whenever data changes, re-run everything.** Connecting the database changed three numbers.

---

## 4. THE SIX-PART REPORT

Every QA pass ends with these, in this order:

1. **BUILT** — what changed
2. **TESTED** — which of the seven methods actually ran
3. **PASSED** — numbers, freshly measured
4. **FAILED** — what was genuinely broken
5. **FIXED** — and how it was proven fixed
6. **RISKS** — worst first, including *what could not be reached*

**A number without a measurement behind it is worse than no number.** If a step did not run, it
goes in RISKS as unreachable — never in PASSED.

---

## 5. WHAT STILL CANNOT BE QA'D HERE

State it every time rather than letting a clean report imply coverage:

- **Anything behind a login** unless someone is signed in — account, admin and priest pages
- **Colour contrast, focus order, and screen-reader behaviour** — no tool here covers these
- **Payment**, end to end. Razorpay has never taken a real rupee on this project
- **Email and WhatsApp delivery** — no key, no send
- **iPhone and Safari.** Only Chromium is driven here
- **The Hindi and Telugu wording itself.** ~350 phrases were written by Claude, not a translator.
  Three wrong-script characters once passed every check
