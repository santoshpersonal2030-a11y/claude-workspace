-- =============================================================================
-- Online Pooja Stores — Initial database schema (Step 1)
-- Standalone project. Does NOT reference or share anything with BookMyPoojari.
--
-- Run this ONCE against a fresh Supabase project:
--   Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Then run seed.sql the same way to load the starter data.
--
-- What this creates:
--   * 13 tables (customers, catalog, cart, orders, payments, reviews, wishlist)
--   * Sensible status/type "enums"
--   * Automatic order numbers in the form ORD-YYYY-NNN
--   * Auto-created customer profile on signup
--   * "updated_at" timestamps kept fresh automatically
--   * Row Level Security so customers only ever see their own data,
--     the storefront is publicly readable, and only admins manage the store.
-- =============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums (fixed sets of allowed values)
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.order_status as enum
    ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('cod');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.address_label as enum ('home', 'work', 'other');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Helper functions & triggers
-- -----------------------------------------------------------------------------

-- Keep updated_at current on any row change.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- True if the currently logged-in user is an admin.
-- SECURITY DEFINER so it can read profiles without tripping RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Create a matching profile row automatically whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Generate the next order number for the current year: ORD-2026-001, ORD-2026-002 ...
-- The advisory lock serialises concurrent checkouts so two orders never collide.
create or replace function public.set_order_number()
returns trigger
language plpgsql
as $$
declare
  yr  text := to_char(now(), 'YYYY');
  seq integer;
begin
  if new.order_number is null then
    perform pg_advisory_xact_lock(hashtext('ops_order_number_' || yr));
    select count(*) + 1
      into seq
      from public.orders
     where order_number like 'ORD-' || yr || '-%';
    new.order_number := 'ORD-' || yr || '-' || lpad(seq::text, 3, '0');
  end if;
  return new;
end;
$$;

-- =============================================================================
-- TABLES
-- =============================================================================

-- 1. profiles — one row per signed-up user (1:1 with Supabase auth.users)
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  email      text,
  phone      text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. categories — storefront departments
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3. products — items for sale
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  price       numeric(10, 2) not null check (price >= 0),
  currency    text not null default 'INR',
  sku         text unique,
  stock       integer not null default 0 check (stock >= 0),
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 4. product_categories — many-to-many link between products and categories
create table if not exists public.product_categories (
  product_id  uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (product_id, category_id)
);

-- 5. shipping_zones — how a delivery pincode/state maps to a zone
create table if not exists public.shipping_zones (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  code          text not null unique,
  description   text,
  pincode_start integer,          -- lowest pincode in the zone (Zone 1)
  pincode_end   integer,          -- highest pincode in the zone (Zone 1)
  state         text,             -- match by state (Zone 2)
  is_default    boolean not null default false,  -- catch-all zone (Zone 3)
  priority      integer not null default 100,    -- lower = checked first
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 6. shipping_rates — the fee (and free-shipping threshold) for each zone
create table if not exists public.shipping_rates (
  id         uuid primary key default gen_random_uuid(),
  zone_id    uuid not null unique references public.shipping_zones (id) on delete cascade,
  rate       numeric(10, 2) not null check (rate >= 0),
  free_above numeric(10, 2) not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. addresses — saved delivery addresses per customer
create table if not exists public.addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  label      public.address_label not null default 'home',
  full_name  text not null,
  phone      text not null,
  line1      text not null,
  line2      text,
  city       text not null,
  state      text not null,
  pincode    text not null,
  country    text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. cart_items — the current shopping cart per customer
create table if not exists public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity   integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- 9. orders — a placed order (Cash on Delivery). Address is frozen at purchase.
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text unique,
  user_id       uuid not null references public.profiles (id) on delete restrict,
  status        public.order_status not null default 'pending',
  payment_method public.payment_method not null default 'cod',
  subtotal      numeric(10, 2) not null default 0 check (subtotal >= 0),
  shipping_fee  numeric(10, 2) not null default 0 check (shipping_fee >= 0),
  total         numeric(10, 2) not null default 0 check (total >= 0),
  -- Shipping address snapshot (copied in so later edits don't change the order)
  ship_full_name text not null,
  ship_phone     text not null,
  ship_line1     text not null,
  ship_line2     text,
  ship_city      text not null,
  ship_state     text not null,
  ship_pincode   text not null,
  ship_country   text not null default 'India',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 10. order_items — line items, with price frozen at time of purchase
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,                 -- frozen copy
  unit_price   numeric(10, 2) not null check (unit_price >= 0), -- frozen copy
  quantity     integer not null check (quantity > 0),
  line_total   numeric(10, 2) not null check (line_total >= 0),
  created_at   timestamptz not null default now()
);

-- 11. payments — one record per order (COD for now)
create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null unique references public.orders (id) on delete cascade,
  method     public.payment_method not null default 'cod',
  status     public.payment_status not null default 'pending',
  amount     numeric(10, 2) not null check (amount >= 0),
  paid_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 12. reviews — product ratings & reviews (Phase 2)
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  title       text,
  body        text,
  is_approved boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (product_id, user_id)
);

-- 13. wishlist_items — saved-for-later products (Phase 2)
create table if not exists public.wishlist_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- -----------------------------------------------------------------------------
-- Helpful indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_products_active         on public.products (is_active);
create index if not exists idx_product_categories_cat  on public.product_categories (category_id);
create index if not exists idx_addresses_user          on public.addresses (user_id);
create index if not exists idx_cart_items_user         on public.cart_items (user_id);
create index if not exists idx_orders_user             on public.orders (user_id);
create index if not exists idx_orders_status           on public.orders (status);
create index if not exists idx_order_items_order       on public.order_items (order_id);
create index if not exists idx_reviews_product         on public.reviews (product_id);
create index if not exists idx_wishlist_user           on public.wishlist_items (user_id);

-- -----------------------------------------------------------------------------
-- Wire up the triggers
-- -----------------------------------------------------------------------------
create trigger trg_profiles_updated       before update on public.profiles       for each row execute function public.set_updated_at();
create trigger trg_categories_updated     before update on public.categories     for each row execute function public.set_updated_at();
create trigger trg_products_updated       before update on public.products       for each row execute function public.set_updated_at();
create trigger trg_shipping_zones_updated before update on public.shipping_zones for each row execute function public.set_updated_at();
create trigger trg_shipping_rates_updated before update on public.shipping_rates for each row execute function public.set_updated_at();
create trigger trg_addresses_updated      before update on public.addresses      for each row execute function public.set_updated_at();
create trigger trg_cart_items_updated     before update on public.cart_items     for each row execute function public.set_updated_at();
create trigger trg_orders_updated         before update on public.orders         for each row execute function public.set_updated_at();
create trigger trg_payments_updated       before update on public.payments       for each row execute function public.set_updated_at();
create trigger trg_reviews_updated        before update on public.reviews        for each row execute function public.set_updated_at();

create trigger trg_orders_number before insert on public.orders
  for each row execute function public.set_order_number();

-- Auto-create a profile whenever a new auth user signs up.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- Turn it on everywhere, then grant exactly the access each table needs.
-- =============================================================================
alter table public.profiles           enable row level security;
alter table public.categories         enable row level security;
alter table public.products           enable row level security;
alter table public.product_categories enable row level security;
alter table public.shipping_zones     enable row level security;
alter table public.shipping_rates     enable row level security;
alter table public.addresses          enable row level security;
alter table public.cart_items         enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;
alter table public.payments           enable row level security;
alter table public.reviews            enable row level security;
alter table public.wishlist_items     enable row level security;

-- ---- profiles ----------------------------------------------------------------
create policy profiles_select_self_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update_self_or_admin on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ---- categories (public read, admin write) -----------------------------------
create policy categories_read_all on public.categories
  for select using (true);
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- products (public read, admin write) -------------------------------------
create policy products_read_all on public.products
  for select using (true);
create policy products_admin_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- product_categories (public read, admin write) ---------------------------
create policy product_categories_read_all on public.product_categories
  for select using (true);
create policy product_categories_admin_write on public.product_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- shipping zones & rates (public read, admin write) -----------------------
create policy shipping_zones_read_all on public.shipping_zones
  for select using (true);
create policy shipping_zones_admin_write on public.shipping_zones
  for all using (public.is_admin()) with check (public.is_admin());

create policy shipping_rates_read_all on public.shipping_rates
  for select using (true);
create policy shipping_rates_admin_write on public.shipping_rates
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- addresses (owner only) --------------------------------------------------
create policy addresses_owner_all on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- cart_items (owner only) -------------------------------------------------
create policy cart_items_owner_all on public.cart_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- orders (owner reads/creates; admin reads all & updates status) ----------
create policy orders_select_owner_or_admin on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy orders_insert_owner on public.orders
  for insert with check (user_id = auth.uid());
create policy orders_update_admin on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- ---- order_items (visible with the parent order; created with the order) -----
create policy order_items_select_owner_or_admin on public.order_items
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o
                where o.id = order_items.order_id and o.user_id = auth.uid())
  );
create policy order_items_insert_owner on public.order_items
  for insert with check (
    exists (select 1 from public.orders o
             where o.id = order_items.order_id and o.user_id = auth.uid())
  );

-- ---- payments (owner reads own; admin reads & updates all) -------------------
create policy payments_select_owner_or_admin on public.payments
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o
                where o.id = payments.order_id and o.user_id = auth.uid())
  );
create policy payments_insert_owner on public.payments
  for insert with check (
    exists (select 1 from public.orders o
             where o.id = payments.order_id and o.user_id = auth.uid())
  );
create policy payments_update_admin on public.payments
  for update using (public.is_admin()) with check (public.is_admin());

-- ---- reviews (public reads approved; owner manages own; admin manages all) ---
create policy reviews_read_approved_or_owner_or_admin on public.reviews
  for select using (is_approved or user_id = auth.uid() or public.is_admin());
create policy reviews_insert_owner on public.reviews
  for insert with check (user_id = auth.uid());
create policy reviews_update_owner_or_admin on public.reviews
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy reviews_delete_owner_or_admin on public.reviews
  for delete using (user_id = auth.uid() or public.is_admin());

-- ---- wishlist_items (owner only) ---------------------------------------------
create policy wishlist_owner_all on public.wishlist_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Done.
