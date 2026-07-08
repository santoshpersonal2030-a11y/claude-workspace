import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminClient } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getAdminClient();
  if (!supabase) redirect('/');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-gold/40 pb-4">
        <span className="text-lg font-bold text-burgundy-dark">Admin</span>
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/admin" className="text-burgundy hover:underline">
            Dashboard
          </Link>
          <Link href="/admin/products" className="text-burgundy hover:underline">
            Products
          </Link>
          <Link href="/admin/orders" className="text-burgundy hover:underline">
            Orders
          </Link>
        </nav>
        <Link
          href="/"
          className="ml-auto text-sm text-burgundy-dark/60 hover:underline"
        >
          ← Back to store
        </Link>
      </div>
      {children}
    </div>
  );
}
