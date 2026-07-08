'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { getShippingZones } from '@/lib/data';
import { computeShipping } from '@/lib/shipping';

export type PlaceOrderInput = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  items: { slug: string; quantity: number }[];
};

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
};

export async function placeOrder(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Please sign in to place your order.' };
  if (!input.items.length) return { ok: false, error: 'Your cart is empty.' };

  // Re-read authoritative product data from the database — never trust prices
  // sent by the browser.
  const slugs = input.items.map((i) => i.slug);
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, slug, name, price, stock, is_active')
    .in('slug', slugs);

  if (pErr) return { ok: false, error: pErr.message };

  const bySlug = new Map<string, ProductRow>(
    ((products ?? []) as ProductRow[]).map((p) => [p.slug, p]),
  );

  const orderItems: {
    product_id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }[] = [];
  let subtotal = 0;

  for (const it of input.items) {
    const p = bySlug.get(it.slug);
    if (!p || !p.is_active) {
      return {
        ok: false,
        error: 'A product in your cart is no longer available.',
      };
    }
    const qty = Math.max(1, Math.floor(it.quantity));
    const lineTotal = Number(p.price) * qty;
    subtotal += lineTotal;
    orderItems.push({
      product_id: p.id,
      product_name: p.name,
      unit_price: Number(p.price),
      quantity: qty,
      line_total: lineTotal,
    });
  }

  // Shipping from the 3 zones (free over the threshold).
  const zones = await getShippingZones();
  const ship = computeShipping(zones, {
    pincode: input.pincode,
    state: input.state,
    subtotal,
  });
  const total = subtotal + ship.fee;

  // Create the order (order_number is filled in automatically by a trigger).
  const { data: order, error: oErr } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'pending',
      payment_method: 'cod',
      subtotal,
      shipping_fee: ship.fee,
      total,
      ship_full_name: input.fullName,
      ship_phone: input.phone,
      ship_line1: input.line1,
      ship_line2: input.line2 || null,
      ship_city: input.city,
      ship_state: input.state,
      ship_pincode: input.pincode,
    })
    .select('id, order_number')
    .single();

  if (oErr || !order) {
    return { ok: false, error: oErr?.message ?? 'Could not create your order.' };
  }

  const { error: iErr } = await supabase.from('order_items').insert(
    orderItems.map((oi) => ({ ...oi, order_id: order.id })),
  );
  if (iErr) return { ok: false, error: iErr.message };

  // One COD payment record per order (marked pending until delivered).
  await supabase.from('payments').insert({
    order_id: order.id,
    method: 'cod',
    status: 'pending',
    amount: total,
  });

  return { ok: true, orderNumber: order.order_number as string };
}
