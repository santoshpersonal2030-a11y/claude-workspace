-- Stock integrity: stop the store overselling.
--
-- ⚠️ NOT APPLIED. Written 05-Aug-2026 against a PAUSED Supabase project, so none of this has been
-- run or tested anywhere. It is the database half of the fix; the application half (a stock check
-- in /api/checkout before payment, and oversell reporting in finalizeOrderPaid) is already live
-- and works without this file. Apply this when the project is restored, on a branch first.
--
-- ── WHAT WAS WRONG ─────────────────────────────────────────────────────────────────────────────
-- Stock was only ever touched after a payment succeeded, by:
--
--     update products p set stock = greatest(p.stock - oi.quantity, 0) ...
--
-- Two separate faults in one line:
--
--   1. Nothing checked that the stock existed. Sell three of an item you have one of and all
--      three payments go through.
--   2. `greatest(..., 0)` clamps the result at zero, so afterwards the row reads a perfectly
--      ordinary `stock = 0`. Nothing anywhere records that two units are owed. The money is real
--      and the shortfall is invisible — the worst possible combination.
--
-- ── WHAT THIS DOES ─────────────────────────────────────────────────────────────────────────────
--   1. A `stock >= 0` constraint, so the database itself refuses to go negative rather than
--      quietly rounding the problem away.
--   2. reserve_stock_for_order(): an ATOMIC check-and-decrement that raises rather than overselling.
--   3. release_stock_for_order(): the reverse, for a cancelled or abandoned order.
--
-- ── THE APPLICATION CHANGE THAT MUST GO WITH IT ────────────────────────────────────────────────
-- These are NOT done, deliberately — they change when money and stock move relative to each other
-- and that is not something to write blind against a database nobody can run:
--
--   a. src/app/api/checkout/route.ts — call reserve_stock_for_order() straight after inserting
--      order_items, before creating the Razorpay order. Stock is then committed the moment the
--      order exists, which is what actually closes the race. Map the INSUFFICIENT_STOCK error to
--      the same 409 the route already returns.
--   b. src/lib/payments.ts — STOP calling decrement_stock_for_order() in finalizeOrderPaid().
--      With (a) in place, leaving it would decrement twice.
--   c. A scheduled job to call release_stock_for_order() for orders still `pending` after, say,
--      30 minutes — otherwise an abandoned checkout holds stock for ever. The project already has
--      six cron routes; this belongs beside the abandoned-cart one.
--
-- Doing (a) and (b) without (c) trades overselling for stock that leaks away. All three, or none.

-- ───────────────────────────────────────────────────────────────────────────────────────────────
-- 1. The database refuses to go negative.
--    Safe to add: the old clamp means no existing row can be below zero.
alter table public.products
  drop constraint if exists products_stock_non_negative;
alter table public.products
  add constraint products_stock_non_negative check (stock >= 0);

-- ───────────────────────────────────────────────────────────────────────────────────────────────
-- 2. Atomic reserve. Raises INSUFFICIENT_STOCK instead of overselling.
create or replace function public.reserve_stock_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r record;
begin
  -- Lock every product in the order, ordered by id. The ordering is not decoration: two orders
  -- containing the same two products in opposite sequence will deadlock without it.
  for r in
    select oi.product_id, sum(oi.quantity)::int as qty, p.name, p.stock
    from order_items oi
    join products p on p.id = oi.product_id
    where oi.order_id = p_order_id
    group by oi.product_id, p.name, p.stock
    order by oi.product_id
    for update of p
  loop
    if r.stock < r.qty then
      raise exception 'INSUFFICIENT_STOCK: % has %, order needs %', r.name, r.stock, r.qty
        using errcode = 'check_violation';
    end if;
  end loop;

  -- Every line checked under the same lock, so this cannot now fail.
  update products p
  set stock = p.stock - agg.qty,
      updated_at = now()
  from (
    select product_id, sum(quantity)::int as qty
    from order_items
    where order_id = p_order_id
    group by product_id
  ) agg
  where agg.product_id = p.id;
end;
$$;

comment on function public.reserve_stock_for_order(uuid) is
  'Atomically checks and decrements stock for every line of an order. Raises INSUFFICIENT_STOCK if any line cannot be filled. Call at order creation, BEFORE taking payment.';

-- ───────────────────────────────────────────────────────────────────────────────────────────────
-- 3. Give it back — cancelled orders, and checkouts that were never paid.
create or replace function public.release_stock_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update products p
  set stock = p.stock + agg.qty,
      updated_at = now()
  from (
    select product_id, sum(quantity)::int as qty
    from order_items
    where order_id = p_order_id
    group by product_id
  ) agg
  where agg.product_id = p.id;
end;
$$;

comment on function public.release_stock_for_order(uuid) is
  'Returns an order''s reserved stock. For cancellations and for expiring unpaid orders. NOT idempotent — the caller must ensure it runs once per order.';

-- ───────────────────────────────────────────────────────────────────────────────────────────────
-- 4. The old function stays, unchanged, so nothing breaks the moment this is applied.
--    Delete it only once src/lib/payments.ts has stopped calling it (change (b) above).
comment on function public.decrement_stock_for_order(uuid) is
  'SUPERSEDED by reserve_stock_for_order. Clamps at zero, so it can oversell silently. Kept only until finalizeOrderPaid() stops calling it.';

-- ───────────────────────────────────────────────────────────────────────────────────────────────
-- 5. Not fixed here, because it needs a business decision rather than a function:
--    the admin "edit order item" and "remove order item" actions in
--    src/app/[locale]/admin/actions.ts change quantities on a PAID order and never touch stock.
--    Removing a line from a paid order should probably restock it — but only if it has not
--    shipped, and that is Santosh's call, not something to encode silently.
