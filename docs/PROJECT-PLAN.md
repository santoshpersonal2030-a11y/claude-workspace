# BookMyPoojari — Project Plan

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
- **Razorpay** — payments (UPI-first, India)
- **Twilio** — WhatsApp / SMS booking confirmations
- **Vercel** — hosting (auto-deploys from GitHub)
- **Hostinger** — domain (bookmypoojari.com) + email

> Decision: start on Vercel for speed and zero maintenance. The code lives in
> GitHub and can be migrated to a Hostinger VPS later if full control is needed.

## 4. Phased roadmap

### Phase 1 — MVP / Launch
- [x] Project scaffold (Next.js + Tailwind)
- [x] Brand + design system (saffron / maroon / gold)
- [x] Homepage
- [ ] Pooja catalog listing page (`/poojas`)
- [ ] Pooja detail + booking page (`/poojas/[slug]`)
- [ ] Samagri store (`/store`) + product pages
- [ ] Cart & checkout
- [ ] Supabase database (users, poojas, bookings, products, orders, payments)
- [ ] Authentication — mandatory login: phone OTP (2Factor.in) + Google login
- [ ] Razorpay payments
- [ ] Booking confirmation via WhatsApp / SMS / email (Twilio)
- [ ] Admin dashboard (manage poojas, products, bookings, pandits)
- [ ] Legal pages: Terms, Privacy, Refund & Cancellation, Contact
- [ ] Connect domain (bookmypoojari.com → Vercel)

### Phase 2 — Marketplace & growth
- [ ] Pandit self-onboarding + availability calendar + payouts
- [ ] Ratings & reviews, verified badges
- [ ] Multi-language (Hindi + regional)
- [ ] Coupons, referrals, festival campaigns
- [ ] Blog / SEO engine (muhurat dates, "how to do X pooja")

### Phase 3 — Differentiation
- [ ] Virtual / live pooja over video
- [ ] Astrology & muhurat consultation
- [ ] Subscriptions (monthly temple pooja), corporate / bulk
- [ ] Mobile app

## 4a. Authentication & data capture (decided)

**Login is mandatory** — every visitor must sign in before booking or ordering,
so we capture contact details for future marketing / CRM. Two sign-in methods:

1. **Phone OTP** via **2Factor.in** (Indian SMS OTP provider) — user enters
   mobile number, receives an OTP, verifies. Primary method for India.
2. **Google login** (OAuth) — one-tap sign-in with a Google account.

Approach: **Supabase Auth** manages sessions and Google OAuth. Because 2Factor.in
is not a built-in Supabase SMS provider, phone OTP uses a **custom flow**:
send OTP via the 2Factor.in API → verify → create/sign in the Supabase user.

Every account stores **name, phone, email, sign-in method, and marketing
consent** in the `profiles` table for future outreach. Capture consent at
sign-up to stay compliant.

## 5. Data model (planned)

- **profiles** — customer accounts (linked to Supabase auth): name, phone,
  email, sign-in method (OTP / Google), marketing consent, created_at
- **pandits** — priest profiles, languages, regions, verification, rating
- **poojas** — catalog of ceremonies (name, description, duration, price)
- **bookings** — customer + pooja + date/time + location + assigned pandit + status
- **products** — samagri items & kits (name, price, stock, images)
- **orders** — product orders (items, totals, delivery address, status)
- **payments** — Razorpay transactions linked to bookings/orders

## 6. Operational / legal (India)

- Razorpay KYC (business PAN/GST, bank account)
- GST treatment for commission + product sales (check with CA)
- Refund / cancellation policy (required by payment gateway)
- Pandit agreements (commission %, payout cadence, conduct)
- Domain → Vercel DNS, SSL (automatic), `info@bookmypoojari.com` email

## 7. Pandit model (launch)

Start **admin-managed**: owner onboards a few trusted Pandits and assigns
bookings manually. Move to self-onboarding marketplace in Phase 2 once volume
justifies it.
