-- Online Pooja Stores — initial schema
-- Custom Supabase e-commerce platform (replacing WooCommerce).
-- Owner: Santosh L, Provident Global Services (PGS), Hyderabad, Telangana.
-- Currency: INR. Payment: Cash on Delivery (COD) only.
--
-- This single migration creates every table, relationship, index, trigger and
-- Row Level Security (RLS) policy for the MVP. Apply with the Supabase CLI
-- (`supabase db push`) or paste into the SQL editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ─────────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────────
do $$ begin
  create type zone_type     as enum ('pin_codes', 'state', 'region');
exception when duplicate_object then null; end $$;

do $$ begin
  create type address_type  as enum ('home', 'work', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status   as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('cod');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'paid', 'failed');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Shared helpers
-- ─────────────────────────────────────────────────────────────────────────────

-- Touch updated_at on every UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- True when the current auth user is flagged as an admin. SECURITY DEFINER so it
-- can read profiles.is_admin without tripping that table's own RLS (avoids a
-- recursive policy check).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. profiles  (1:1 with auth.users)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  phone       text,
  avatar_url  text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. categories
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. products
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  sku            text not null unique,
  description    text,
  price          numeric(10,2) not null check (price >= 0),
  weight_grams   integer check (weight_grams >= 0),
  length_cm      numeric(8,2),
  width_cm       numeric(8,2),
  height_cm      numeric(8,2),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url      text,
  gallery_images text[] not null default '{}',
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. product_categories  (many-to-many junction)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.product_categories (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id)   on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (product_id, category_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. shipping_zones
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.shipping_zones (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  zone_type  zone_type not null,
  coverage   jsonb not null default '{}'::jsonb,   -- {"pins": [...], "states": [...]}
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. shipping_rates
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.shipping_rates (
  id               uuid primary key default gen_random_uuid(),
  shipping_zone_id uuid not null references public.shipping_zones(id) on delete cascade,
  flat_rate        numeric(10,2) not null check (flat_rate >= 0),
  free_above       numeric(10,2) check (free_above >= 0),
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. addresses
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  address_line_1 text not null,
  address_line_2 text,
  city           text not null,
  state          text not null,
  pin_code       text not null,
  phone          text not null,
  is_default     boolean not null default false,
  address_type   address_type not null default 'home',
  created_at     timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. cart_items
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity   integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)      -- one row per product per cart
);
create index if not exists cart_items_user_idx on public.cart_items(user_id);

drop trigger if exists cart_items_updated_at on public.cart_items;
create trigger cart_items_updated_at before update on public.cart_items
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. orders
-- ─────────────────────────────────────────────────────────────────────────────
-- Per-year sequence behind a human-friendly order number: ORD-2026-001.
create sequence if not exists public.order_number_seq;

create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete restrict,
  order_number        text not null unique,
  status              order_status   not null default 'pending',
  subtotal            numeric(10,2)  not null check (subtotal >= 0),
  shipping_cost       numeric(10,2)  not null default 0 check (shipping_cost >= 0),
  total               numeric(10,2)  not null check (total >= 0),
  shipping_zone_id    uuid references public.shipping_zones(id) on delete set null,
  delivery_address_id uuid references public.addresses(id)      on delete set null,
  payment_method      payment_method not null default 'cod',
  payment_status      payment_status not null default 'pending',
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists orders_user_idx   on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);

-- Assign order_number on insert if the caller didn't supply one.
create or replace function public.set_order_number()
returns trigger language plpgsql as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := 'ORD-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.order_number_seq')::text, 3, '0');
  end if;
  return new;
end $$;

drop trigger if exists orders_set_number on public.orders;
create trigger orders_set_number before insert on public.orders
  for each row execute function public.set_order_number();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. order_items  (line items snapshot — price frozen at purchase)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id)   on delete cascade,
  product_id        uuid references public.products(id)          on delete set null,
  quantity          integer not null check (quantity > 0),
  price_at_purchase numeric(10,2) not null check (price_at_purchase >= 0),
  created_at        timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. payments  (one per order)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null unique references public.orders(id) on delete cascade,
  amount         numeric(10,2) not null check (amount >= 0),
  payment_method payment_method not null default 'cod',
  status         payment_status not null default 'pending',
  transaction_id text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. reviews  (Phase 2 — one per user per product)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id    uuid not null references auth.users(id)      on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  title      text,
  content    text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index if not exists reviews_product_idx on public.reviews(product_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═════════════════════════════════════════════════════════════════════════════
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

-- profiles: a user sees/edits their own row; admins see all.
create policy "profiles self read"   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles self insert" on public.profiles for insert with check (id = auth.uid());

-- Public catalog (categories, products, junction): anyone may read; only admins write.
create policy "categories public read" on public.categories for select using (true);
create policy "categories admin write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "products public read"   on public.products for select using (true);
create policy "products admin write"    on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "product_categories public read" on public.product_categories for select using (true);
create policy "product_categories admin write" on public.product_categories for all using (public.is_admin()) with check (public.is_admin());

-- Shipping config: public read-only; admins write.
create policy "shipping_zones public read" on public.shipping_zones for select using (true);
create policy "shipping_zones admin write" on public.shipping_zones for all using (public.is_admin()) with check (public.is_admin());

create policy "shipping_rates public read" on public.shipping_rates for select using (true);
create policy "shipping_rates admin write" on public.shipping_rates for all using (public.is_admin()) with check (public.is_admin());

-- addresses: owner-only; admins may read (for fulfilment).
create policy "addresses owner all"  on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "addresses admin read" on public.addresses for select using (public.is_admin());

-- cart_items: owner-only.
create policy "cart owner all" on public.cart_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- orders: owner reads/creates own; admins read & update all (status changes).
create policy "orders owner read"   on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders owner insert" on public.orders for insert with check (user_id = auth.uid());
create policy "orders admin update" on public.orders for update using (public.is_admin()) with check (public.is_admin());

-- order_items: visible/insertable when you own the parent order; admins read all.
create policy "order_items owner read" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);
create policy "order_items owner insert" on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- payments: visible when you own the parent order; admins read & update.
create policy "payments owner read" on public.payments for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);
create policy "payments owner insert" on public.payments for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "payments admin update" on public.payments for update using (public.is_admin()) with check (public.is_admin());

-- reviews: public read; users manage their own.
create policy "reviews public read" on public.reviews for select using (true);
create policy "reviews owner write" on public.reviews for all using (user_id = auth.uid()) with check (user_id = auth.uid());
