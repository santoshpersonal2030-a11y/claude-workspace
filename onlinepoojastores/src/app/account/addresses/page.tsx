import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import type { Address } from '@/lib/types';
import AddressManager from './AddressManager';

export const dynamic = 'force-dynamic';

export default async function AddressesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/addresses');

  const { data } = await supabase
    .from('addresses')
    .select('id, label, full_name, phone, line1, line2, city, state, pincode, is_default')
    .order('is_default', { ascending: false });

  const addresses = (data ?? []) as Address[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/account" className="text-sm text-burgundy hover:underline">
        ← Back to account
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-burgundy-dark">
        Saved addresses
      </h1>
      <p className="mt-1 text-sm text-burgundy-dark/70">
        These show up at checkout so you don’t have to retype them.
      </p>
      <AddressManager addresses={addresses} />
    </div>
  );
}
