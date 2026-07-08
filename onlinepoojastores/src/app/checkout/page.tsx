import { getShippingZones } from '@/lib/data';
import CheckoutForm from './CheckoutForm';
import type { ShippingZone } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  let zones: ShippingZone[] = [];
  try {
    zones = await getShippingZones();
  } catch {
    // Shipping still computes to the default zone if this fails.
  }
  return <CheckoutForm zones={zones} />;
}
