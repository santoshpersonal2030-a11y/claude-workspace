# What the store is missing, compared to a normal e-commerce site

**Written 05-Aug-2026.** Every claim below was checked against the code and the database schema,
not assumed. Where I first got an answer wrong, I have said so.

---

## First, what you already have — because the gap list is short and this list is not

It is worth being clear about this before reading the gaps. Most Indian D2C stores launch with
considerably less than what is already built here:

Cart · wishlist · coupons · product reviews with ratings · **back-in-stock alerts** ·
**abandoned-cart recovery** (a scheduled job) · **reorder from a past order** · store credit
wallet · loyalty points · referrals · **related products on the product page** · a proper
**image gallery** · live stock display with a "only 3 left" warning and an out-of-stock state ·
category filter and sort · site search · order status tracking · **GST-accurate invoices** ·
**e-invoicing (IRN)** · **e-way bills with expiry alerts** · credit notes · an admin low-stock
"reorder soon" widget · schema.org product markup for Google Shopping.

The GST, e-invoice and e-way-bill work in particular is well beyond what most small stores have,
and it is the part that is genuinely painful to add later.

---

## Tier 1 — these would cost you real money on day one

### 1. 🔴 No Cash on Delivery

Checkout offers exactly two ways to pay: a Razorpay prepaid payment, or store credit. There is no
COD option anywhere in the code or the database.

For an Indian store this is the single biggest one. COD remains a large share of Indian
e-commerce orders — it is falling as UPI grows, but it is still how a great many first-time
buyers pay, and it is highest exactly where you are strongest: outside the metros, older buyers,
and categories where trust matters. Asking a first-time customer to pay ₹2,100 up front to a shop
they have never heard of, for a religious ceremony, is a hard sell.

*Not a small change:* COD needs an order state that is "confirmed but unpaid", a remittance
reconciliation flow, and a rule about which pincodes get it.

### 2. 🔴 No guest checkout

The checkout API refuses anyone not signed in. Every buyer must create an account before they can
pay. This is one of the most-cited causes of cart abandonment in retail generally, and you have
made it worse than usual by requiring it *before* payment rather than after.

*Small change:* let the order be placed against an email/phone, and offer account creation on the
confirmation screen.

### 3. ✅ Stock is never checked at checkout — you can oversell — **FIXED 05-Aug, commit `02f138f`**

> The checkout now reads stock and refuses a cart it cannot fill, before any money moves. An
> oversell that slips through the remaining race window is now reported instead of vanishing.
> **The last piece — an atomic reserve so two simultaneous buyers cannot both take the last unit
> — is written but NOT applied**, because it needs the paused database:
> `supabase/migrations/20260805_stock_reservation.sql`. Original description follows.

**This is a bug, not a missing feature.** The checkout reads each product's
`id, slug, name, price, active, gst_rate, hsn_code` — **it does not read `stock`.** Stock is only
decremented *after* payment succeeds.

So if you have one brass lamp left and three people buy it in the same minute, all three payments
succeed and you now owe two refunds. There is no reservation, no "someone else just bought this",
and nothing stops the stock going negative.

*Small change, high value:* check stock in the same query, reject the cart if short, and reserve
on order creation.

### 4. 🔴 There are no product photographs — none at all

All three storage buckets hold **zero files**. The gallery component works; there is nothing to
put in it. This is not a code gap and no amount of engineering fixes it, but it is the single
thing most likely to stop the store selling anything.

### 5. 🔴 No way for a customer to cancel an order or return anything

The order statuses are `pending → paid → packed → shipped → delivered → cancelled`. There is no
"return requested", no "returned", no "refund pending". There is no button anywhere in the
customer's account to cancel or return.

You have a written **Refund & Cancellation policy page** and no mechanism behind it. In practice
every cancellation and return will arrive by phone or WhatsApp and be done by hand in the admin.
For a while that is survivable; it is also the thing that generates the most angry customers.

---

## Tier 2 — standard on Indian stores, and two are specific to your business

### 6. 🟠 Shipping is a flat ₹49, free over ₹999. Nothing else.

No zones, no weight bands, no distance. Samagri is **heavy** — brass, ghee, coconuts, whole
grains. A ₹49 flat fee on a 6 kg kit to a village 800 km away loses money on every order.

### 7. 🟠 No pincode serviceability check

A customer anywhere in India can complete an order to a pincode you cannot deliver to. You find
out afterwards and have to cancel and refund. Most Indian stores check this on the product page,
before the customer invests any effort.

### 8. 🟠 No delivery-date promise — and for you this is not a minor one

There is an `estimated_delivery` column on the order, but nothing collects it, calculates it, or
shows it to the customer before they buy.

**This matters more for you than for a normal shop.** Samagri is bought *for a specific ceremony
on a specific date*. A kit that arrives the day after the muhurat is worth nothing — it is a
refund and a lost customer, not a late parcel. Your site already knows the muhurat dates; the
store has no idea they exist.

I would put this above shipping rates. It is the one gap on this list that is about your business
rather than about e-commerce in general.

### 9. 🟠 No product variants

One product is one price and one stock number. Samagri kits naturally come in sizes — a
two-person kit and a fifty-guest kit are not the same thing — and pooja kits vary by deity. Today
each of those must be a separate product with its own page, its own reviews and its own URL.

### 10. 🟠 No courier integration

`carrier` and `tracking_number` are free-text fields that an admin types in by hand. No
Delhivery / Shiprocket / Bluedart connection, no automatic status updates, no label printing, no
pickup scheduling. Fine at five orders a day, painful at fifty.

### 11. 🟠 No email list capture

There is no newsletter signup anywhere. You have WhatsApp and SMS plumbing already built, but no
way to collect an opt-in from someone who visits and does not buy.

For a business whose demand spikes at Diwali, Navratri and Ganesh Chaturthi, the list *is* the
business. Every festival is a reason to contact people who already trust you — and you currently
have no way to reach anyone who has not already bought.

### 12. 🟠 No pagination on the store listing

Every product is loaded on one page. Invisible at 12 products, a real problem at 200.

---

## Tier 3 — worth having eventually, none of them urgent

- **Recently viewed** items
- **Product Q&A** ("is this kit enough for 20 people?") — for samagri, buyers genuinely do not
  know what they need, so this may be worth more here than in normal retail
- **Gift wrap / gift message** — poojas and kits are frequently bought *for* someone else
- **Bulk / tier pricing** — temples and community organisers buy in volume
- **Product comparison**
- **A real SKU field** — the schema.org markup currently uses the URL slug as the SKU

---

## Not e-commerce, but it will stop you invoicing legally

`company_settings` is **entirely blank** — no business name, no GSTIN, no UPI id. The invoicing
code is built and correct, but with nothing configured it will print the placeholder company
details from `.env.example`.

A GST invoice with a placeholder name and no GSTIN is not a valid tax invoice. This is a
ten-minute data-entry job that has to happen before the first real sale, and it is easy to
forget precisely because the code works fine without it.

---

## If I had to pick five, in order

1. **Load product photographs.** Nothing else matters until this is done.
2. ~~**Fix the overselling bug.**~~ ✅ Done, commit `02f138f` — except the atomic database half,
   which is written and waiting for the project to be un-paused.
3. **Fill in `company_settings`.** Ten minutes; legally required.
4. **Add a delivery-date promise tied to the ceremony date.** The most valuable thing on this
   list that is specific to your business rather than generic.
5. **Add COD and guest checkout.** The two biggest conversion gaps — but both are real
   engineering, so they come after the four cheap wins above.

---

## How I checked, and where I was wrong first

I scanned the source for each feature. **My first scan reported "missing" for all seventeen
things I looked for** — because the command was erroring on every one and I was reading the
error as an absence. A control that must return a hit, and one that must not, is what caught it.
A zero that comes from a broken check looks exactly like a zero that comes from a real gap.

The corrected scan then produced four false *positives*, which mattered just as much:

- "Returns/RMA — present" was the phrase `return request.cookies.getAll()`.
- "Shipping by weight — present" was the CSS class `font-weight`.
- "Related products — present" turned out to be **true**: `getRelatedProducts()` really is on the
  product page. I nearly reported a real feature as missing.
- "Low-stock alerts — present" was also **true**: there is a proper admin widget.

Every item above was then opened and read directly.
