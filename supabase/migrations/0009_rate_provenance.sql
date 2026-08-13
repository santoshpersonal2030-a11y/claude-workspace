-- =============================================================================
-- WHERE EACH GST RATE CAME FROM
-- Run ONCE in the Supabase SQL Editor, after 0008_kit_gst_auto.sql.
--
-- WHY THIS EXISTS
-- Santosh has no CA and files his own returns (confirmed 13-Aug-2026). There is
-- no professional downstream to catch a wrong rate, and no one to ask in two
-- years why kumkum is 5% and not 18%.
--
-- Today a rate is a bare number. If ONE rate is ever questioned — by a notice,
-- by a future accountant, or by him — nothing distinguishes a researched rate
-- from a default nobody revisited. That means verifying one rate costs the
-- same as verifying all of them, so in practice none get verified.
--
-- Four columns fix that. A rate then carries its own justification.
--
-- ⚠️ A rate with no gst_rate_source is UNVERIFIED even when the number happens
-- to be right. A number nobody can account for is not a decision; it is a guess
-- that survived.
-- =============================================================================

do $guard$
begin
  if to_regclass('public.products') is null then
    raise exception 'WRONG DATABASE — nothing changed. No public.products table.';
  end if;
end
$guard$;


alter table public.products
  add column if not exists gst_rate_source text,
  add column if not exists gst_rate_note   text,
  add column if not exists gst_rate_set_at timestamptz,
  add column if not exists gst_rate_set_by text;

comment on column public.products.gst_rate_source is
  'Where this rate came from: ''GST portal'', ''notification 9/2025'', ''own reading'', ''AI table''. NULL means unverified — surface it in the GST health screen even if the number looks right.';
comment on column public.products.gst_rate_note is
  'Free text: the HSN reasoning, the notification, why this rate and not the other candidate.';
comment on column public.products.gst_rate_set_by is
  'Who or what set it — an admin email, or ''rate-import'' for a spreadsheet upload.';


-- ---------------------------------------------------------------------------
-- The receipt for each bulk upload, so "what did the March import change?" is
-- an answerable question rather than an archaeology exercise.
-- ---------------------------------------------------------------------------
create table if not exists public.rate_imports (
  id           uuid primary key default gen_random_uuid(),
  filename     text,
  uploaded_by  text,
  uploaded_at  timestamptz not null default now(),
  summary      text,
  -- The full before/after of every row touched. Kept as jsonb because the shape
  -- is a record of what happened, not something to query or join on.
  changes      jsonb not null default '[]'::jsonb
);

comment on table public.rate_imports is
  'One row per bulk GST-rate upload: what file, who, when, and the before/after of every product it changed.';

alter table public.rate_imports enable row level security;
-- No policy: readable and writable through the service role only. Rate history
-- is not customer-facing, and a table with RLS on and no policy denies everyone
-- else by default — which is the intent, stated rather than implied.


-- ---------------------------------------------------------------------------
-- Backfill the eleven rates corrected by hand on 13-Aug-2026, so they are not
-- indistinguishable from rates nobody ever looked at. Deliberately honest about
-- the source: an AI-compiled table that no CA has reviewed.
-- ---------------------------------------------------------------------------
update public.products
   set gst_rate_source = 'AI table (uncorroborated)',
       gst_rate_note   = 'Set 13-Aug-2026 from "Pooja items - Gst rates.xlsx". NOT reviewed by a CA. Kit rates were derived from placeholder descriptions and are provisional until real contents are entered.',
       gst_rate_set_at = timestamptz '2026-08-13 00:00:00+05:30',
       gst_rate_set_by = 'claude, approved by Santosh'
 where gst_rate_source is null
   and gst_rate <> 18;   -- anything still on 18% was never revisited; leave it unverified


-- =============================================================================
-- VERIFICATION — every row must read PASS.
-- =============================================================================
select * from (
  select 1 as n, 'the four provenance columns exist' as what,
         case when (select count(*) from information_schema.columns
                     where table_schema='public' and table_name='products'
                       and column_name in ('gst_rate_source','gst_rate_note','gst_rate_set_at','gst_rate_set_by')) = 4
              then 'PASS' else 'FAIL' end as result
  union all
  select 2, 'rate_imports receipt table exists',
         case when to_regclass('public.rate_imports') is not null then 'PASS' else 'FAIL' end
  union all
  select 3, 'rate_imports is not world-readable',
         case when (select relrowsecurity from pg_class where oid='public.rate_imports'::regclass)
              then 'PASS' else 'FAIL' end
  union all
  select 4, 'the corrected rates now carry a source',
         case when (select count(*) from public.products
                     where gst_rate <> 18 and gst_rate_source is null) = 0
              then 'PASS' else 'FAIL' end
  union all
  select 5, 'anything still at 18% is left marked UNVERIFIED',
         case when (select count(*) from public.products
                     where gst_rate = 18 and gst_rate_source is not null) = 0
              then 'PASS' else 'FAIL' end
) v order by n;

-- After running, this lists everything still unaccounted for:
--   select name, gst_rate from public.products where gst_rate_source is null order by name;
