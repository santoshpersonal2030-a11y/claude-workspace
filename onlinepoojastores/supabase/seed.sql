-- =============================================================================
-- Online Pooja Stores — Starter data (Step 1)
-- Run this AFTER 0001_initial_schema.sql, in the Supabase SQL Editor.
-- Safe to re-run: existing rows are skipped (ON CONFLICT DO NOTHING).
--
-- Loads: 5 categories, 5 products, category links, and the 3 shipping zones
-- with their rates (free shipping above ₹999).
-- =============================================================================

-- ---- Categories --------------------------------------------------------------
insert into public.categories (name, slug, description, sort_order) values
  ('Pooja Items',        'pooja-items',        'Everyday essentials for daily worship',        1),
  ('Flowers & Garlands', 'flowers-garlands',   'Fresh-look artificial flowers and garlands',   2),
  ('Diyas & Lights',     'diyas-lights',       'Brass diyas, lamps and lights',                3),
  ('Incense & Oils',     'incense-oils',       'Agarbatti, dhoop, camphor and pooja oils',     4),
  ('Puja Accessories',   'puja-accessories',   'Bells, thalis and other worship accessories',  5)
on conflict (slug) do nothing;

-- ---- Products ----------------------------------------------------------------
insert into public.products (name, slug, description, price, sku, stock, is_active) values
  ('Sandalwood Incense Sticks (100 sticks)', 'sandalwood-incense-sticks-100',
     'Premium sandalwood agarbatti — pack of 100 sticks with a long-lasting fragrance.',
     299, 'OPS-INC-001', 80, true),
  ('Brass Pooja Diya (Medium)', 'brass-pooja-diya-medium',
     'Traditional medium-size brass diya for aarti and daily lighting.',
     499, 'OPS-DIY-001', 50, true),
  ('Artificial Flower Garland (2 meters)', 'artificial-flower-garland-2m',
     'Reusable 2-metre artificial flower garland for idols and doorways.',
     199, 'OPS-FLW-001', 70, true),
  ('Pure Camphor Tablets (50g)', 'pure-camphor-tablets-50g',
     'Pure sublime camphor (kapur) tablets, 50g — for aarti and havan.',
     149, 'OPS-INC-002', 60, true),
  ('Brass Pooja Bell (Large)', 'brass-pooja-bell-large',
     'Large brass hand bell (ghanti) with a clear, resonant tone.',
     349, 'OPS-ACC-001', 40, true)
on conflict (slug) do nothing;

-- ---- Link products to their category -----------------------------------------
insert into public.product_categories (product_id, category_id)
select p.id, c.id
from (values
  ('sandalwood-incense-sticks-100', 'incense-oils'),
  ('brass-pooja-diya-medium',       'diyas-lights'),
  ('artificial-flower-garland-2m',  'flowers-garlands'),
  ('pure-camphor-tablets-50g',      'incense-oils'),
  ('brass-pooja-bell-large',        'puja-accessories')
) as link(product_slug, category_slug)
join public.products   p on p.slug = link.product_slug
join public.categories c on c.slug = link.category_slug
on conflict do nothing;

-- ---- Shipping zones ----------------------------------------------------------
-- Zone 1: Hyderabad/Secunderabad by pincode range 500001–500109
-- Zone 2: rest of Telangana by state
-- Zone 3: rest of India (catch-all)
insert into public.shipping_zones (name, code, description, pincode_start, pincode_end, state, is_default, priority) values
  ('Hyderabad / Secunderabad', 'ZONE1', 'Pincodes 500001–500109',        500001, 500109, null,        false, 1),
  ('Rest of Telangana',        'ZONE2', 'Anywhere in Telangana state',   null,   null,   'Telangana', false, 2),
  ('Rest of India',            'ZONE3', 'All other states in India',     null,   null,   null,        true,  3)
on conflict (code) do nothing;

-- ---- Shipping rates (free above ₹999) ----------------------------------------
insert into public.shipping_rates (zone_id, rate, free_above)
select z.id, r.rate, 999
from (values
  ('ZONE1', 49),
  ('ZONE2', 79),
  ('ZONE3', 149)
) as r(code, rate)
join public.shipping_zones z on z.code = r.code
on conflict (zone_id) do nothing;

-- =============================================================================
-- Make yourself an admin (do this once, after you have signed up):
--   update public.profiles set is_admin = true
--   where email = 'your-admin-email@example.com';
-- =============================================================================
