# BookMyPoojari — autonomous work order

Paste everything inside the fence below into a **new Claude Code session** whose working folder is
`D:\Desktop\Claude Code`. Set the permission mode to **Accept edits** before you send it.

---

```
> ⚠️ **HISTORICAL RECORD — the work order exactly as written on 04-Aug-2026, left unedited on
> purpose.** One thing in it is now stale: the handoff documents it names lived in
> `bookmypoojari\` and were moved into `bookmypoojari\app\docs\` on 12-Aug-2026, so that they are
> backed up to GitHub along with the code. For the current state read
> `app/docs/SESSION-12-AUG.md`.

Work on bookmypoojari. Read D:\Desktop\Claude Code\bookmypoojari\HANDOFF.md first — it is the
complete picture of this project and it is accurate as of 04-Aug-2026.

STANDING AUTHORISATION — do not ask me for these, they are pre-approved:
- Reading, creating and editing any file under D:\Desktop\Claude Code\bookmypoojari\
- Running npm install, npm run build, npm run lint, npm test, npx tsc, npx playwright
- Creating git branches and committing to them inside bookmypoojari\app
- Creating and running your own QA scripts

DO NOT DO ANY OF THESE, ever, without asking:
- git push, opening a pull request, merging to main, or anything that reaches GitHub
- Any deployment, Vercel connection, or DNS change
- Anything touching the Supabase database. It is PAUSED and out of reach by design. If a task
  seems to need it, stop and write down what you needed and why.
- Writing real secrets into any file. Placeholders only.
- Editing anything under D:\Desktop\Claude Code\IC38\ — that is a separate live business.
- Deleting files you did not create.

HOW I WANT YOU TO WORK
- Do not stop to check in. Work continuously through the task list below. A "go ahead" from me
  covers the whole job.
- Break every task into pieces small enough to verify. Commit each piece separately with a clear
  message on the branch night-shift-<date>.
- After EVERY piece, run the QA gate (below). If it fails, fix it before moving on. Never leave the
  branch in a state where the build is red.
- If you get genuinely blocked, do not guess and do not sit idle: write the blocker into
  bookmypoojari\NIGHT-SHIFT-LOG.md, skip that piece, and move to the next one.
- Keep a running log in bookmypoojari\NIGHT-SHIFT-LOG.md: what you did, what passed, what failed,
  what you skipped and why. I will read this in the morning, not the transcript.

THE QA GATE — run all of it after every piece, no exceptions
1. npx tsc --noEmit          → must be clean
2. npm run lint              → must be clean
3. npm run build             → must succeed, and the page count must not DROP from the baseline
4. node qa/checks.js         → your own checks (you create this in Task 1), must be all green
Record the result of all four in the log with the commit hash. A piece is not done until all four
pass. If you cannot make them pass, revert that piece and log why.

RULES THAT COST US HOURS ON THE SISTER PROJECT — apply them here
- Every check you write needs a CONTROL that must give the OPPOSITE answer, or the check is
  decoration. Prove a new check FAILS against the code before your fix, then passes after.
- When a check fails, suspect the check first.
- Source-reading is not testing. For anything user-visible, the ground truth is the rendered
  output, not the source.
- Never invent a fact, a count or a price. If the code says 48 poojas, it is 48 — do not round it,
  do not improve it, do not copy a number from a design or a README. The README in this repo is
  STALE (it says Supabase is "planned"; it is fully built) — trust the code, not the docs.
- A green build can still ship nothing. Compare output size/page count before believing success.

THE TASK LIST — in this order

TASK 1 — Get it building, and build the safety net. (Do this first; everything depends on it.)
  1a. cd bookmypoojari\app, npm install.
  1b. Copy .env.example to .env.local. Fill ONLY placeholder values — no real keys. Note in the log
      which variables would be needed for a real run.
  1c. Get npm run build to succeed. Record the page count as the BASELINE in the log. If the build
      genuinely cannot succeed without live Supabase credentials, stop Task 1, log exactly what
      failed, and skip to Task 2 doing source-level work only.
  1d. Create qa/checks.js — a re-runnable script in the style of IC38\qa\app-checks.js. Seed it with
      checks that lock in what is already TRUE, so a regression is caught: route count, the 48-pooja
      catalog is intact, the three storage bucket names are unchanged, no NEXT_PUBLIC_ prefix on any
      secret-shaped variable, no hardcoded API key anywhere. Each with a control.
  1e. Commit. Run the QA gate.

TASK 2 — Pending item #1 from the handoff: full Hindi/Telugu coverage. THIS IS THE BIG ONE.
  The current i18n is a CLIENT provider, so server components cannot translate. The handoff calls
  the fix "large; its own effort". Do NOT attempt it in one go.
  2a. Audit only — no code changes. Produce bookmypoojari\docs\I18N-MIGRATION-PLAN.md listing every
      file that renders user-facing text, marked server or client, and which ones are currently
      untranslatable. Include a count. Commit.
  2b. Propose the concrete migration in that same doc: the app/[locale]/ route segment, server-side
      dictionaries, generateStaticParams per locale, locale-aware metadata/sitemap/html lang.
      Include the risk list and what could break. Commit. DO NOT start implementing yet.
  2c. Only if 2a and 2b are complete and the gate is green: implement the smallest possible first
      slice — one route moved under [locale], server-rendered, in all three languages, with the
      other routes untouched and still working. Commit. Gate.
  2d. Then extend one route group at a time, gate after each. Stop when you run out of work or hit
      something that needs a decision, and log it.

TASK 3 — Pending item #2: accessibility.
  Per-component sweep. The handoff says a global pass is already done, so find what the global pass
  missed: aria on drawers and dropdowns, contrast, alt text, keyboard traps, focus order. Fix in
  small commits, gate after each. Log anything you cannot fix without a design decision.

TASK 4 — The two layout ideas he parked in June (he said "abort the above let me think"):
  4a. Poojas page: move the search box up beside the "Book a Pooja" heading.
  4b. Pooja cards: emoji icon inline beside the name rather than stacked, everywhere it makes sense.
  These are small. Do them last, and only if the gate is green.

DO NOT TOUCH — Task 3 in the handoff is KYC hardening. It involves real Aadhaar and PAN numbers.
Leave it alone. It needs a decision from Santosh, not an overnight change.

WHEN YOU RUN OUT OF WORK OR TIME
Write a 6-part summary at the top of NIGHT-SHIFT-LOG.md: what you BUILT, what you TESTED, what
PASSED, what FAILED, what you FIXED, and what RISKS remain. Then stop. Do not push anything.

Santosh is non-technical. Write the log in plain English — lead with what it means, not how it
works. Start now and keep going.
```

---

## Notes for Santosh

**Before you paste it:** open a new Claude Code session with the folder set to
`D:\Desktop\Claude Code`, and switch the permission mode to **Accept edits** — the prompt says
permissions are pre-approved, but only that setting actually stops it pausing to ask.

**In the morning, read one file:** `bookmypoojari\NIGHT-SHIFT-LOG.md`. Not the transcript.

**Nothing it does can reach the outside world.** No pushing to GitHub, no deploying, no database.
Everything stays on a branch on your laptop, and the branch is easy to throw away if the work
isn't good.
