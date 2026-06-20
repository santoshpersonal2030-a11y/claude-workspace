// Seller details shown on tax invoices. Override via env in production; the
// defaults are placeholders to be replaced with your registered business info.
export const COMPANY = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME ?? "BookMyPoojari Pvt. Ltd.",
  gstin: process.env.NEXT_PUBLIC_COMPANY_GSTIN ?? "29ABCDE1234F1Z5",
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL ?? "support@bookmypoojari.com",
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE ?? "+91 90000 00000",
  addressLines: (
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS ??
    "123 Temple Road, Bengaluru, Karnataka 560001"
  )
    .split("|")
    .map((l) => l.trim())
    .filter(Boolean),
};
