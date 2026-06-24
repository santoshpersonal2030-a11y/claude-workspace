# Verification Guide

Two things can't be verified in the cloud build environment and need a local
run: a **Razorpay test-mode payment** (no API keys in CI) and a **screen-reader /
keyboard accessibility pass** (no real browser + assistive tech). Everything
else — type-check, lint, unit tests, production build, and a structural axe-core
scan — already runs green in CI.

This guide is the checklist to close those two gaps locally.

---

## 1. Razorpay test-mode payment — consultation round-trip

Goal: confirm the full path **book → pay (test card) → verify → confirmed →
email → visible in account**, plus admin fulfilment.

### Prerequisites

In `.env.local`:

```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
# Supabase keys as usual; email provider optional (confirmation email).
```

Then:

```
npm run dev
```

Sign in (the booking flow requires a logged-in user).

### Steps

1. Open `/consultations`, pick a service, open its detail page.
2. Fill the form. For astrology services (Kundli reading, Gun Milan, Remedies)
   the **birth date + place are required**; muhurat/vastu don't ask for them.
3. Choose phone or video, a date and a slot, then **Pay … & book**.
4. In the Razorpay **test** modal use a test instrument, e.g. card
   `4111 1111 1111 1111`, any future expiry, any CVV, and the test OTP. (See
   Razorpay's test-card docs for the current list.)
5. On success the form shows **"Consultation confirmed"** with a link to
   `/account/consultations`.

### Verify each stage

**Database** (Supabase SQL editor) — swap in the new id, or sort by `created_at`:

```sql
-- The booking should flip pending -> confirmed once payment is captured.
select id, status, service_name, mode, amount, created_at
from public.consultation_bookings
order by created_at desc limit 5;

-- A captured payment row, linked by consultation_id.
select payment_for, status, amount, consultation_id, razorpay_order_id
from public.payments
where payment_for = 'consultation'
order by created_at desc limit 5;
```

Expected: `consultation_bookings.status = 'confirmed'` and the matching
`payments` row `status = 'captured'`.

**Email** — if an email provider is configured, a "Consultation confirmed" mail
is sent (best-effort; failures are logged, never block the booking). Check the
server logs / provider dashboard.

**Customer UI** — `/account/consultations` lists it as **Confirmed**. For a
video consult, once an admin sets the meeting link a **Join video call** button
appears.

**Admin fulfilment** — `/admin/consultations` (needs the `bookings` capability):
assign an astrologer, set status, and for video paste a meeting link → confirm
it shows up for the customer.

### Troubleshooting

- **No payment modal appears** → `razorpayConfigured()` is false (keys unset);
  the API returns the no-key fallback that records the booking and shows
  "Request received". Set the keys.
- **"Invalid signature" (400 from `/api/razorpay/verify`)** → the
  `RAZORPAY_KEY_SECRET` doesn't match the key id that created the order.
- **Booking stays `pending`** → capture didn't run. Both the client verify route
  and the Razorpay webhook call `capturePaymentByRazorpayOrder` (idempotent via
  the payment status guard); confirm at least one reached the server.

---

## 2. Accessibility — manual screen-reader & keyboard pass

### Already automated (no need to re-check by hand)

The structural layer was scanned with axe-core and fixed: one `<main>` landmark
per page, skip link, heading order, form-field accessible names, data-table
`scope`, colour contrast (computed to WCAG AA), and ARIA live-region
announcements for cart changes. What remains is the **lived** experience, which
needs a human.

### A. Keyboard-only walkthrough (unplug the mouse)

Tab through each flow; nothing should be reachable-but-unlabelled, trap focus
unexpectedly, or be skipped.

- [ ] **Skip link** — first Tab on any page focuses a visible "Skip to content"
      pill; Enter moves focus to `<main>`.
- [ ] **Header** — logical order through search icon, language, notifications,
      wishlist, cart, account, and the "Book a Pooja" button.
- [ ] **Pooja booking** (`/poojas/[slug]`) — every field reachable and labelled;
      date/slot/pandit selects operable; submit reachable.
- [ ] **Consultation booking** (`/consultations/[slug]`) — the phone/video radios
      operate with arrow keys; date, slot, birth fields and submit all reachable.
- [ ] **Cart drawer** — opening it moves focus inside; Tab **cycles within** the
      drawer (focus trap); **Esc** closes it and focus returns to the trigger.
- [ ] **Search** — the header search icon reaches `/search`; the input is
      focusable and Enter submits.
- [ ] **Checkout** (`/cart`) and **account** pages — forms fully operable.

### B. Screen-reader smoke test (NVDA on Windows / VoiceOver on macOS)

- [ ] **Landmarks** — each page exposes banner / navigation / main / contentinfo
      (and the announcement bar as a labelled region).
- [ ] **Headings** — the H shortcut walks h1 → h2 → h3 with no level skips.
- [ ] **Forms** — every input announces its label; required fields announce
      "required"; the consultation mode radios announce as a group.
- [ ] **Cart changes** — adding/removing an item is announced politely
      ("<name> added to cart") without moving focus.
- [ ] **Admin tables** — moving across a data cell announces its column header.
- [ ] **Controls** — every button/link has a discernible name (no "button",
      "link" with no text).

### C. Visual checks (sighted, in a browser — axe can't judge these)

- [ ] **Focus ring** — a visible saffron outline on every interactive element
      when tabbed to (defined in `globals.css`).
- [ ] **Touch targets** — tap targets are comfortably ≥ ~44px on mobile
      (spot-check small icon buttons).

### Tooling

- **axe DevTools** browser extension — run on `/`, `/poojas`, a pooja detail,
  `/store`, `/consultations`, a consultation detail, `/cart`, `/search`, and a
  couple of admin pages (logged in). Triage any new violations.
- Optional: wire `@axe-core/playwright` into a `test:e2e` spec to keep the
  structural scan in CI on a real browser, including the authenticated routes
  the cloud scan couldn't reach.

---

## What CI already guarantees

`npm run` ⇒ `tsc --noEmit`, `eslint`, the node test suite, and `next build` all
pass. Treat this guide as the manual delta on top of that.
