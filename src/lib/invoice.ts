// Formats a financial-year invoice/receipt number, e.g. INV-2026/0001.
export function invoiceNumber(
  no: number | null,
  fy: number | null,
  prefix = "INV",
): string {
  if (!no) return "—";
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
