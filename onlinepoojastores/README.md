# Online Pooja Stores

A brand-new online store for **onlinepoojastores.com** — completely separate
from BookMyPoojari. It shares no code, no database, and no settings with the
other site. Everything for this project lives inside this one folder.

- **Owner:** Santosh L · Provident Global Services (PGS), Hyderabad, Telangana
- **Sells:** pooja items — incense, diyas, garlands, camphor, bells, and more
- **Payment:** Cash on Delivery (COD)
- **Look:** burgundy & gold, mobile-first

## Build order

We build one step at a time. **Step 1 is done** (the database). The rest come
next, once you give the go-ahead:

1. ✅ **Step 1 — Database** (this folder's `supabase/` files)
2. ⬜ Step 2 — The storefront (product pages, burgundy/gold design)
3. ⬜ Step 3 — Sign in / create account
4. ⬜ Step 4 — Cart & checkout (shipping + COD orders)

## What's in here now (Step 1)

```
onlinepoojastores/
└── supabase/
    ├── migrations/
    │   └── 0001_initial_schema.sql   ← creates all the tables & rules
    └── seed.sql                      ← loads starter products, categories, shipping
```

## How to set up the database (about 5 minutes, no coding)

1. Create a **new** Supabase project (use the Online Pooja Stores email).
2. In Supabase, open **SQL Editor**.
3. Open `supabase/migrations/0001_initial_schema.sql`, copy everything,
   paste it into the SQL Editor, and click **Run**.
4. Do the same with `supabase/seed.sql` (copy → paste → **Run**).
5. Sign up once on the site (later step), then make yourself the admin by
   running this in the SQL Editor, using your email:

   ```sql
   update public.profiles set is_admin = true
   where email = 'your-admin-email@example.com';
   ```

That's it — your store's database is ready.

## What the database includes

- **Customers** — accounts are created automatically when someone signs up.
- **Catalog** — categories and products (5 starter products loaded).
- **Cart & wishlist** — per customer.
- **Orders** — automatic order numbers like `ORD-2026-001`, Cash on Delivery,
  with the delivery address and prices frozen at the moment of purchase.
- **Shipping** — 3 zones (Hyderabad, rest of Telangana, rest of India) with
  free shipping over ₹999.
- **Reviews** — ready for later (Phase 2).
- **Security** — customers can only ever see their own orders and addresses;
  the shop is public to browse; only admins can change products or view all
  orders. This is enforced by the database itself.

---

*Next: say the word and I'll start Step 2 — the storefront.*
