import { getShippingZones } from '@/lib/data';
import { createServerSupabase } from '@/lib/supabase/server';
import CheckoutForm from './CheckoutForm';
import type { Address, ShippingZone } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  let zones: ShippingZone[] = [];
  try {
    zones = await getShippingZones();
  } catch {
    // Shipping still computes to the default zone if this fails.
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isRealUser = !!user && !user.is_anonymous;

  let addresses: Address[] = [];
  if (isRealUser) {
    const { data } = await supabase
      .from('addresses')
      .select(
        'id, label, full_name, phone, line1, line2, city, state, pincode, is_default',
      )
      .order('is_default', { ascending: false });
    addresses = (data ?? []) as Address[];
  }

  return (
    <CheckoutForm
      zones={zones}
      savedAddresses={addresses}
      signedIn={isRealUser}
      userEmail={isRealUser ? (user?.email ?? '') : ''}
    />
  );
}
