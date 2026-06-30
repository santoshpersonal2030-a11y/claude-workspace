# Online Pooja Stores

Custom Supabase-based e-commerce platform replacing the live WooCommerce store at
**onlinepoojastores.com**. This is a **standalone project**, independent of the
bookmypoojari app in the repo root.

- **Owner:** Santosh L, Provident Global Services (PGS), Hyderabad, Telangana
- **Region:** India (Telangana-focused) · **Currency:** ₹ INR · **Payment:** COD only
- **Stack:** Next.js (web) + Supabase (Postgres / Auth / Storage / Realtime) + Vercel

## Status — Step 1 of 4: Database schema ✅

This folder currently contains the **complete Supabase schema** (NEXT STEPS option 1).
Frontend, auth, and cart/checkout come in later steps.

```
onlinepoojastores/
├── .env.example
└── supabase/
    ├── config.toml
    ├── migrations/
    │   └── 20260630000001_init.sql   # all 13 tables + RLS + triggers
    └── seed.sql                      # 5 categories, 5 products, 3 shipping zones
```

## What the schema includes

| # | Table | Notes |
|---|-------|-------|
| 1 | `profiles` | 1:1 with `auth.users`; auto-created on signup; `is_admin` flag |
| 2 | `categories` | public read |
| 3 | `products` | price, stock, dimensions, gallery, `is_active` |
| 4 | `product_categories` | many-to-many junction |
| 5 | `shipping_zones` | `coverage` JSONB (pins / states / region) |
| 6 | `shipping_rates` | flat rate + free-above threshold per zone |
| 7 | `addresses` | owner-scoped |
| 8 | `cart_items` | one row per product per user |
| 9 | `orders` | auto `ORD-YYYY-NNN` number, COD, status enum |
| 10 | `order_items` | line items with price frozen at purchase |
| 11 | `payments` | one per order |
| 12 | `reviews` | Phase 2; one per user per product |

Plus: enums, `updated_at` triggers, an `is_admin()` helper, and **Row Level
Security on every table** — public catalog read, owner-only carts/orders/addresses,
admin-only writes for products/categories/shipping.

## Apply the schema

**Option A — Supabase CLI (recommended)**
```bash
cd onlinepoojastores
supabase link --project-ref YOUR_PROJECT_REF
supabase db push          # runs migrations
psql "$DATABASE_URL" -f supabase/seed.sql   # or rely on config.toml seed on `db reset`
```

**Option B — SQL editor**
Paste `supabase/migrations/20260630000001_init.sql`, run it, then paste
`supabase/seed.sql` and run it.

**Make yourself an admin** (after signing up once):
```sql
update public.profiles set is_admin = true where id = 'YOUR_AUTH_USER_ID';
```

## Next steps

2. Next.js frontend (product listing + details, Tailwind, Supabase client)
3. Authentication (email/password, protected routes)
4. Cart & checkout (shipping calculation, COD order placement)
