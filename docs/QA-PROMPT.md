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

## 2. THE TEN METHODS, AND WHAT EACH ONE IS BLIND TO

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
| 8 | **Live database read** | service-role `SELECT` over the real rows | What the code *would* do — only what the data *is* |
| 9 | **Behavioural probe** | create a scratch row, act, assert, delete | Anything the probe forgot to assert; leaves debris if it throws |
| 10 | **In-page control** | `javascript_tool`: measure, undo the fix, measure again | Only the one page and viewport you are standing on |

**And one that is not automatable: opening the site and using it.** Every single time that has
been done here it found something every automated method had passed.

### On methods 8–10, added 13-Aug-2026

**8 — read the data, not just the code.** Every product's `gst_rate` read 18% and every
`hsn_code` was empty. No amount of source-reading would have said so: the code was correct and
the *data* was a default nobody revisited. Ask what the rows actually say before believing a
feature works.

**9 — prove a trigger fires by making it fire.** The kit rate calculation was verified by
creating a scratch kit, adding a 5% component (rate followed), adding an 18% one (rate rose),
removing it (rate fell), then changing a component's own rate (the kit followed), and finally
deleting every scratch row and re-counting the catalogue. A migration that runs without error is
not a migration that does the right thing.

**10 — undo the fix in the live page and re-measure.** The only way to know a fix *did* anything.
On 13-Aug-2026 a `min-w-0` was added to stop a `<select>` overflowing at 320px; restoring
`min-width:auto` in the running page changed the scroll width by nothing at all, in English *and*
Telugu. **The fix was reverted.** The reflow "failure" that prompted it had been measured against
a stale server, not the code.

---

## 3. THE TWELVE RULES, EACH PAID FOR

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

### 11. A step that CRASHED is not a step that FAILED
*Paid for 13-Aug-2026:* `tsc` and `eslint` both died with `FATAL ERROR: ... out of memory` while
another build ran on the same machine, and `qa/run-all.js` printed **FAIL** for both — identical
on screen to a genuine type error. Both were clean when re-run alone a minute later. Nearly an
hour went into "fixing" code that was never broken.
⇒ A crash now reports **ERRORED**, never FAILED, and keeps the verdict out of green without ever
claiming the code is wrong. `qa/crashed.js`, with controls in `test/qa-crashed.test.ts` proving a
real type error, lint error and failing test all stay **FAIL** — softening a genuine failure to
"inconclusive" would be the worse bug by far.

### 12. Know WHICH server you just measured
*Paid for the same day:* `npm start` failed with `EADDRINUSE` because another session held :3000.
Playwright's `reuseExistingServer` then silently latched onto **that** server, and 46 reflow tests
passed against a stale build of unknown vintage. The two "failures" that started the whole detour
were from that same stale server — one of them on a page nobody had touched in a day.
⇒ **Check the server is yours before believing a browser result.** Read the start-up log for
`EADDRINUSE`, or run on a port you chose: `PORT=3100 npx playwright test …`. A result from the
wrong server is not a weak result, it is *no* result.

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
