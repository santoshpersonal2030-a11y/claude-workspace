-- Online Pooja Stores — seed data
-- Mirrors the live WooCommerce store: 5 categories, 5 products, 3 shipping zones.
-- Idempotent: safe to re-run (uses ON CONFLICT on natural keys).

-- ── Categories ───────────────────────────────────────────────────────────────
insert into public.categories (name, slug, description) values
  ('Pooja Items',        'pooja-items',        'Essential items for daily and festive worship.'),
  ('Flowers & Garlands', 'flowers-garlands',   'Fresh and artificial flowers and garlands.'),
  ('Diyas & Lights',     'diyas-lights',       'Brass diyas, lamps and lights for aarti.'),
  ('Incense & Oils',     'incense-oils',       'Agarbatti, dhoop, camphor and pooja oils.'),
  ('Puja Accessories',   'puja-accessories',   'Bells, plates, kalash and other accessories.')
on conflict (slug) do nothing;

-- ── Products ─────────────────────────────────────────────────────────────────
insert into public.products
  (name, sku, description, price, weight_grams, stock_quantity, image_url)
values
  ('Sandalwood Incense Sticks (100 sticks)', 'POOJA-SAND-100', 'Premium sandalwood agarbatti, pack of 100 sticks.', 299.00, 200, 60, null),
  ('Brass Pooja Diya (Medium)',              'POOJA-DIYA-M',   'Traditional medium brass diya for aarti.',          499.00, 350, 50, null),
  ('Artificial Flower Garland (2 meters)',   'POOJA-GARL-2M',  'Reusable artificial flower garland, 2 metres.',     199.00, 150, 80, null),
  ('Pure Camphor Tablets (50g)',             'POOJA-CAMP-50',  'Pure bhimseni-style camphor tablets, 50g pack.',    149.00,  60, 70, null),
  ('Brass Pooja Bell (Large)',               'POOJA-BELL-L',   'Large brass hand bell with clear resonant tone.',   349.00, 400, 40, null)
on conflict (sku) do nothing;

-- ── Product ↔ Category links ────────────────────────────────────────────────
insert into public.product_categories (product_id, category_id)
select p.id, c.id
from (values
  ('POOJA-SAND-100', 'incense-oils'),
  ('POOJA-DIYA-M',   'diyas-lights'),
  ('POOJA-GARL-2M',  'flowers-garlands'),
  ('POOJA-CAMP-50',  'incense-oils'),
  ('POOJA-BELL-L',   'puja-accessories')
) as m(sku, slug)
join public.products   p on p.sku  = m.sku
join public.categories c on c.slug = m.slug
on conflict (product_id, category_id) do nothing;

-- ── Shipping zones + rates ──────────────────────────────────────────────────
-- Zone 1: Hyderabad/Secunderabad (PINs 500001-500109) — ₹49, free above ₹999
-- Zone 2: Rest of Telangana (state)                    — ₹79, free above ₹999
-- Zone 3: Rest of India (except Telangana)             — ₹149, free above ₹999
-- Guarded so re-running the seed does not create duplicate zones/rates.
do $$
declare
  z1 uuid; z2 uuid; z3 uuid;
begin
  if exists (select 1 from public.shipping_zones) then
    return;  -- already seeded
  end if;

  insert into public.shipping_zones (name, zone_type, coverage)
  values ('Hyderabad/Secunderabad', 'pin_codes',
          jsonb_build_object('pin_range', jsonb_build_array('500001', '500109')))
  returning id into z1;

  insert into public.shipping_zones (name, zone_type, coverage)
  values ('Rest of Telangana', 'state',
          jsonb_build_object('states', jsonb_build_array('Telangana')))
  returning id into z2;

  insert into public.shipping_zones (name, zone_type, coverage)
  values ('Rest of India', 'region',
          jsonb_build_object('exclude_states', jsonb_build_array('Telangana')))
  returning id into z3;

  insert into public.shipping_rates (shipping_zone_id, flat_rate, free_above) values
    (z1,  49.00, 999.00),
    (z2,  79.00, 999.00),
    (z3, 149.00, 999.00);
end $$;
