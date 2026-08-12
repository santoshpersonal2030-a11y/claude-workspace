-- =============================================================================
-- Online Pooja Stores — put stock back when an order is cancelled
-- Run ONCE in the Supabase SQL Editor, after 0006_stock_no_silent_oversell.sql.
--
-- WHAT WAS WRONG
-- Stock came down when an order was placed and never went back up. Cancel an
-- order and those units were gone from the count for good. The same number
-- drives the "in stock" figure on the shop, the admin list and — since 0006 —
-- whether a customer is allowed to buy at all. So every cancellation made the
-- shop a little more sold-out than it really was, permanently and invisibly.
-- Cancel enough and real stock sits on a shelf that the site refuses to sell.
--
-- Nothing was broken by 0006; this hole predates it. But 0006 made it MATTER
-- more: before, an understated count merely looked wrong, and now it actively
-- turns customers away.
--
-- =============================================================================
-- THE JUDGEMENT CALL, MADE EXPLICITLY RATHER THAN BY DEFAULT
--
-- Restocking is only correct while the goods are still on your shelf.
--
--   pending / confirmed / processing  ->  RESTOCK. Nothing has been dispatched.
--   shipped / delivered               ->  DO NOT. Those goods have physically
--                                         left. Adding them back invents
--                                         inventory you do not have, and the
--                                         next customer is then refused or
--                                         oversold against a phantom.
--   returned                          ->  DO NOT, deliberately. The goods came
--                                         back, but whether they can be sold
--                                         again is a human decision — the box
--                                         has to be opened first. Auto-
--                                         restocking a damaged or opened item
--                                         is how a shop sells something it
--                                         cannot ship. An admin can raise the
--                                         count by hand once they have looked.
--
-- This mirrors the same decision taken on the sibling project, for the same
-- reason: auto-restocking a shipped order would invent inventory.
--
-- IDEMPOTENT ON PURPOSE
-- `stock_restored_at` records that a given order has already been put back, so
-- cancelling twice — or cancelled -> pending -> cancelled — cannot inflate the
-- count. Without it, the obvious "fix" for a missing restock is to cancel the
-- order again, which would quietly create stock out of nothing.
-- =============================================================================

alter table public.orders
  add column if not exists stock_restored_at timestamptz;

comment on column public.orders.stock_restored_at is
  'When this order''s stock was returned to inventory after cancellation. Null means it never was. Guards against double-restocking.';

create or replace function public.restock_on_order_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only on the transition INTO cancelled, and only from a state where the
  -- goods are still with us.
  if new.status = 'cancelled'
     and old.status is distinct from 'cancelled'
     and old.status in ('pending', 'confirmed', 'processing')
     and new.stock_restored_at is null
  then
    update public.products p
       set stock = p.stock + oi.quantity
      from public.order_items oi
     where oi.order_id = new.id
       and oi.product_id = p.id;

    -- Set on NEW inside a BEFORE trigger: no second UPDATE on orders, so this
    -- cannot recurse into itself.
    new.stock_restored_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_order_restock_on_cancel on public.orders;
create trigger trg_order_restock_on_cancel
  before update on public.orders
  for each row execute function public.restock_on_order_cancel();

-- =============================================================================
-- NOT BACKFILLED, and that is deliberate.
--
-- Orders cancelled BEFORE this migration never had their stock returned, and
-- this does not go back and fix them. Two reasons:
--   1. There is no record of which of them were pre-dispatch, so a blanket
--      backfill would restock shipped goods and invent inventory — the exact
--      thing the rule above exists to prevent.
--   2. Silently changing historical stock is indistinguishable from a bug when
--      someone later checks the numbers.
-- To find them and decide by hand:
--
--   select id, order_number, status, created_at
--     from public.orders
--    where status = 'cancelled' and stock_restored_at is null
--    order by created_at;
-- =============================================================================
