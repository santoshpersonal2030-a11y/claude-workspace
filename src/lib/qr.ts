import QRCode from "qrcode";

// SERVER-ONLY: renders QR data to a PNG data URL for embedding in invoices.
export async function qrDataUrl(data: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(data, { margin: 1, width: 150 });
  } catch (err) {
    console.error("qrDataUrl failed:", err);
    return null;
  }
}

// Builds the QR payload: a UPI pay string if a company UPI ID is configured,
// otherwise a plain invoice reference. The seller's UPI/name can be passed in
// (from the DB-backed company settings); otherwise it falls back to env.
export function invoiceQrPayload(
  label: string,
  amount: number,
  sellerUpi?: string,
  sellerName?: string,
): string {
  const upi = sellerUpi ?? process.env.NEXT_PUBLIC_COMPANY_UPI;
  const name =
    sellerName ?? process.env.NEXT_PUBLIC_COMPANY_NAME ?? "BookMyPoojari";
  if (upi) {
    return `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(
      name,
    )}&am=${amount}&tn=${encodeURIComponent(label)}&cu=INR`;
  }
  return `${name} | ${label} | INR ${amount}`;
}
