# BookMyPoojari — handoff, captured 04-Aug-2026

Everything known about this project, gathered from the GitHub repo, the Supabase
database, the live domain, and the six Claude browser conversations. Written
because the work was done in the **browser**, not in Claude Code, so none of it
existed on this laptop until today.

---

## The one-line summary

**The code is finished. Nothing is switched on.**

A complete, two-sided marketplace — book verified pandits for ceremonies, plus an
e-commerce store for pooja samagri — built in a seven-day sprint in June and
untouched since. It has never been deployed, never taken a booking, and never
had a user other than Santosh.

Its own runbook puts it best:

> *"Going live is **configuration, not code** — the app builds green and is
> feature-complete."*

---

## Where everything lives

| What | Where |
|---|---|
| Code | `bookmypoojari/app/` (cloned 04-Aug from GitHub) |
| GitHub | `github.com/santoshpersonal2030-a11y/claude-workspace` |
| Database | Supabase project `bookmypoojari` (`jhazmjakhelytdluoqvg`), Mumbai |
| Domain | `bookmypoojari.com` — owned, on Hostinger |
| Hosting | **none — never deployed** |
| Conversations | claude.ai → "Bookmypoojari" group, 6 sessions |

⚠️ **The repo is named `claude-workspace`, not `bookmypoojari`.** It is the right
repo — HEAD matches the last commit discussed in the handoff conversation.

---

## Build history

- **193 commits, 19–25 June 2026.** Seven days. Nothing since — six weeks cold.
- 22 pull requests, all merged to `main`. HEAD = `fee43d5`.
- Six `claude/*` branches still on the remote; `main` is what matters.
- Database schema applied over the same window: **78 migrations, 19–24 June.**

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind 4 · Supabase (Postgres + Auth +
Storage) · Razorpay + RazorpayX · 2Factor.in phone OTP · Vercel (intended) ·
Capacitor + Bubblewrap TWA for the app stores.

**96 pages · 49 API routes · 42 tables · 197 database functions · 62 security policies.**

---

## What is built

Bookings with priest assignment, event history, messages and disputes · pooja
catalog (48) · ceremonies · temple pujas · recurring pooja subscriptions ·
muhurat windows and peak days · full Gun-Milan matrices · samagri store with
cart, wishlist, coupons, reviews and stock alerts · wallet, referrals and
loyalty with refund-to-credit · Razorpay payments and RazorpayX priest payouts ·
payroll runs · GST-accurate invoicing and credit notes · priest self-onboarding
with KYC · admin console with owner/manager/support roles · revenue, funnel and
priest analytics · blog CMS · review moderation · per-booking realtime chat and
support inbox · live astrologer sessions over Jitsi · PWA with offline page,
install prompt and web push · Sentry · Playwright E2E · six scheduled cron jobs.

**Three languages — English, Hindi, Telugu** (partial; see below).

---

## What is NOT done

**Nothing is deployed.** `bookmypoojari.com` currently serves
`<title>Parked Domain name on Hostinger DNS system</title>`. Vercel has never
been connected. The "deploying" language in the old conversations referred to
Claude's own preview, not a public site.

The handoff's own pending list, in its stated order:

1. **Full Hindi/Telugu coverage** — the current i18n is a *client* provider, so
   server-rendered components can't translate. Needs migrating to an
   `app/[locale]/` route segment with server-side dictionaries. Its own note:
   *"Large; its own effort."*
2. **Full accessibility audit** — per-component sweep. A global pass is done.
3. **KYC hardening** — see the security note below.

Plus one-time configuration: Sentry DSN, Razorpay keys, Email+Apple providers in
Supabase Auth, Playwright chromium in CI, and merging PR #1.

### Two parked layout ideas (he asked, then said *"abort the above let me think"*)
- Poojas page: move the search box up beside the "Book a Pooja" heading.
- Pooja cards: emoji icon inline beside the name rather than stacked.

---

## 🔐 Security note — read before anyone real signs up

An old session flagged `pandit_applications.id_number` as **plaintext in a
service-role-only table**. The current `.env.example` shows this was then designed
safe-by-default:

> *"Leave blank to keep KYC dormant — applications then store only a masked ID,
> never the full number in plaintext."*

So: **safe today, because `KYC_ENCRYPTION_KEY` is unset and no priest has
registered.** But the moment KYC goes live it must be set to a real 32-byte key —
these are Aadhaar and PAN numbers of real people. Verify the masking actually
holds before the first priest onboards; do not take the comment's word for it.

---

## Database state

Seeded but never used: **48 poojas · 12 products · 6 pandits · 6 live-astrologer
rows · 1 profile** (Santosh's, 24-Jun).

Zero of everything that matters: **0 bookings, 0 orders, 0 payments, 0 payouts.**
All three storage buckets (`product-images`, `pandit-photos`, `kyc-documents`)
hold **0 files** — no product photos, no priest photos.
`company_settings` is entirely blank — no business name, no GSTIN, no UPI.

🔴 **This project shares the Supabase organisation that was restricted on
03-Aug-2026** ([[ic38-supabase-restricted]]). Its keys returned HTTP 402 like
IC-38's. Nobody noticed because nothing points at it.

## ⏸️ PAUSED — 04-Aug-2026

Paused on Santosh's instruction: *"lets hold it completely"* until IC-38 is live.
A paused project keeps all its data and costs nothing; **Restore** in the
dashboard brings it back.

**It was backed up first — see `backup/`.** This mattered more than it looks:
`supabase/migrations/` in the repo holds **one** file, while the live database
had **78 migrations, 42 tables, 197 functions and 62 policies** applied directly
and never committed. The schema existed in exactly one place. It is now in two.

⚠️ The backup is a JSON description of the schema, **not a `pg_dump`**. When the
project is next reachable, take a real dump and keep it beside those files.

---

## Running it locally

```bash
cd "D:\Desktop\Claude Code\bookmypoojari\app"
npm install
cp .env.example .env.local     # then fill in the Supabase keys
npm run dev                    # http://localhost:3000
```

Only the three Supabase variables are required. Everything else — Razorpay,
WhatsApp, email, push, analytics, Sentry — is written to stay **dormant until
its key is set**, which is why the app builds and runs with almost nothing
configured.

⚠️ `AGENTS.md` warns that this is **Next.js 16**, whose APIs differ from older
versions: *"Read the relevant guide in `node_modules/next/dist/docs/` before
writing any code."*

---

## Honest assessment

The hard part is done and it is genuinely substantial — more surface area than
IC-38. What stands between this and a live business is not engineering: it is a
Vercel account, DNS, payment keys, real photographs, real priests, and a
company name in a settings row.

~~But per the 04-Aug decision, **this waits for 2027.** IC-38 is 2026's only
project. Code written now for a 2027 launch would drift for a year and need
redoing. It is captured here so nothing is lost — not so it can be resumed.~~

---

## ⚠️ SUPERSEDED — 05-Aug-2026

**The paragraph above is struck through because the decision was reversed the
next day.** Santosh: *"i want to build it and keep it and if i get time and
people i might launch it."*

**This project is active.** Build it properly and keep it launch-ready. The
launch itself is still conditional on time and people — but the code is live
work, not an archive.

Two other things on this page are now out of date, and both matter more than the
2027 line:

1. **The pending list above is stale.** Item 1 — the `app/[locale]/` migration
   with server-side dictionaries, described as *"Large; its own effort"* — **was
   already done.** All 96 pages were already under it, `getDictionary()` already
   worked, and the dictionary was already at full parity in all three languages.
   The same warning this document gives about the README applies to its own
   pending list: **trust the code, not the list.**
2. **Item 2, accessibility, is done** (189 issues found and fixed, 05-Aug).
   Item 3, KYC hardening, is untouched and still needs a decision — though the
   masking this document asked someone to verify **was verified and does hold**.

**Start here instead:** `app/docs/NIGHT-SHIFT-LOG.md` — 15 commits on the
branch `night-shift-2026-08-05`.

**⚠️ Two corrections, 12-Aug-2026.** These four handoff documents used to live in
`bookmypoojari\` and were moved into `app/docs/` so they are backed up to GitHub
alongside the code — every path in older notes pointing at the old location is stale.
And "none of it pushed" is no longer true: the branch is on GitHub. The newest state
is in `app/docs/SESSION-12-AUG.md`.

Related: [[project_ic38]] · [[ic38-supabase-restricted]] · [[ic38-db-backup]]
