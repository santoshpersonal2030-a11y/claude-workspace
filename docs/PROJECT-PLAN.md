# BookMyPoojari — Project Plan

> **Last updated:** 2026-06-24. The roadmap checkboxes below reflect the
> **actual state of the codebase**, not the original aspirational plan. See
> [§4b Current status](#4b-current-status-at-a-glance) for the summary.
>
> **Legend:** `[x]` built & in the codebase · `[~]` partial / in progress ·
> `[ ]` not started · 🔧 = code is done, needs configuration/credentials or an
> external (ops) step to go live.

## 1. Vision

A trusted platform where families can **book verified Hindu priests
(Pandits/Poojaris)** for any ceremony and **order authentic pooja samagri**,
delivered to their door. It combines a **service marketplace** with an
**e-commerce store**.

## 2. Users

- **Customers / devotees** — browse poojas, book a Pandit, buy samagri, pay, track.
- **Pandits / Poojaris** — receive bookings, manage availability, get paid.
- **Admin (owner)** — manage catalog, pandits, orders, payouts, content.

## 3. Tech stack

- **Next.js 16** (App Router, TypeScript) — the website + app
- **Tailwind CSS 4** — styling / design system
- **Supabase** — Postgres database, authentication, file storage
- **Razorpay** + **RazorpayX** — payments (UPI-first, India) + vendor payouts
- **Twilio / WhatsApp + SMS + email** — booking confirmations & notifications
- **Vercel** — hosting (auto-deploys from GitHub)
- **Hostinger** — domain (bookmypoojari.com) + email

> Decision: start on Vercel for speed and zero maintenance. The code lives in
> GitHub and can be migrated to a Hostinger VPS later if full control is needed.

## 4. Phased roadmap

### Phase 1 — MVP / Launch  ✅ complete
- [x] Project scaffold (Next.js + Tailwind)
- [x] Brand + design system (saffron / maroon / gold)
- [x] Homepage
- [x] Pooja catalog listing page (`/poojas`)
- [x] Pooja detail + booking page (`/poojas/[slug]`)
- [x] Samagri store (`/store`) + product pages (`/store/[slug]`)
- [x] Cart & checkout
- [x] Supabase database (profiles, poojas, bookings, products, orders, payments, …)
- [x] Authentication — phone OTP, Google & Apple OAuth, email/password 🔧 *(enable
      providers + OTP credentials)*
- [x] Razorpay payments (checkout, verify, webhook) 🔧 *(live API keys)*
- [x] Booking confirmation via WhatsApp / SMS / email 🔧 *(Twilio/WhatsApp creds)*
- [x] Admin dashboard (poojas, products, bookings, pandits, and much more)
- [x] Legal pages: Terms, Privacy, Refund & Cancellation, Contact
- [ ] Connect domain (bookmypoojari.com → Vercel) 🔧 *(ops / DNS)*

### Phase 2 — Marketplace & growth  ✅ largely complete
- [x] Pandit self-onboarding (`/become-a-pandit` → applications → KYC review)
- [x] Pandit availability calendar + priest portal (availability, calendar, messages, payslips)
- [x] Payouts (RazorpayX) + full payroll (compensation, runs, year-end) 🔧 *(RazorpayX creds)*
- [x] Ratings & reviews, verified badges, review moderation
- [x] Booking disputes handling
- [x] Multi-language (English + Hindi)
- [x] Coupons, referrals, rewards, wallet / store credit
- [x] Blog / SEO engine
- [x] Almanac/astrology content: muhurat, panchang, choghadiya, gun-milan, festivals

### Phase 3 — Differentiation  ✅ largely complete
- [x] Virtual / live pooja over video (embedded Jitsi; customer + assigned Pandit join in-app)
- [x] Astrology & muhurat **consultation booking** (paid 1:1, phone or video)
- [x] Subscriptions (recurring poojas) + corporate / bulk booking packages
- [ ] Mobile app — *(PWA shell exists: service worker + offline page)*

### Shipped beyond the original plan
- [x] **GST compliance suite**: e-invoice (IRN), e-way bills, GSTR-1 / GSTR-3B exports, credit notes
- [x] **Automation crons**: abandoned carts, booking reminders, recurring poojas, accounting export, e-way-bill expiry
- [x] Role-based admin team (owner / manager / support) with per-capability gating
- [x] Peak-day surge pricing, coverage map, priest analytics
- [x] **Site-wide search** across poojas, store, consultations, pandits & blog
- [x] Accessibility pass: labels, contrast (WCAG AA), landmarks, live regions, table semantics
- [x] KYC ID encryption at rest + audited reveal

## 4b. Current status at a glance

**The product is essentially launch-ready and well into growth features.** What
remains before go-live is mostly **configuration / ops, not code**:

| Area | State |
|---|---|
| Customer storefront (poojas, store, cart, checkout) | ✅ Built |
| Payments (Razorpay) + payouts (RazorpayX) | ✅ Built · 🔧 needs live keys |
| Auth (OTP / Google / Apple / email) | ✅ Built · 🔧 enable providers |
| Notifications (email / SMS / WhatsApp) | ✅ Built · 🔧 needs credentials |
| Admin console (catalog, orders, payroll, GST, content, team) | ✅ Built |
| Pandit marketplace (onboarding, KYC, portal, payouts) | ✅ Built |
| i18n (en + hi), rewards, blog, almanac | ✅ Built |
| Consultations + live video poojas (Jitsi) | ✅ Built · 🔧 optional JaaS domain |
| Site-wide search | ✅ Built |
| Accessibility verification (screen-reader / keyboard) | ~ Manual pass pending |
| Domain, env keys, provider enablement | 🔧 Ops |

### Remaining to launch (ops / config — not code)

> Full step-by-step runbook: **`docs/LAUNCH.md`**.

- Connect `bookmypoojari.com` → Vercel (DNS, SSL auto)
- Set production env keys: `KYC_ENCRYPTION_KEY`, `SENTRY_DSN`, Razorpay & RazorpayX keys, OTP/WhatsApp/SMS/email provider credentials
- Enable Supabase auth providers (Google/Apple/phone)
- Complete the manual accessibility pass (screen-reader + keyboard walkthrough; see `docs/` TODO)

### Candidate next builds (product)
- **Mobile:** turn the PWA shell into an installable app (push notifications, home-screen install prompts); native wrapper later
- **Growth:** richer booking-status tracking/timeline; analytics & conversion funnels; SEO structured-data + performance pass
- **Trust:** finish the manual accessibility verification (`docs/VERIFICATION.md`)
- **Video polish:** 8x8 JaaS (JWT-gated rooms, recording) when traffic warrants moving off the free meet.jit.si

## 5. Data model

The original plan listed ~7 core tables; the live schema is considerably larger.
Core entities:

- **profiles** — customer accounts (name, phone, email, sign-in method,
  marketing consent, admin role)
- **pandits** — priest profiles, languages, regions, verification, rating
- **pandit_applications** — self-onboarding + encrypted KYC
- **poojas** — catalog of ceremonies (name, description, duration, price)
- **bookings** — customer + pooja + date/time + location + assigned pandit +
  status + `mode` (in_person / online video)
- **consultation_bookings** — paid 1:1 astrology/muhurat consultations
  (mode, birth details, assigned astrologer, meeting link)
- **products** — samagri items & kits (name, price, stock, images)
- **orders** / **order_items** — product orders (items, totals, delivery, status)
- **payments** — Razorpay transactions linked to bookings / orders / consultations

Plus supporting tables for: payroll & compensation, payout accounts, credit
notes & invoice counters, coupons, rewards/wallet, reviews & disputes, muhurat
windows, peak days, blog posts, contact messages, carts, stock subscriptions,
and the KYC access audit log.

## 6. Operational / legal (India)

- Razorpay KYC (business PAN/GST, bank account)
- GST treatment for commission + product sales — handled in-app (e-invoice,
  e-way bills, GSTR-1/3B exports); confirm filings with a CA
- Refund / cancellation policy (required by payment gateway) — ✅ page live
- Pandit agreements (commission %, payout cadence, conduct)
- Domain → Vercel DNS, SSL (automatic), `info@bookmypoojari.com` email

## 7. Pandit model

Originally launched **admin-managed** (owner onboards trusted Pandits, assigns
bookings manually). **Self-onboarding marketplace is now built** (applications →
KYC review → auto-created verified profile), so the platform can move to
volume-driven onboarding when ready.
