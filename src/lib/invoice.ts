/* SITE TOKEN — decided 13-Aug-2026, and the reason matters.
 *
 * One GSTIN covers several of Santosh's businesses ("many businesses under one GST… once we go
 * big we get separated"). bookmypoojari and onlinepoojastores therefore file under the SAME
 * registration, so a document number must be unique ACROSS the sites, not merely within one.
 * Both previously produced "INV-2026/0001" — two different sales carrying one invoice number,
 * which is a filing problem rather than a cosmetic one.
 *
 *   bookmypoojari      NEXT_PUBLIC_INVOICE_PREFIX=BMP
 *   onlinepoojastores  NEXT_PUBLIC_INVOICE_PREFIX=OPS
 *
 * Changed while ZERO invoices had ever been issued (confirmed by Santosh 13-Aug-2026), so no
 * series is broken. ⚠️ Once a real invoice exists, this value must never change again — an
 * invoice series has to be continuous.
 */
const SITE = (process.env.NEXT_PUBLIC_INVOICE_PREFIX ?? "BMP").trim().toUpperCase();

/* Rule 46(b) CGST: the serial number must be "a consecutive serial number not exceeding sixteen
   characters". GSTR-1's `inum` field enforces the same 16. Prefixing the site token makes every
   number longer, so the limit stops being theoretical — invoiceNumberFits() is asserted in
   test/invoice.test.ts for every (site × document-type) combination. */
export const MAX_INVOICE_NO_LEN = 16;

export function invoiceNumberFits(formatted: string): boolean {
  return formatted === "—" || formatted.length <= MAX_INVOICE_NO_LEN;
}

/**
 * Formats a financial-year document number, e.g. "BMP-2026/0001".
 *
 * @param docType a SHORT document-type token appended to the site token —
 *        "" (default) = tax invoice → BMP-2026/0001
 *        "BKG"        = booking receipt → BMPBKG-2026/0001
 *        "CN"         = credit note → BMPCN-2026/0001
 *        It is NOT the whole prefix; the site token is always prepended, which is what keeps
 *        the two sites' series from colliding.
 */
export function invoiceNumber(
  no: number | null,
  fy: number | null,
  docType = "",
): string {
  if (!no) return "—";
  const prefix = `${SITE}${docType}`;
  if (fy) return `${prefix}-${fy}/${String(no).padStart(4, "0")}`;
  return `${prefix}-${no}`;
}

// Intra-state supply (CGST+SGST) when the customer's state matches the seller's,
// otherwise inter-state (IGST). Unknown customer state is treated as intra-state.
export function isInterState(
  customerState: string | null,
  sellerState: string,
): boolean {
  if (!customerState) return false;
  return (
    customerState.trim().toLowerCase() !== sellerState.trim().toLowerCase()
  );
}
