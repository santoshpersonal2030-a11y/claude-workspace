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

/* ⚠️ NO INVENTED SELLER DETAILS. Read this before adding a fallback back in.
 *
 * Until 12-Aug-2026 the GSTIN here defaulted to "29ABCDE1234F1Z5" and the state to "Karnataka".
 * Both were made up, and both were DANGEROUS in a way a blank is not:
 *
 *   1. That sample GSTIN PASSES this project's own GSTIN validator (gstr1-validate.ts). It is
 *      structurally perfect and completely fictitious, so nothing anywhere would ever flag it.
 *      getCompany() also falls back to these values whenever the database is unreachable — which
 *      it is right now — so a real invoice would have printed a fake tax number and looked fine.
 *   2. The state is not decoration. isInterState(customerState, company.state) decides whether
 *      an invoice charges CGST+SGST or IGST. A wrong seller state silently produces the wrong
 *      tax split on every invoice ever issued.
 *
 * So they are blank now. A blank GSTIN makes an invoice obviously incomplete; a plausible fake
 * one makes it obviously fine and quietly wrong. Same rule as COD and SAMAGRI_LEAD_DAYS: when
 * the real value is not known, fail closed rather than guess.
 *
 * The real values belong in .env.local (gitignored) or the company_settings table, never here.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * ⛔ DECIDED 13-Aug-2026 — DO NOT RE-OPEN. `name` IS THE TRADE NAME, AND THAT IS DELIBERATE.
 *
 * The GST certificate (Form GST REG-06) carries TWO names: a legal name (the proprietor) and a
 * trade name. Invoices here print the TRADE NAME ONLY — "PROVIDENT GLOBAL SERVICES" — which is
 * Santosh's explicit decision, taken after being shown that the legal name appears nowhere.
 *
 * So there is deliberately NO `legalName` field on Company, and none should be added "for
 * completeness": a legal-name field that exists but is blank would show up in invoiceBlockers()
 * and stop a valid invoice being issued. If the decision is ever reversed, the field and the
 * blocker must land together.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */
export const COMPANY: Company = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME ?? "",
  gstin: process.env.NEXT_PUBLIC_COMPANY_GSTIN ?? "",
  state: process.env.NEXT_PUBLIC_COMPANY_STATE ?? "",
  upi: process.env.NEXT_PUBLIC_COMPANY_UPI ?? "",
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL ?? "",
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE ?? "",
  addressLines: splitAddress(process.env.NEXT_PUBLIC_COMPANY_ADDRESS ?? ""),
};

/** The GSTIN format the GST portal issues, same rule gstr1-validate.ts uses. */
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/* Sample GSTINs that look real and are not. The one this file used to ship with is first.
   Checked explicitly because the format test cannot tell them apart from a genuine number. */
const KNOWN_SAMPLE_GSTINS = new Set(["29ABCDE1234F1Z5", "22AAAAA0000A1Z5"]);

export function isRealGstin(gstin: string): boolean {
  const g = gstin.trim().toUpperCase();
  return GSTIN_RE.test(g) && !KNOWN_SAMPLE_GSTINS.has(g);
}

/** What is still missing before this business can issue a valid tax invoice. Empty = ready. */
export function invoiceBlockers(company: Company): string[] {
  const missing: string[] = [];
  if (!company.name.trim()) missing.push("business name");
  if (!isRealGstin(company.gstin)) missing.push("GSTIN");
  if (!company.state.trim()) missing.push("state");
  if (!company.addressLines.length) missing.push("address");
  return missing;
}

/** True only when every detail a GST invoice legally needs is present and real. */
export function canIssueTaxInvoice(company: Company): boolean {
  return invoiceBlockers(company).length === 0;
}
