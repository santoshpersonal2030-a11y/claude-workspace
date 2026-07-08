import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { formatRupees } from '@/lib/format';
import SignOutButton from '@/components/SignOutButton';
import type { Order } from '@/lib/types';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export default async function AccountPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this, but double-check.
  if (!user) redirect('/login?next=/account');

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total, created_at')
    .order('created_at', { ascending: false });

  const list = (orders ?? []) as Order[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-burgundy-dark">My account</h1>
          <p className="mt-1 text-sm text-burgundy-dark/70">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-4 flex gap-4 text-sm">
        <Link
          href="/account/addresses"
          className="font-medium text-burgundy hover:underline"
        >
          Saved addresses →
        </Link>
        <Link
          href="/wishlist"
          className="font-medium text-burgundy hover:underline"
        >
          Wishlist →
        </Link>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-burgundy-dark">
        Order history
      </h2>

      {list.length === 0 ? (
        <div className="mt-4 rounded-xl border border-gold/40 bg-white p-6 text-sm text-burgundy-dark/70">
          You haven’t placed any orders yet.{' '}
          <Link href="/" className="font-semibold text-burgundy underline">
            Start shopping
          </Link>
          .
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {list.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.order_number}`}
                className="flex items-center justify-between rounded-xl border border-gold/40 bg-white p-4 transition hover:border-burgundy"
              >
                <div>
                  <p className="font-semibold text-burgundy-dark">
                    {o.order_number}
                  </p>
                  <p className="text-xs text-burgundy-dark/60">
                    {new Date(o.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    · {STATUS_LABEL[o.status] ?? o.status}
                  </p>
                </div>
                <span className="font-bold text-burgundy">
                  {formatRupees(o.total)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
