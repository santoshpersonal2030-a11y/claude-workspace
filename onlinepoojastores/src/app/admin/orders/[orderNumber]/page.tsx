import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { formatRupees } from '@/lib/format';
import StatusSelect from '../StatusSelect';
import type { Order, OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Row = Order & {
  ship_phone: string;
  profiles: { email: string | null } | null;
};

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, subtotal, shipping_fee, total, ship_full_name, ship_phone, ship_line1, ship_line2, ship_city, ship_state, ship_pincode, created_at, profiles(email), order_items(id, product_name, unit_price, quantity, line_total)',
    )
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (!data) notFound();
  const order = data as unknown as Row;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/orders" className="text-sm text-burgundy hover:underline">
        ← All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-burgundy-dark">
          {order.order_number}
        </h1>
        <StatusSelect orderId={order.id} current={order.status as OrderStatus} />
      </div>
      <p className="mt-1 text-sm text-burgundy-dark/60">
        Placed{' '}
        {new Date(order.created_at).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}{' '}
        · Cash on Delivery
      </p>

      <div className="mt-6 rounded-2xl border border-gold/40 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-burgundy-dark/70">
          Items
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {(order.order_items ?? []).map((it) => (
            <li key={it.id} className="flex justify-between text-sm">
              <span className="text-burgundy-dark">
                {it.product_name} × {it.quantity}
              </span>
              <span className="font-medium">{formatRupees(it.line_total)}</span>
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
            <span>Total</span>
            <span>{formatRupees(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-gold/40 bg-white p-5 text-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-burgundy-dark/70">
          Customer &amp; delivery
        </h2>
        <p className="mt-2 text-burgundy-dark">{order.ship_full_name}</p>
        <p className="text-burgundy-dark/80">{order.ship_phone}</p>
        {order.profiles?.email && (
          <p className="text-burgundy-dark/80">{order.profiles.email}</p>
        )}
        <p className="mt-2 text-burgundy-dark/80">
          {order.ship_line1}
          {order.ship_line2 ? `, ${order.ship_line2}` : ''}, {order.ship_city},{' '}
          {order.ship_state} — {order.ship_pincode}
        </p>
      </div>
    </div>
  );
}
