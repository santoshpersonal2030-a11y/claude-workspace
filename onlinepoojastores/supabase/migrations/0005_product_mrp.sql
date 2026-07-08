-- =============================================================================
-- Online Pooja Stores — Product MRP / "compare at" price (Phase 2)
-- Run this ONCE in the Supabase SQL Editor, after the earlier migrations.
--
-- Adds an optional MRP (the original / struck-through price). When MRP is set
-- and higher than the selling price, the storefront shows the discount.
-- =============================================================================

alter table public.products
  add column if not exists mrp numeric(10, 2) check (mrp is null or mrp >= 0);
