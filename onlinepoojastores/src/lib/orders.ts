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
  /* Added 12-Aug-2026. Its absence here was half the overselling bug: the pricing query
     never asked for stock, so no order was ever refused before the money moved. */
  stock: number;
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
    .select('id, slug, name, price, is_active, stock')
    .in('slug', slugs);
  if (error) return { ok: false, error: error.message };

  const bySlug = new Map<string, ProductRow>(
    ((products ?? []) as ProductRow[]).map((p) => [p.slug, p]),
  );

  const orderItems: OrderLine[] = [];
  const short: string[] = [];
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

    /* STOCK, CHECKED BEFORE ANY MONEY MOVES.
       The database trigger will refuse an oversell outright, but that happens at the very end —
       after the customer has filled in the whole form and, for an online payment, after Razorpay
       has been opened. This is the polite half: it names what is short and how many are left,
       while they can still change it. Collected across every line rather than returning on the
       first, so a cart with two problems does not need two round trips to discover them. */
    const inStock = Number(p.stock ?? 0);
    if (inStock < qty) {
      short.push(
        inStock <= 0
          ? `${p.name} is sold out`
          : `${p.name}: only ${inStock} left`,
      );
      continue;
    }

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

  /* Refuse the whole cart if anything is short. Deliberately BEFORE shipping is computed and
     before an order row exists — nothing is created, so there is nothing to clean up. */
  if (short.length) {
    return {
      ok: false,
      error: `Some items are no longer available in the quantity you chose — ${short.join(
        ', ',
      )}. Please update your cart and try again.`,
    };
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
  if (iErr) {
    /* THE ORDER ROW IS ALREADY IN THE DATABASE AT THIS POINT.
       The order and its items are two separate statements, not one transaction, so a failure
       here leaves an order with no lines and no payment — which then shows up in the customer's
       history and on the admin screen as a real order that can never be fulfilled.
       That path went from theoretical to likely the moment the stock trigger started REFUSING
       an oversell instead of absorbing it (migration 0006): two people buying the last item in
       the same instant is exactly when this now fires. So the half-made order is removed before
       the error is returned.
       Best-effort: if the delete itself fails there is nothing further to do, and the original
       error is the one worth telling the customer about — not a cleanup failure they cannot act
       on. Stock is untouched either way, because the trigger only fires on a line that inserted
       successfully. */
    await supabase.from('orders').delete().eq('id', order.id);
    return { ok: false, error: iErr.message };
  }

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
