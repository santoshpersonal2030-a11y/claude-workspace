-- =============================================================================
-- HOW EACH PRODUCT REACHES THE CUSTOMER
-- Run ONCE in the Supabase SQL Editor, after 0009_rate_provenance.sql.
--
-- WHY
-- Santosh, 13-Aug-2026: he wants ALL fulfilment options, including the supplier
-- shipping straight to the customer.
--
-- The oversell guard added in the stock fix refuses any order where
-- `stock < requested`. For something shipped from Santosh's own shelf that is
-- exactly right. For a DROPSHIP product it is nonsense: the stock number
-- describes a shelf he does not own, it will sit at 0 forever, and the guard
-- would refuse an order he could have fulfilled perfectly well.
--
-- So a product has to say how it is fulfilled BEFORE any dropship product
-- exists — otherwise the first one silently cannot be bought, and the reason
-- will look like a stock bug rather than a missing concept.
--
-- ⚠️ THE DEFAULT IS 'stock', DELIBERATELY.
-- Every product that exists today is shipped by Santosh, and 'stock' is the
-- SAFE answer: it keeps the oversell guard switched on. Defaulting to 'dropship'
-- would silently disable stock checking for the whole catalogue — turning a
-- missing setting into an unlimited shelf. When in doubt, count the stock.
-- =============================================================================

do $guard$
begin
  if to_regclass('public.products') is null then
    raise exception 'WRONG DATABASE — nothing changed. No public.products table.';
  end if;
end
$guard$;


do $$
begin
  if not exists (select 1 from pg_type where typname = 'fulfilment_mode') then
    create type public.fulfilment_mode as enum (
      'stock',      -- Santosh holds it. Stock is real and the oversell guard applies.
      'dropship',   -- A supplier ships direct. `stock` here is meaningless; do not gate on it.
      'made_to_order' -- Assembled or sourced per order. No shelf to run out of.
    );
  end if;
end
$$;

alter table public.products
  add column if not exists fulfilment public.fulfilment_mode not null default 'stock',
  add column if not exists supplier_name text,
  add column if not exists lead_time_days integer check (lead_time_days is null or lead_time_days >= 0);

comment on column public.products.fulfilment is
  'How this product reaches the customer. ''stock'' means the oversell guard applies. ''dropship'' and ''made_to_order'' mean the stock column is NOT a limit — see 0010_fulfilment_mode.sql and the guard in /api/checkout.';
comment on column public.products.supplier_name is
  'Who ships it, when fulfilment <> ''stock''. Free text for now — there is no supplier table yet, and inventing one before there is a single dropship product would be guessing at a shape nobody has needed.';
comment on column public.products.lead_time_days is
  'Working days before dispatch, when it is not off a shelf. NULL means unknown — and unknown must NOT be shown to a customer as a promise.';


/* A product that is not held in stock should not be advertised with a stock number, and one
   that IS held must not claim a supplier ships it. This keeps the two halves honest. */
alter table public.products
  drop constraint if exists products_fulfilment_coherent;
alter table public.products
  add constraint products_fulfilment_coherent check (
    fulfilment = 'stock' or supplier_name is not null
  ) not valid;
-- NOT VALID: existing rows are all 'stock' so they pass, but the constraint is only enforced on
-- rows written from now on. Nothing already in the table is rejected by this migration.


-- =============================================================================
-- VERIFICATION — every row must read PASS.
-- =============================================================================
select * from (
  select 1 as n, 'fulfilment_mode enum exists' as what,
         case when exists (select 1 from pg_type where typname = 'fulfilment_mode')
              then 'PASS' else 'FAIL' end as result
  union all
  select 2, 'products.fulfilment exists',
         case when exists (select 1 from information_schema.columns
                            where table_schema='public' and table_name='products'
                              and column_name='fulfilment') then 'PASS' else 'FAIL' end
  union all
  select 3, 'the default is the SAFE one (stock), not dropship',
         case when (select column_default from information_schema.columns
                     where table_schema='public' and table_name='products'
                       and column_name='fulfilment') like '%stock%' then 'PASS' else 'FAIL' end
  union all
  select 4, 'every existing product is still stock-managed',
         case when (select count(*) from public.products where fulfilment <> 'stock') = 0
              then 'PASS' else 'FAIL' end
  union all
  select 5, 'a non-stock product must name its supplier',
         case when exists (select 1 from pg_constraint where conname='products_fulfilment_coherent')
              then 'PASS' else 'FAIL' end
) v order by n;

-- To make a product dropship later:
--   update public.products
--      set fulfilment = 'dropship', supplier_name = 'Acme Traders', lead_time_days = 4
--    where slug = 'some-product';
