// Shared order logic used by both Cash-on-Delivery and online (Razorpay)
// checkout, so prices and totals are computed the SAME way for both. These are
// server-only helpers (they use the authenticated Supabase client).
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getShippingZones } from './data';
import { computeShipping } from './shipping';
import { sendOrderConfirmation } from './email';

export type OrderInput = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
  guestEmail: string;
  saveNewAddress: boolean;
  items: { slug: string; quantity: number }[];
};

export type OrderLine = {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type PricedOrder = {
  orderItems: OrderLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  is_active: boolean;
};

// Re-read product prices from the database (never trust the browser) and
// compute subtotal, shipping and total.
export async function validateAndPrice(
  supabase: SupabaseClient,
  input: OrderInput,
): Promise<{ ok: true; priced: PricedOrder } | { ok: false; error: string }> {
  if (!input.items.length) return { ok: false, error: 'Your cart is empty.' };

  const slugs = input.items.map((i) => i.slug);
  const { data: products, error } = await supabase
    .from('products')
    .select('id, slug, name, price, is_active')
    .in('slug', slugs);
  if (error) return { ok: false, error: error.message };

  const bySlug = new Map<string, ProductRow>(
    ((products ?? []) as ProductRow[]).map((p) => [p.slug, p]),
  );

  const orderItems: OrderLine[] = [];
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
    const line = Number(p.price) * qty;
    subtotal += line;
    orderItems.push({
      product_id: p.id,
      product_name: p.name,
      unit_price: Number(p.price),
      quantity: qty,
      line_total: line,
    });
  }

  const zones = await getShippingZones();
  const ship = computeShipping(zones, {
    pincode: input.pincode,
    state: input.state,
    subtotal,
  });

  return {
    ok: true,
    priced: {
      orderItems,
      subtotal,
      shippingFee: ship.fee,
      total: subtotal + ship.fee,
    },
  };
}

// Create the order, its line items, and the payment record.
export async function insertOrder(
  supabase: SupabaseClient,
  userId: string,
  input: OrderInput,
  priced: PricedOrder,
  payment: {
    method: 'cod' | 'razorpay';
    status: 'pending' | 'paid';
    providerOrderId?: string;
    providerPaymentId?: string;
  },
): Promise<
  { ok: true; orderId: string; orderNumber: string } | { ok: false; error: string }
> {
  const { data: order, error: oErr } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      status: payment.status === 'paid' ? 'confirmed' : 'pending',
      payment_method: payment.method,
      subtotal: priced.subtotal,
      shipping_fee: priced.shippingFee,
      total: priced.total,
      ship_full_name: input.fullName,
      ship_phone: input.phone,
      ship_line1: input.line1,
      ship_line2: input.line2 || null,
      ship_city: input.city,
      ship_state: input.state,
      ship_pincode: input.pincode,
      notes: input.notes || null,
    })
    .select('id, order_number')
    .single();

  if (oErr || !order) {
    return { ok: false, error: oErr?.message ?? 'Could not create your order.' };
  }

  const { error: iErr } = await supabase
    .from('order_items')
    .insert(priced.orderItems.map((oi) => ({ ...oi, order_id: order.id })));
  if (iErr) return { ok: false, error: iErr.message };

  // Only attach provider_* columns when they exist (online payments). This
  // keeps Cash-on-Delivery working even before migration 0003 is applied.
  const paymentRow: Record<string, unknown> = {
    order_id: order.id,
    method: payment.method,
    status: payment.status,
    amount: priced.total,
    paid_at: payment.status === 'paid' ? new Date().toISOString() : null,
  };
  if (payment.providerOrderId) paymentRow.provider_order_id = payment.providerOrderId;
  if (payment.providerPaymentId)
    paymentRow.provider_payment_id = payment.providerPaymentId;
  await supabase.from('payments').insert(paymentRow);

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.order_number as string,
  };
}

// Guest-email capture, optional address save, and confirmation email.
export async function finalizeExtras(
  supabase: SupabaseClient,
  user: User,
  input: OrderInput,
  priced: PricedOrder,
  orderNumber: string,
): Promise<void> {
  const contactEmail = user.email || input.guestEmail;

  if (!user.email && input.guestEmail) {
    await supabase
      .from('profiles')
      .update({ email: input.guestEmail, full_name: input.fullName })
      .eq('id', user.id);
  }

  if (input.saveNewAddress) {
    await supabase.from('addresses').insert({
      user_id: user.id,
      label: 'home',
      full_name: input.fullName,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2 || null,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      is_default: false,
    });
  }

  if (contactEmail) {
    await sendOrderConfirmation({
      to: contactEmail,
      orderNumber,
      items: priced.orderItems.map((oi) => ({
        name: oi.product_name,
        quantity: oi.quantity,
        lineTotal: oi.line_total,
      })),
      subtotal: priced.subtotal,
      shippingFee: priced.shippingFee,
      total: priced.total,
      shipName: input.fullName,
    });
  }
}
