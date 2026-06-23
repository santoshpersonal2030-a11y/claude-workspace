// Pure GST helpers shared by the invoice PDF, the on-screen invoice and the
// GST-return exports. Product prices are stored GST-inclusive, so tax is backed
// out of the line value. An order-level discount (a store coupon) must reduce
// the *taxable* value under GST law, so it is apportioned across the lines in
// proportion to each line's value *before* GST is separated out — otherwise the
// invoice would charge tax on money the customer never paid.

// GST-inclusive value of a single line after an order-level discount has been
// apportioned to it proportionally to line value. Pure ratio (may be
// fractional) — use it for aggregate reports where sub-rupee drift is immaterial.
export function discountedInclusive(
  lineTotal: number,
  subtotal: number,
  discount: number,
): number {
  if (!discount || subtotal <= 0) return lineTotal;
  const d = Math.min(discount, subtotal); // a coupon can never exceed the goods value
  return lineTotal - (d * lineTotal) / subtotal;
}

// Back GST out of a GST-inclusive value at the given rate (%), rounded to the
// rupee. taxable + tax === round(inclusive).
export function splitGst(inclusive: number, rate: number): {
  taxable: number;
  tax: number;
} {
  const whole = Math.round(inclusive);
  const taxable = Math.round(whole / (1 + rate / 100));
  return { taxable, tax: whole - taxable };
}

// Apportion a whole-rupee order discount across lines so the per-line amounts
// sum *exactly* to the discount (largest-remainder method), then return the
// discounted — still GST-inclusive — line totals in input order. Used for a
// single invoice, where every printed figure must reconcile to the paid total.
export function apportionDiscount(
  lineTotals: number[],
  discount: number,
): number[] {
  const subtotal = lineTotals.reduce((s, x) => s + x, 0);
  if (!discount || subtotal <= 0) return lineTotals.map((x) => x);
  const d = Math.min(Math.round(discount), subtotal);
  const raw = lineTotals.map((lt) => (d * lt) / subtotal);
  const share = raw.map(Math.floor);
  let left = d - share.reduce((s, x) => s + x, 0);
  // Hand the leftover rupees to the lines with the largest fractional remainder.
  const byFrac = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < byFrac.length && left > 0; k++) {
    share[byFrac[k].i] += 1;
    left -= 1;
  }
  return lineTotals.map((lt, i) => lt - share[i]);
}
