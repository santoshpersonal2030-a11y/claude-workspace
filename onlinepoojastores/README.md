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
3. ⬜ Step 3 — Sign in / create account
4. ⬜ Step 4 — Cart & checkout (shipping + COD orders)

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

## What's on the storefront (Step 2)

- **Home page** — hero banner, live product grid, **search box**, and
  **category filter** chips (All, Pooja Items, Flowers & Garlands, …).
- **Product detail page** — big image area, price, stock status, description,
  and an "Add to cart" button (wired up in Step 4).
- Prices shown in ₹, "free shipping over ₹999" messaging, COD notes.
- Reads live from your Supabase database using the safe publishable key.

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
