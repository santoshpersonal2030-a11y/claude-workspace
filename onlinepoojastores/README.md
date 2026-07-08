# Online Pooja Stores

A brand-new online store for **onlinepoojastores.com** — completely separate
from BookMyPoojari. It shares no code, no database, and no settings with any
other site. Everything for this project lives inside this one folder.

- **Owner:** Santosh L · Provident Global Services (PGS), Hyderabad, Telangana
- **Sells:** pooja items — incense, diyas, garlands, camphor, bells, and more
- **Payment:** Cash on Delivery (COD)
- **Look:** burgundy & gold, mobile-first
- **Tech:** Next.js (App Router) + Tailwind CSS + Supabase

## Build progress

1. ✅ **Step 1 — Database** (`supabase/` files, already applied)
2. ✅ **Step 2 — Storefront** (product listing + detail pages)
3. ✅ **Step 3 — Accounts** (email/password sign in, protected pages)
4. ✅ **Step 4 — Cart & checkout** (shipping calc + COD order placement)
5. ✅ **Admin panel** (manage products & orders — no SQL needed)
6. ✅ **Reviews & ratings** (customers rate products; you approve them)
7. ✅ **Wishlist** (customers save products for later)
8. ✅ **Sales analytics + auto stock** (dashboard insights; stock drops on sale)

### One Supabase setting to check

For the smoothest sign-up (no email-confirmation step), go to Supabase →
**Authentication → Providers → Email** and turn **"Confirm email" off** while
you're testing. Leave it on later if you want verified emails. Either way the
login screen handles both cases.

### Make yourself the admin

After you sign up once, run this in the Supabase SQL Editor (use your email):

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

## Run it on your computer (5 minutes)

You need [Node.js](https://nodejs.org) 18+ installed.

1. Open a terminal in this `onlinepoojastores` folder.
2. Copy the env template and fill in your keys:
   ```bash
   cp .env.local.example .env.local
   ```
   Open `.env.local` and paste your Supabase **Project URL** and
   **publishable (anon) key** (Supabase → Settings → API).
3. Install and start:
   ```bash
   npm install
   npm run dev
   ```
4. Open <http://localhost:3000> — you'll see your 5 products.

## Deploy to the web (Vercel)

1. Get this folder into your `onlinepoojastores` GitHub repo (see note below).
2. In Vercel → **Add New → Project** → import that repo.
   - If the app is in a subfolder, set the **Root Directory** to
     `onlinepoojastores`.
3. In Vercel → project **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your publishable (anon) key
4. Click **Deploy**.

## What the site can do now

- **Browse** — home page with hero, live product grid, **search**, and
  **category filters**; product detail pages.
- **Accounts** — create an account / sign in with email + password. Your
  profile row is created automatically. Signed-out visitors are sent to the
  login page when they try to check out or open their account.
- **Cart** — add to cart (quantities), the header shows a live count, cart
  persists in the browser.
- **Checkout** — address form, **live shipping calculation** from your 3 zones
  (Hyderabad ₹49 · rest of Telangana ₹79 · rest of India ₹149, free over ₹999),
  and **Cash on Delivery** order placement. Prices are re-checked on the server
  so they can't be tampered with.
- **Orders** — an order confirmation page and an order-history list under
  **Account**. Order numbers look like `ORD-2026-001`.
- All money in ₹; reads/writes go through Supabase with Row Level Security, so
  customers only ever see their own orders.

### Admin panel (`/admin`)

Once you're an admin (see the SQL above), an **Admin** link appears in the
header. From there you can, without touching the database:

- **Dashboard** — order count, revenue, new-order count, low-stock alerts,
  **top-selling products**, and **recent orders**.
- **Products** — add, edit, delete; set price, stock, category, image, and
  whether it shows in the store.
- **Orders** — see every order with the customer, and change its status
  (Order placed → Confirmed → … → Delivered). Marking an order *Delivered*
  also records the COD payment as paid.
- **Reviews** — customers who are signed in can rate a product (1–5 stars)
  and write a review. Reviews stay hidden until you **approve** them under
  Admin → Reviews. Approved reviews (and the average rating) then show on the
  product page.

Only admins can reach `/admin`; everyone else is redirected away.

### Turn on automatic stock reduction (one-time, 30 seconds)

Run `supabase/migrations/0002_auto_stock_decrement.sql` once in the Supabase
SQL Editor. After that, a product's stock drops automatically whenever it's
ordered (never below 0), and low-stock items show on the dashboard.

_Still a later add-on: a confirmation **email / SMS** (needs an email or SMS
provider such as Resend or MSG91 — those require their own account and keys)._

## Folder guide

```
onlinepoojastores/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # page shell (header + footer)
│   │   ├── page.tsx            # home / product listing
│   │   └── products/[slug]/    # product detail page
│   ├── components/             # Header, Footer, ProductCard, Catalog, …
│   └── lib/                    # Supabase client, data fetching, helpers
├── supabase/                   # Step 1 database (migration + seed)
└── .env.local.example          # copy to .env.local and add your keys
```

## Security notes

- `.env.local` holds your keys and is **git-ignored** — never commit it.
- Only the **publishable (anon)** key is used here; it's safe in the browser.
- The **secret (service_role)** key is never used by the storefront.
