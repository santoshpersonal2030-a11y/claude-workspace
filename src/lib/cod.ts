// Cash on Delivery — eligibility and fee.
//
// Pure functions, no database, no network, fully unit-tested (test/cod.test.ts). The rules live
// here rather than inside the checkout route for two reasons: they must be identical wherever
// they are asked (the product page, the cart, and the server that actually decides), and they are
// the part most worth testing.
//
// ⚠️ The checkout route does not call this yet. COD needs a payment_method column and an
// order_status value that means "confirmed, cash not yet collected", and the Supabase project is
// paused — see supabase/migrations/20260805_cod_and_guest_checkout.sql.
//
// ⚠️ SERVER-SIDE IS THE ONLY ANSWER THAT COUNTS. The cart may call this to decide whether to show
// the option, but the checkout must call it again and ignore whatever the browser claimed.
// Otherwise a ₹40,000 order becomes COD by editing one request.

/** Every threshold in one place, so changing the policy is one edit and not a hunt. */
export type CodPolicy = {
  /** Below this the delivery costs more than the margin if it is refused. In paise-free rupees. */
  minOrderValue: number;
  /** Above this the cash a courier carries — and the loss if refused — gets uncomfortable. */
  maxOrderValue: number;
  /** Charged to the customer for choosing COD. Set to 0 to absorb it. */
  fee: number;
  /** Pincodes COD is offered in. An EMPTY LIST MEANS NOWHERE, not everywhere — see below. */
  servicePincodes: string[];
  /** Turn the whole feature off without removing the code. */
  enabled: boolean;
};

/* ⚠️ PLACEHOLDER NUMBERS. These are not Santosh's decisions yet — they are defaults chosen so the
   function is testable, and every one of them is listed in the migration as needing his sign-off.
   `servicePincodes` is deliberately EMPTY: with no serviceability data anywhere in this project,
   the only safe default is to offer COD nowhere until someone says where. Failing closed on a
   payment method is the right direction to fail. */
export const DEFAULT_COD_POLICY: CodPolicy = {
  minOrderValue: 199,
  maxOrderValue: 5000,
  fee: 49,
  servicePincodes: [],
  enabled: false,
};

export type CodDecision =
  | { allowed: true; fee: number }
  | { allowed: false; fee: 0; reason: CodRefusal };

export type CodRefusal =
  | "disabled"
  | "below_minimum"
  | "above_maximum"
  | "pincode_not_served"
  | "invalid_pincode";

/** Indian pincodes are six digits and never start with zero. */
export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

/**
 * Decides whether an order may be paid for in cash, and what that costs.
 *
 * `subtotal` is the goods total BEFORE the COD fee — passing a total that already includes the
 * fee would let the fee push an order over maxOrderValue, which is the kind of ordering bug that
 * only shows up at the boundary.
 */
export function codEligibility(
  subtotal: number,
  pincode: string,
  policy: CodPolicy = DEFAULT_COD_POLICY,
): CodDecision {
  if (!policy.enabled) return { allowed: false, fee: 0, reason: "disabled" };
  if (!isValidPincode(pincode)) {
    return { allowed: false, fee: 0, reason: "invalid_pincode" };
  }
  if (subtotal < policy.minOrderValue) {
    return { allowed: false, fee: 0, reason: "below_minimum" };
  }
  if (subtotal > policy.maxOrderValue) {
    return { allowed: false, fee: 0, reason: "above_maximum" };
  }
  if (!policy.servicePincodes.includes(pincode.trim())) {
    return { allowed: false, fee: 0, reason: "pincode_not_served" };
  }
  return { allowed: true, fee: policy.fee };
}

/**
 * What the courier must collect at the door: goods + shipping + COD fee − discount.
 *
 * Store credit is deliberately absent. A COD order cannot redeem wallet credit — there is no
 * payment to offset it against, and debiting the wallet for cash that has not been handed over
 * would let someone spend the same credit twice.
 */
export function codAmountDue(parts: {
  subtotal: number;
  shipping: number;
  discount: number;
  codFee: number;
}): number {
  const due =
    parts.subtotal + parts.shipping + parts.codFee - parts.discount;
  return Math.max(0, due);
}
