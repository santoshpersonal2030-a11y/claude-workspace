'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import {
  validateAndPrice,
  insertOrder,
  finalizeExtras,
  type OrderInput,
} from '@/lib/orders';

export type PlaceOrderInput = OrderInput;

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

// Cash-on-Delivery order placement.
export async function placeOrder(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Please sign in to place your order.' };

  const priced = await validateAndPrice(supabase, input);
  if (!priced.ok) return { ok: false, error: priced.error };

  const created = await insertOrder(supabase, user.id, input, priced.priced, {
    method: 'cod',
    status: 'pending',
  });
  if (!created.ok) return { ok: false, error: created.error };

  await finalizeExtras(supabase, user, input, priced.priced, created.orderNumber);

  return { ok: true, orderNumber: created.orderNumber };
}
