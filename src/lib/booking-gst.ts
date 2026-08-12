import { splitGst } from "./gst.ts";

/* GST on a POOJA BOOKING receipt — which is not the same question as GST on a store order.
 *
 * WHY THIS FILE EXISTS. Until 12-Aug-2026 the booking receipt printed one blanket line —
 * "Religious services are GST-exempt" — and charged no GST on anything. That is correct for the
 * dakshina and NOT correct for the samagri kit, which is goods. The identical kit sold through
 * /store carries GST, an HSN code and an e-invoice; sold as part of a booking it carried none.
 * The same item was being taxed two different ways depending on which button the customer
 * pressed, and only one of those can be right.
 *
 * WHAT THE LAW SAYS (researched 12-Aug-2026, sources in docs/SESSION-12-AUG.md):
 *
 *   1. Entry 13(a) of Notification 12/2017-Central Tax (Rate) exempts "services by a person by
 *      way of conduct of any religious ceremony". No trust registration is needed for 13(a) —
 *      that condition belongs to 13(b), renting of religious precincts. So the dakshina is
 *      exempt. That part of the old footnote was right.
 *
 *   2. Section 8 CGST decides what happens when things are supplied together:
 *        - COMPOSITE supply (naturally bundled, one principal supply) takes the principal
 *          supply's rate. Exempt principal ⇒ the whole bundle is exempt.
 *        - MIXED supply takes the HIGHEST rate of any component — but the definition requires
 *          the components to be sold "for a single price".
 *
 *   3. This booking is neither. The kit is OPTIONAL (a checkbox), SEPARATELY PRICED (₹1,500 and
 *      ₹751 on their own lines) and SEPARATELY AVAILABLE (the same kit is in the store). Where
 *      the price is "the visible aggregation of individual prices" rather than one amount, each
 *      component is an individual supply taxed on its own merits.
 *
 *   ⇒ The ceremony is exempt. The kit is taxable at its own rate. Two supplies, one receipt.
 *
 * ⚠️ WHAT THIS DELIBERATELY DOES NOT DO: pick the rate.
 * Every product in the store is set to 18%, and that is a June default nobody chose — real
 * samagri is a mix (agarbatti is widely 5%). Copying 18% onto a tax document because it is the
 * number lying around is exactly the mistake the fake GSTIN was. So the rate ships UNSET and the
 * receipt says what it can support and no more. Santosh's accountant sets it. Fail closed.
 *
 * ⚠️ AND IT NEVER CHANGES THE TOTAL. Prices here are GST-INCLUSIVE, exactly as the store treats
 * them (see splitGst). Disclosing the tax already inside ₹751 does not add a rupee to what the
 * customer owes. A receipt is a description of a transaction, not a new one.
 */

/** The GST rate on a booking's samagri kit. Unset until someone qualified sets it. */
export function samagriGstRate(): number | null {
  const raw = process.env.NEXT_PUBLIC_BOOKING_SAMAGRI_GST_RATE;
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number(raw);
  // A malformed value must not silently become 0% — that reads as "exempt", which is the claim
  // this whole file exists to stop the receipt making without evidence.
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}

export type BookingTax = {
  /** The dakshina, exempt under Entry 13(a). */
  serviceExempt: true;
  /** Null when no rate is configured — the receipt must then make NO claim about the kit. */
  samagri: { rate: number; taxable: number; tax: number } | null;
};

/** Works out what a booking receipt may honestly say about tax. Totals are never altered. */
export function bookingTax(samagriInclusive: number): BookingTax {
  const rate = samagriGstRate();
  if (rate === null || samagriInclusive <= 0) {
    return { serviceExempt: true, samagri: null };
  }
  const { taxable, tax } = splitGst(samagriInclusive, rate);
  return { serviceExempt: true, samagri: { rate, taxable, tax } };
}
