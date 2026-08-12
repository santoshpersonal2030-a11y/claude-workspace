import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { formatRupees } from '@/lib/format';
import StatusSelect from './StatusSelect';
import type { OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  ship_full_name: string;
  profiles: { email: string | null } | null;
};

export default async function AdminOrders() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, total, created_at, ship_full_name, profiles(email)',
    )
    .order('created_at', { ascending: false });

  const orders = (data ?? []) as unknown as Row[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-burgundy-dark">Orders</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gold/40 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gold/40 text-left text-burgundy-dark/70">
              <th className="p-3 font-semibold">Order</th>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Customer</th>
              <th className="p-3 font-semibold">Total</th>
              <th className="p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gold/20 last:border-0">
                <td className="p-3">
                  <Link
                    href={`/admin/orders/${o.order_number}`}
                    className="font-semibold text-burgundy hover:underline"
                  >
                    {o.order_number}
                  </Link>
                </td>
                <td className="p-3 text-burgundy-dark/70">
                  {new Date(o.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="p-3 text-burgundy-dark">
                  {o.ship_full_name}
                  {o.profiles?.email && (
                    <span className="block text-xs text-burgundy-dark/60">
                      {o.profiles.email}
                    </span>
                  )}
                </td>
                <td className="p-3 font-semibold">{formatRupees(o.total)}</td>
                <td className="p-3">
                  <StatusSelect orderId={o.id} current={o.status} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-burgundy-dark/60">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
