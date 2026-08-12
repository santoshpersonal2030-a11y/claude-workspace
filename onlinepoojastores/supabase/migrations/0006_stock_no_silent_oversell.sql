-- =============================================================================
-- Online Pooja Stores — stop the silent oversell (supersedes 0002)
-- Run ONCE in the Supabase SQL Editor, after 0005_product_mrp.sql.
--
-- ⚠️ APPLY THIS TOGETHER WITH THE CODE CHANGE IN src/lib/orders.ts.
-- Applied alone it is still correct — it just turns a silent wrong answer into a
-- loud one at the last possible moment, after the customer has filled the form.
-- The code change is what refuses politely, before any money moves.
--
-- WHAT WAS WRONG
-- 0002 reduced stock like this:
--
--     set stock = greatest(0, stock - new.quantity)
--
-- "never below 0" reads as a safety net. It is the opposite. Sell three of
-- something you have one of and all three payments succeed, while the stock
-- afterwards reads a perfectly ordinary 0. Nothing anywhere records that two
-- customers are owed an item that does not exist. The money is real and the
-- shortfall is invisible — and an invisible shortfall cannot be reconciled,
-- refunded, or even counted. You find out from the customer.
--
-- THE SHARPEST PART: THE SAFETY NET WAS ALREADY THERE.
-- 0001_initial_schema.sql line 92 already declares:
--
--     stock integer not null default 0 check (stock >= 0)
--
-- The database has always been willing to refuse an oversell. greatest(0, ...)
-- is precisely what stopped it ever being asked: the value can never go
-- negative, so the constraint can never fire. The fix is therefore to DELETE
-- the clamp. Nothing new is being built here; a net that was strung slack is
-- being pulled tight.
--
-- HOW THIS VERSION WORKS
-- The decrement carries its own guard in the WHERE clause:
--
--     where id = ... and stock >= new.quantity
--
-- That single statement is atomic, so two customers checking out in the same
-- instant cannot both succeed — Postgres serialises the row update and the
-- second one matches no row. `not found` then raises, and the insert fails
-- rather than quietly recording a sale that cannot be fulfilled.
--
-- This is the same fix, and the same reasoning, as the sibling project's
-- 20260805_stock_reservation.sql. The fault was written twice because nothing
-- was watching either time. qa/checks.js section 1 is now watching.
-- =============================================================================

create or replace function public.decrement_stock_on_order_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
  pname     text;
begin
  if new.product_id is null then
    return new;
  end if;

  -- Atomic and guarded: the row is only updated when there is genuinely enough.
  -- No greatest(), no clamp, nothing that can absorb a shortfall in silence.
  update public.products
     set stock = stock - new.quantity
   where id = new.product_id
     and stock >= new.quantity;

  if not found then
    -- Report what is actually left, so the message can be honest about it.
    select stock, name into remaining, pname
      from public.products
     where id = new.product_id;

    if remaining is null then
      raise exception 'That product no longer exists.'
        using errcode = 'check_violation';
    end if;

    raise exception
      'Not enough stock for "%": % requested, % left.', pname, new.quantity, remaining
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_order_item_decrement_stock on public.order_items;
create trigger trg_order_item_decrement_stock
  after insert on public.order_items
  for each row execute function public.decrement_stock_on_order_item();

-- =============================================================================
-- WHAT THIS DOES NOT DO, stated rather than left to be discovered
--
-- 1. It does not put stock BACK when an order is cancelled or refunded. 0002
--    never did either, so this is not a regression — but it means every
--    cancellation quietly loses that stock, and the same number drives the
--    "in stock" badge on the shop. The sibling project had the identical hole
--    and it is worth fixing before launch, with one judgement call made
--    explicitly: a cancelled order that has already SHIPPED must not restock,
--    because those goods have physically left.
--
-- 2. It does not reserve stock while a customer is on the payment screen. Two
--    people can still race as far as the payment sheet; only one will get an
--    order. That is the correct trade-off for a shop this size — reservations
--    need a timeout and a sweeper, and an unswept reservation is its own bug.
-- =============================================================================
