// Seller details shown on tax invoices. The env values are the build-time
// defaults; admins can override them at runtime from /admin/settings (stored in
// the company_settings table) — see getCompany() below.
export type Company = {
  name: string;
  gstin: string;
  state: string;
  upi: string;
  email: string;
  phone: string;
  addressLines: string[];
};

// Address is stored as one string with lines separated by "|" or newlines.
export function splitAddress(raw: string): string[] {
  return raw
    .split(/[|\n]/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export const COMPANY: Company = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME ?? "BookMyPoojari Pvt. Ltd.",
  gstin: process.env.NEXT_PUBLIC_COMPANY_GSTIN ?? "29ABCDE1234F1Z5",
  state: process.env.NEXT_PUBLIC_COMPANY_STATE ?? "Karnataka",
  upi: process.env.NEXT_PUBLIC_COMPANY_UPI ?? "",
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL ?? "support@bookmypoojari.com",
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE ?? "+91 90000 00000",
  addressLines: splitAddress(
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS ??
      "123 Temple Road, Bengaluru, Karnataka 560001",
  ),
};
