# Launch / Ops Runbook

Going live is **configuration, not code** — the app builds green and is
feature-complete. This is the order-of-operations to deploy `bookmypoojari.com`
on Vercel + Supabase. Pair it with `docs/VERIFICATION.md` (functional checks)
before flipping to production keys.

> Env-var reference: every variable below is documented in `.env.example`.
> `NEXT_PUBLIC_*` is exposed to the browser; everything else is server-only —
> never expose service-role / secret keys with a `NEXT_PUBLIC_` prefix.

---

## 1. Supabase (database, auth, storage)

- **Schema** — the database schema (tables, RLS, enums, functions) is already
  applied to the connected Supabase project. If you stand up a **separate**
  production project, re-apply the same migrations to it before pointing the app
  at it.
- **Storage buckets** used by the app: `kyc-documents` (private),
  `product-images`, `pandit-photos`. Confirm they exist on the target project.
- **Keys** (Project → Settings → API): set `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the server-only
  `SUPABASE_SERVICE_ROLE_KEY`.
- **Auth → URL configuration**: set the Site URL to `https://bookmypoojari.com`
  and add it (and any preview domains) to the redirect allow-list.

### Auth providers
- **Google / Apple OAuth** — enable each under Auth → Providers, paste the
  client id/secret, and add the Supabase callback URL to the provider console.
- **Phone OTP** — handled by a **custom 2Factor.in** flow in the app (not
  Supabase's SMS), so set `TWO_FACTOR_API_KEY` + `SMS_SENDER_ID` (a DLT-approved
  6-char header). Without these, phone sign-in won't send codes.

### First admin
After you've signed in once (so a `profiles` row exists), grant yourself admin:

```sql
update public.profiles
set is_admin = true, admin_role = 'owner'
where email = 'you@example.com';
```

The admin console then lets you manage the rest of the team (`/admin/team`).

---

## 2. Vercel (hosting)

1. Import the GitHub repo into Vercel (Framework: Next.js — auto-detected).
2. Add the environment variables (see §4) for **Production** (and Preview if you
   want previews to work against test keys).
3. Deploy. Builds run `next build`; the app is the standard Next.js output.

### Domain
- Add `bookmypoojari.com` (and `www`) under the Vercel project → Domains.
- Point DNS at Vercel (A/ALIAS or the provided CNAME) at your registrar
  (Hostinger). SSL is issued automatically.
- Set `NEXT_PUBLIC_SITE_URL=https://bookmypoojari.com` so canonical URLs,
  sitemap, robots and OG tags are correct.

### Cron jobs
These routes expect a `CRON_SECRET` Bearer token (set it, then add Vercel Cron
schedules hitting each):

- `/api/cron/abandoned-carts`
- `/api/cron/booking-reminders`
- `/api/cron/recurring-poojas`
- `/api/cron/accounting-export`
- `/api/cron/ewb-expiry`

---

## 3. Payments & payouts

- **Razorpay** — set `NEXT_PUBLIC_RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`
  (test keys first). Add a webhook → `https://bookmypoojari.com/api/razorpay/webhook`
  with `RAZORPAY_WEBHOOK_SECRET`; subscribe to payment capture events. Verify a
  test payment per `docs/VERIFICATION.md §1` before switching to live keys.
- **RazorpayX payouts** (priest payroll) — optional; leave blank to keep payouts
  manual. To enable: `RAZORPAYX_KEY_ID`, `RAZORPAYX_KEY_SECRET`,
  `RAZORPAYX_ACCOUNT_NUMBER`, and a webhook →
  `https://bookmypoojari.com/api/razorpayx/webhook` with
  `RAZORPAYX_WEBHOOK_SECRET` (payout.* events).

---

## 4. Environment variables — what's required vs optional

**Required to launch the core (browse → book → pay → notify):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `KYC_ENCRYPTION_KEY` (`openssl rand -base64 32`) — so pandit KYC IDs encrypt
  rather than store masked-only
- `CRON_SECRET` (if you enable the cron schedules)
- Sign-in: Google/Apple OAuth (in Supabase) and/or `TWO_FACTOR_API_KEY` +
  `SMS_SENDER_ID` for phone OTP

**Recommended:**
- `RESEND_API_KEY` + `EMAIL_FROM` — transactional email (confirmations, invoices)
- `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` — WhatsApp confirmations
- `SENTRY_DSN` — error monitoring (else errors log to the console)
- `NEXT_PUBLIC_COMPANY_*` — real business/GST details on invoices

**Optional (feature-gated; no-ops until set):**
- `RAZORPAYX_*` — automated payouts
- `EINVOICE_*`, `EWB_*` — GST e-invoice / e-way-bill integration
- `GOOGLE_MAPS_API_KEY` — geo-based travel-fee refinement
- `NEXT_PUBLIC_JITSI_DOMAIN` — defaults to free `meet.jit.si`; set to 8x8 JaaS /
  self-hosted for JWT-gated rooms + recording
- `INVOICE_LOGO_PATH`, `ACCOUNTING_EMAIL`, `EWB_ALERT_*`

---

## 5. Pre-launch checklist

- [ ] Production env vars set on Vercel (§4); secrets are **not** `NEXT_PUBLIC_`.
- [ ] Domain live with SSL; `NEXT_PUBLIC_SITE_URL` matches.
- [ ] Supabase Site URL + OAuth redirect allow-list include the live domain.
- [ ] At least one auth method works end-to-end (OAuth and/or phone OTP).
- [ ] Razorpay **test** payment round-trip passes (`VERIFICATION.md §1`), then
      swap to live keys and re-test one real low-value transaction.
- [ ] Webhooks (Razorpay, and RazorpayX if used) reachable and signed.
- [ ] First admin granted; catalog (poojas/products) populated via `/admin`.
- [ ] Cron schedules created (if using reminders / accounting / recurring).
- [ ] Accessibility manual pass done (`VERIFICATION.md §2`).
- [ ] Live video pooja round-trip checked (`VERIFICATION.md §3`) if promoting it.

Once these are green, you're live. 🚀
