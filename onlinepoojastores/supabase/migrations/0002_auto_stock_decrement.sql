-- =============================================================================
-- Online Pooja Stores — Auto stock reduction (Phase 2)
-- Run this ONCE in the Supabase SQL Editor, after 0001_initial_schema.sql.
--
-- When an order line is created, reduce that product's stock by the quantity
-- ordered (never below 0). This fires only through the normal checkout flow
-- (order_items can only be inserted for your own order), so customers can't
-- change stock directly — the trigger runs with elevated rights just for this.
-- =============================================================================

create or replace function public.decrement_stock_on_order_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.product_id is not null then
    update public.products
       set stock = greatest(0, stock - new.quantity)
     where id = new.product_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_order_item_decrement_stock on public.order_items;
create trigger trg_order_item_decrement_stock
  after insert on public.order_items
  for each row execute function public.decrement_stock_on_order_item();
