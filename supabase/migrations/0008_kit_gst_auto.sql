-- =============================================================================
-- KIT GST RATE, CALCULATED FROM CONTENTS — never typed by hand
--
-- WHY
-- A kit sold for a single price is a MIXED SUPPLY under Section 8 CGST, and a
-- mixed supply takes the HIGHEST rate of any component. So a kit's rate is not
-- an opinion, it is arithmetic over its contents.
--
-- The kits currently in the catalogue are placeholders — Santosh, 13-Aug-2026:
-- "the kits what you have are the place holders so i do not know in the future
--  what will be added and what will be deleted from the kit, it should be
--  automatic calculation once an item is added."
--
-- Which is right, and is why the four kit rates set by hand on 13-Aug-2026 were
-- provisional: they were derived from placeholder descriptions. Once a kit has
-- real contents, this computes the rate and keeps computing it.
--
-- TWO DIRECTIONS, BOTH REQUIRED
--   1. Contents change  -> the kit recalculates.
--   2. A COMPONENT'S OWN RATE changes -> every kit containing it recalculates.
-- Without (2) the kits drift silently out of step with their own contents, which
-- is worse than today: they would look maintained while being wrong.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- GUARD — aborts everything if this is not the right database. An aborted
-- script changes nothing.
-- ---------------------------------------------------------------------------
do $guard$
begin
  if to_regclass('public.products') is null then
    raise exception 'WRONG DATABASE — nothing changed. No public.products table.';
  end if;
  if not exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='products' and column_name='gst_rate'
  ) then
    raise exception 'WRONG DATABASE — nothing changed. products has no gst_rate column.';
  end if;
end
$guard$;


-- ---------------------------------------------------------------------------
-- 1. What a kit contains
-- ---------------------------------------------------------------------------
create table if not exists public.kit_items (
  kit_id       uuid not null references public.products(id) on delete cascade,
  component_id uuid not null references public.products(id) on delete restrict,
  quantity     integer not null default 1 check (quantity > 0),
  created_at   timestamptz not null default now(),
  primary key (kit_id, component_id),
  -- A kit containing itself would make the rate calculation infinite.
  constraint kit_item_not_self check (kit_id <> component_id)
);

comment on table public.kit_items is
  'Components of a kit product. The kit''s gst_rate is DERIVED from these — see recalc_kit_gst().';

create index if not exists kit_items_component_idx on public.kit_items(component_id);

alter table public.kit_items enable row level security;

-- Readable by anyone (a customer may want to see what is in a kit); writable
-- only through the service role / admin, same posture as products.
drop policy if exists kit_items_read on public.kit_items;
create policy kit_items_read on public.kit_items for select using (true);


-- ---------------------------------------------------------------------------
-- 2. Mark which products are kits, and whether the rate is computed
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists is_kit boolean not null default false,
  add column if not exists gst_rate_derived boolean not null default false;

comment on column public.products.gst_rate_derived is
  'TRUE when gst_rate was computed from kit_items. FALSE means a human set it. A kit with NO components stays FALSE and keeps its manual rate — see recalc_kit_gst().';


-- ---------------------------------------------------------------------------
-- 3. The calculation
-- ---------------------------------------------------------------------------
create or replace function public.recalc_kit_gst(p_kit_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  top_rate numeric;
  n        integer;
begin
  select count(*), max(p.gst_rate)
    into n, top_rate
    from public.kit_items ki
    join public.products p on p.id = ki.component_id
   where ki.kit_id = p_kit_id;

  -- A kit with no components cannot be calculated. FAIL CLOSED: leave whatever
  -- a human set and mark it as NOT derived, so the admin screen can show it as
  -- unverified. Defaulting an empty kit to 0% would invent an exemption.
  if n = 0 or top_rate is null then
    update public.products
       set gst_rate_derived = false
     where id = p_kit_id and gst_rate_derived is distinct from false;
    return;
  end if;

  -- MIXED SUPPLY: the highest component rate wins.
  -- Guarded by IS DISTINCT FROM so an unchanged value writes nothing — that is
  -- what stops the products trigger below bouncing back into this function.
  update public.products
     set gst_rate = top_rate,
         gst_rate_derived = true
   where id = p_kit_id
     and (gst_rate is distinct from top_rate or gst_rate_derived is distinct from true);
end;
$$;


-- ---------------------------------------------------------------------------
-- 4a. Contents changed -> recalculate that kit
-- ---------------------------------------------------------------------------
create or replace function public.kit_items_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_kit_gst(old.kit_id);
    return old;
  end if;

  perform public.recalc_kit_gst(new.kit_id);
  -- An UPDATE that moves a component to a different kit must fix BOTH kits.
  if tg_op = 'UPDATE' and old.kit_id is distinct from new.kit_id then
    perform public.recalc_kit_gst(old.kit_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_kit_items_changed on public.kit_items;
create trigger trg_kit_items_changed
  after insert or update or delete on public.kit_items
  for each row execute function public.kit_items_changed();


-- ---------------------------------------------------------------------------
-- 4b. A COMPONENT'S rate changed -> recalculate every kit that contains it
--
-- This is the half that is easy to forget and the half that keeps the data
-- honest. Correct camphor from 5% to something else and every kit holding
-- camphor follows, in the same statement.
-- ---------------------------------------------------------------------------
create or replace function public.product_rate_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  k uuid;
begin
  if new.gst_rate is not distinct from old.gst_rate then
    return new;
  end if;

  for k in
    select distinct ki.kit_id
      from public.kit_items ki
     where ki.component_id = new.id
  loop
    perform public.recalc_kit_gst(k);
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_product_rate_changed on public.products;
create trigger trg_product_rate_changed
  after update of gst_rate on public.products
  for each row execute function public.product_rate_changed();


-- =============================================================================
-- VERIFICATION — every row must read PASS.
-- =============================================================================
select * from (
  select 1 as n, 'kit_items table exists' as what,
         case when to_regclass('public.kit_items') is not null then 'PASS' else 'FAIL' end as result
  union all
  select 2, 'a kit cannot contain itself',
         case when exists (select 1 from pg_constraint where conname = 'kit_item_not_self')
              then 'PASS' else 'FAIL' end
  union all
  select 3, 'contents-changed trigger is live',
         case when exists (select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid
                            where t.tgname='trg_kit_items_changed' and c.relname='kit_items'
                              and not t.tgisinternal) then 'PASS' else 'FAIL' end
  union all
  select 4, 'component-rate-changed trigger is live',
         case when exists (select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid
                            where t.tgname='trg_product_rate_changed' and c.relname='products'
                              and not t.tgisinternal) then 'PASS' else 'FAIL' end
  union all
  select 5, 'the calculation takes the HIGHEST component rate',
         case when position('max(p.gst_rate)' in
                regexp_replace(pg_get_functiondef('public.recalc_kit_gst'::regproc), E'--[^\n]*','','g'))>0
              then 'PASS' else 'FAIL' end
  union all
  select 6, 'an empty kit is NOT forced to 0%',
         case when position('n = 0 or top_rate is null' in
                pg_get_functiondef('public.recalc_kit_gst'::regproc))>0
              then 'PASS' else 'FAIL' end
  union all
  select 7, 'is_kit / gst_rate_derived columns added',
         case when (select count(*) from information_schema.columns
                     where table_schema='public' and table_name='products'
                       and column_name in ('is_kit','gst_rate_derived')) = 2
              then 'PASS' else 'FAIL' end
) v order by n;

-- =============================================================================
-- NOT DONE HERE, deliberately
--
-- 1. No kit contents are populated. The four kits keep the provisional rates set
--    by hand on 13-Aug-2026 and gst_rate_derived stays FALSE, which is the
--    honest state: "a human guessed this". They become calculated the moment
--    their real contents are entered.
--
-- 2. is_kit is not set on anything. Set it when kits are defined, so the admin
--    screen can make gst_rate read-only for kits — a derived value that someone
--    can still type over is not derived.
--
-- 3. HSN is not derived. A mixed supply arguably takes the HSN of its
--    highest-rated component, but every HSN in the source table is marked
--    "Verify HSN", so nothing is written rather than writing an unverified
--    classification.
-- =============================================================================
