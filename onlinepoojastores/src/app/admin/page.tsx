import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { formatRupees } from '@/lib/format';

export const dynamic = 'force-dynamic';

const LOW_STOCK = 10;

export default async function AdminDashboard() {
  const supabase = await createServerSupabase();

  const [{ data: products }, { data: orders }, { data: items }] =
    await Promise.all([
      supabase.from('products').select('id, name, stock, is_active'),
      supabase
        .from('orders')
        .select('id, order_number, status, total, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('order_items').select('product_name, quantity'),
    ]);

  const productList = products ?? [];
  const orderList = orders ?? [];
  const itemList = (items ?? []) as { product_name: string; quantity: number }[];

  const revenue = orderList
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total), 0);
  const pending = orderList.filter((o) => o.status === 'pending').length;
  const lowStock = productList.filter(
    (p) => p.is_active && p.stock <= LOW_STOCK,
  );

  // Top sellers by units sold.
  const soldByName = new Map<string, number>();
  for (const it of itemList) {
    soldByName.set(
      it.product_name,
      (soldByName.get(it.product_name) ?? 0) + it.quantity,
    );
  }
  const topSellers = [...soldByName.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recentOrders = orderList.slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-burgundy-dark">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Orders" value={String(orderList.length)} />
        <Stat label="Revenue" value={formatRupees(revenue)} />
        <Stat label="New orders" value={String(pending)} accent />
        <Stat label="Products" value={String(productList.length)} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream hover:bg-burgundy-dark"
        >
          + Add product
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-lg border border-burgundy px-5 py-2.5 text-sm font-semibold text-burgundy hover:bg-burgundy hover:text-cream"
        >
          View orders
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {/* Top sellers */}
        <div className="rounded-xl border border-gold/40 bg-white p-5">
          <h2 className="text-sm font-semibold text-burgundy-dark">
            Top sellers (units)
          </h2>
          {topSellers.length === 0 ? (
            <p className="mt-2 text-sm text-burgundy-dark/60">No sales yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {topSellers.map(([name, qty]) => (
                <li key={name} className="flex justify-between">
                  <span className="min-w-0 truncate text-burgundy-dark/80">
                    {name}
                  </span>
                  <span className="ml-2 font-semibold text-burgundy">
                    {qty}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent orders */}
        <div className="rounded-xl border border-gold/40 bg-white p-5">
          <h2 className="text-sm font-semibold text-burgundy-dark">
            Recent orders
          </h2>
          {recentOrders.length === 0 ? (
            <p className="mt-2 text-sm text-burgundy-dark/60">No orders yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.order_number}`}
                    className="flex justify-between hover:underline"
                  >
                    <span className="text-burgundy">{o.order_number}</span>
                    <span className="font-semibold text-burgundy-dark">
                      {formatRupees(o.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="mt-4 rounded-xl border border-burgundy/30 bg-white p-5">
          <h2 className="text-sm font-semibold text-burgundy-dark">
            Low stock ({LOW_STOCK} or fewer)
          </h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span className="text-burgundy-dark/80">{p.name}</span>
                <span className="font-semibold text-burgundy">{p.stock} left</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent
          ? 'border-gold bg-gold-soft/60'
          : 'border-gold/40 bg-white'
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-burgundy-dark/60">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-burgundy">{value}</p>
    </div>
  );
}
