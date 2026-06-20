// Schema-checks a GSTR-1 JSON payload against the GSTN offline-tool format
// before it's downloaded, catching malformed GSTINs, place-of-supply codes,
// HSN rows and tax figures that the portal would otherwise reject on upload.

import { STATE_CODES } from "@/lib/india";

// Standard 15-character GSTIN: 2-digit state code, 10-char PAN, entity digit,
// 'Z', and a checksum char.
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const FP_RE = /^(0[1-9]|1[0-2])[0-9]{4}$/; // MMYYYY
const POS_CODES = new Set(Object.values(STATE_CODES));

export type Gstr1Validation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function checkPos(pos: unknown, where: string, errors: string[]): void {
  if (typeof pos !== "string" || !/^[0-9]{2}$/.test(pos)) {
    errors.push(`${where}: place-of-supply code "${pos}" is not 2 digits`);
  } else if (!POS_CODES.has(pos)) {
    errors.push(`${where}: place-of-supply code "${pos}" is not a valid state`);
  }
}

// Validates the object returned by buildGstr1Json().
export function validateGstr1(json: unknown): Gstr1Validation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof json !== "object" || json === null) {
    return { valid: false, errors: ["Payload is not an object"], warnings };
  }
  const g = json as Record<string, unknown>;

  // Header
  if (typeof g.gstin !== "string" || !GSTIN_RE.test(g.gstin)) {
    errors.push(`Supplier GSTIN "${g.gstin}" is malformed`);
  }
  if (typeof g.fp !== "string" || !FP_RE.test(g.fp)) {
    errors.push(`Filing period "${g.fp}" must be in MMYYYY format`);
  }

  // B2B: invoices grouped by counterparty GSTIN.
  if (g.b2b !== undefined) {
    if (!Array.isArray(g.b2b)) {
      errors.push("b2b must be an array");
    } else {
      for (const party of g.b2b as Record<string, unknown>[]) {
        const ctin = party.ctin;
        if (typeof ctin !== "string" || !GSTIN_RE.test(ctin)) {
          errors.push(`b2b: buyer GSTIN "${ctin}" is malformed`);
        }
        const inv = party.inv;
        if (!Array.isArray(inv) || inv.length === 0) {
          errors.push(`b2b ${ctin}: has no invoices`);
          continue;
        }
        for (const i of inv as Record<string, unknown>[]) {
          const ref = `b2b ${ctin} / ${String(i.inum ?? "?")}`;
          if (!i.inum) errors.push(`${ref}: missing invoice number (inum)`);
          if (typeof i.idt !== "string" || !/^\d{2}\/\d{2}\/\d{4}$/.test(i.idt as string)) {
            errors.push(`${ref}: invoice date must be DD/MM/YYYY`);
          }
          if (!isNum(i.val)) errors.push(`${ref}: invoice value (val) is not a number`);
          checkPos(i.pos, ref, errors);
          if (!Array.isArray(i.itms) || i.itms.length === 0) {
            errors.push(`${ref}: has no line items (itms)`);
          }
        }
      }
    }
  }

  // B2CS: rate-wise summary by place of supply.
  if (g.b2cs !== undefined) {
    if (!Array.isArray(g.b2cs)) {
      errors.push("b2cs must be an array");
    } else {
      (g.b2cs as Record<string, unknown>[]).forEach((r, idx) => {
        const ref = `b2cs[${idx}]`;
        checkPos(r.pos, ref, errors);
        if (!isNum(r.rt)) errors.push(`${ref}: rate (rt) is not a number`);
        if (!isNum(r.txval)) errors.push(`${ref}: taxable value (txval) is not a number`);
        const intra = r.sply_ty === "INTRA";
        // Intra-state must carry CGST+SGST and no IGST; inter-state the reverse.
        if (intra && isNum(r.iamt) && r.iamt !== 0) {
          warnings.push(`${ref}: intra-state row has non-zero IGST`);
        }
        if (!intra && ((isNum(r.camt) && r.camt !== 0) || (isNum(r.samt) && r.samt !== 0))) {
          warnings.push(`${ref}: inter-state row has CGST/SGST set`);
        }
      });
    }
  }

  // HSN summary.
  const hsn = g.hsn as Record<string, unknown> | undefined;
  if (hsn !== undefined) {
    const data = hsn.data;
    if (!Array.isArray(data)) {
      errors.push("hsn.data must be an array");
    } else {
      (data as Record<string, unknown>[]).forEach((h, idx) => {
        const ref = `hsn[${idx}]`;
        const code = h.hsn_sc;
        if (typeof code !== "string" || !/^\d{4,8}$/.test(code)) {
          errors.push(`${ref}: HSN code "${code}" must be 4–8 digits`);
        }
        if (!isNum(h.rt)) errors.push(`${ref}: rate (rt) is not a number`);
        if (!isNum(h.qty)) warnings.push(`${ref}: quantity (qty) is not a number`);
        if (!isNum(h.txval)) errors.push(`${ref}: taxable value (txval) is not a number`);
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
