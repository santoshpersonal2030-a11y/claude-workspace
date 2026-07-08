import type { ShippingZone } from './types';

export type ShippingResult = {
  zone: ShippingZone | null;
  fee: number;
  freeApplied: boolean;
};

// Decide which shipping zone a delivery falls into, and the fee.
//   Zone 1: pincode within [pincode_start, pincode_end]  (Hyderabad)
//   Zone 2: state matches                                (rest of Telangana)
//   Zone 3: is_default catch-all                         (rest of India)
// Free shipping when the order subtotal reaches the zone's free_above amount.
export function computeShipping(
  zones: ShippingZone[],
  opts: { pincode: string; state: string; subtotal: number },
): ShippingResult {
  const pin = parseInt(opts.pincode.replace(/\D/g, ''), 10);
  const state = opts.state.trim().toLowerCase();

  const sorted = [...zones].sort((a, b) => a.priority - b.priority);

  let matched: ShippingZone | null = null;
  for (const z of sorted) {
    if (z.pincode_start != null && z.pincode_end != null) {
      if (!Number.isNaN(pin) && pin >= z.pincode_start && pin <= z.pincode_end) {
        matched = z;
        break;
      }
    } else if (z.state) {
      if (state && z.state.trim().toLowerCase() === state) {
        matched = z;
        break;
      }
    } else if (z.is_default) {
      matched = z;
      break;
    }
  }

  // Fall back to the default zone if nothing else matched.
  if (!matched) matched = sorted.find((z) => z.is_default) ?? null;

  if (!matched) return { zone: null, fee: 0, freeApplied: false };

  const freeApplied = opts.subtotal >= matched.free_above;
  return {
    zone: matched,
    fee: freeApplied ? 0 : matched.rate,
    freeApplied,
  };
}
