# Verification Guide

A few things can't be verified in the cloud build environment and need a local
run: a **Razorpay test-mode payment** (no API keys in CI), a **screen-reader /
keyboard accessibility pass** (no real browser + assistive tech), and the
**live video pooja / Jitsi** round-trip (needs a browser + camera). Everything
else — type-check, lint, unit tests, production build, and a structural axe-core
scan — already runs green in CI.

This guide is the checklist to close those gaps locally.

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

## 3. Live video pooja — Jitsi room round-trip

Goal: confirm a customer and the assigned Pandit land in the **same** embedded
video room. The default `meet.jit.si` needs **no API keys**, so this is testable
immediately on `npm run dev` (optionally set `NEXT_PUBLIC_JITSI_DOMAIN`).

### Online pooja

1. Open any pooja detail page, switch the booking widget to **Online (video)**,
   pick a date/slot/language and pay (or, with no Razorpay keys, the booking is
   recorded as pending).
2. Confirm the row is online:

   ```sql
   select id, mode, status, booking_date, time_slot
   from public.bookings order by created_at desc limit 5;
   -- expect mode = 'online'
   ```

3. As admin, assign a Pandit to that booking (`/admin/bookings/[id]` or the
   bookings list) and make sure it's not `pending`/`cancelled`.
4. **Customer** opens `/account/bookings/[id]/live` (a "🎥 Join live pooja"
   button appears on `/account/bookings` once it's confirmed/assigned).
5. **Pandit** signs in and opens the booking from `/priest/calendar` — online
   ceremonies show a 🎥 link to `/priest/bookings/[id]/live`.
6. Both should join the **same room** (`bmp-pooja-<booking id>`) and see/hear
   each other. The prejoin screen lets each set mic/camera first.

### Video consultation

- A confirmed **video** consultation shows "🎥 Join video call" on
  `/account/consultations`, opening `/account/consultations/[id]/live`.
- If an admin pasted an external link (Zoom/Meet) in `/admin/consultations`,
  the page prefers that link; otherwise it embeds the Jitsi room
  (`bmp-consult-<id>`).

### Checks & notes

- [ ] Both parties land in the same room and can see/hear each other.
- [ ] The room only opens for the booking's customer, the assigned Pandit, or an
      admin (others get a 404 / login redirect).
- [ ] If the in-page embed is blocked (e.g. corporate network), the fallback
      "Open video room →" link still works.
- Room access on public `meet.jit.si` is name-only (the names use UUIDs).
  For stronger control (JWT-gated rooms, recording), point
  `NEXT_PUBLIC_JITSI_DOMAIN` at an **8x8 JaaS** / self-hosted deployment.

---

## What CI already guarantees

`npm run` ⇒ `tsc --noEmit`, `eslint`, the node test suite, and `next build` all
pass. Treat this guide as the manual delta on top of that.
