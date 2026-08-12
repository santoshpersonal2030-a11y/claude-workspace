import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { formatRupees } from '@/lib/format';
import type { Order } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/orders/${orderNumber}`);

  const { data } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, subtotal, shipping_fee, total, ship_full_name, ship_phone, ship_line1, ship_line2, ship_city, ship_state, ship_pincode, created_at, order_items(id, product_name, unit_price, quantity, line_total)',
    )
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (!data) notFound();
  const order = data as Order;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Confirmation banner */}
      <div className="rounded-2xl bg-gradient-to-r from-burgundy to-burgundy-dark p-6 text-cream">
        <p className="text-3xl">🙏</p>
        <h1 className="mt-2 text-xl font-bold text-gold">
          Thank you! Your order is placed.
        </h1>
        <p className="mt-1 text-sm text-cream/85">
          Order <span className="font-semibold">{order.order_number}</span> ·
          Cash on Delivery
        </p>
      </div>

      {/* Items */}
      <div className="mt-6 rounded-2xl border border-gold/40 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-burgundy-dark/70">
          Items
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {(order.order_items ?? []).map((it) => (
            <li key={it.id} className="flex justify-between text-sm">
              <span className="min-w-0 flex-1 text-burgundy-dark">
                {it.product_name} × {it.quantity}
              </span>
              <span className="ml-2 font-medium text-burgundy-dark">
                {formatRupees(it.line_total)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-gold/40 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-burgundy-dark/70">Subtotal</span>
            <span>{formatRupees(order.subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-burgundy-dark/70">Shipping</span>
            <span>
              {order.shipping_fee === 0
                ? 'FREE'
                : formatRupees(order.shipping_fee)}
            </span>
          </div>
          <div className="mt-3 flex justify-between border-t border-gold/40 pt-3 text-base font-bold text-burgundy">
            <span>Total (pay on delivery)</span>
            <span>{formatRupees(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      <div className="mt-4 rounded-2xl border border-gold/40 bg-white p-5 text-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-burgundy-dark/70">
          Delivering to
        </h2>
        <p className="mt-2 text-burgundy-dark">{order.ship_full_name}</p>
        <p className="text-burgundy-dark/80">{order.ship_phone}</p>
        <p className="text-burgundy-dark/80">
          {order.ship_line1}
          {order.ship_line2 ? `, ${order.ship_line2}` : ''}, {order.ship_city},{' '}
          {order.ship_state} — {order.ship_pincode}
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/account"
          className="rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-cream hover:bg-burgundy-dark"
        >
          View my orders
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-burgundy px-6 py-3 text-sm font-semibold text-burgundy hover:bg-burgundy hover:text-cream"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
