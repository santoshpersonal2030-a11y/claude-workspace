/* BULK GST-RATE IMPORT — parse, validate and DIFF. No database, no I/O, no side effects.
 *
 * Santosh, 13-Aug-2026: "tax rates may change in future so lets have place holders and build it
 * later — we can change with one single excel upload, so make the system such a way its easy in
 * the future."
 *
 * WHY CSV AND NOT .xlsx
 * Both maintained spreadsheet parsers were tried and both were rejected on 13-Aug-2026:
 * `exceljs` pulls 94 packages with 5 high-severity advisories, `xlsx` pulls 9 with 5. Neither is
 * worth putting into a payment-handling app to save one "Save As" click. Excel exports CSV from
 * the same File menu, and CSV needs no dependency at all — so the parser below is ~40 lines and
 * has no supply chain.
 *
 * THE ONE RULE THAT MATTERS: MATCH ON SLUG, NEVER ON NAME.
 * The source rate table contains "Honey" twice — 0% unbranded, 5% branded. The product NAME does
 * not determine the rate; the packaging does. A name-matched import would silently apply one of
 * those to both products. There is deliberately no name fallback, not even when it looks
 * unambiguous.
 *
 * AND: A BLANK RATE MEANS "LEAVE IT ALONE", NEVER 0%.
 * An empty cell is an omission. 0% is a claim that a supply is exempt. Treating one as the other
 * is how a spreadsheet gap becomes a tax position.
 */

export type SheetRow = {
  slug: string;
  /** null = the cell was blank = leave this product's rate untouched. */
  gstRate: number | null;
  hsn: string | null;
  source: string | null;
  note: string | null;
  /** 1-based line in the file, so an error can name where to look. */
  line: number;
};

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  gst_rate: number;
  hsn_code: string | null;
  /** True when the rate is computed from kit contents — see 0008_kit_gst_auto.sql. */
  gst_rate_derived?: boolean | null;
};

export type RateChange = {
  id: string;
  slug: string;
  name: string;
  fromRate: number;
  toRate: number;
  fromHsn: string | null;
  toHsn: string | null;
  source: string | null;
  note: string | null;
};

export type RatePlan = {
  changes: RateChange[];
  unchanged: { slug: string; name: string; rate: number }[];
  /** In the file, not in the catalogue. LISTED, never silently skipped. */
  unmatched: { slug: string; line: number }[];
  /** Refused on purpose, with a reason the admin can act on. */
  blocked: { slug: string; name: string; reason: string }[];
  /** In the catalogue, absent from the file. Informational only — nothing happens to these. */
  absent: { slug: string; name: string; rate: number }[];
};

/* ------------------------------------------------------------------ CSV */

/** RFC4180-ish reader: quoted fields, embedded commas and newlines, "" escapes, CRLF, BOM. */
export function parseCsv(text: string): string[][] {
  const s = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    // A trailing newline produces one empty field; that is not a row.
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
    row = [];
  };

  while (i < s.length) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      quoted = true;
      i++;
      continue;
    }
    if (c === ",") {
      endField();
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      endRow();
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field !== "" || row.length) endRow();
  return rows;
}

/* --------------------------------------------------------------- parsing */

const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");

/** "5", "5%", " 5 % " -> 5. Blank -> null. Anything else -> undefined (an error). */
function readRate(raw: string): number | null | undefined {
  const t = raw.trim();
  if (t === "") return null;
  const m = t.match(/^(\d+(?:\.\d+)?)\s*%?$/);
  if (!m) return undefined;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 0 || n > 100) return undefined;
  return n;
}

export type ParseResult =
  | { ok: true; rows: SheetRow[] }
  | { ok: false; errors: string[] };

/**
 * Parse the uploaded file.
 *
 * FAIL WHOLE-FILE, NEVER PARTIALLY. A half-applied price list is worse than none: nobody can
 * tell which half landed. Every problem found is reported together so one round trip fixes them
 * all, rather than revealing them one at a time.
 */
export function parseRateSheet(text: string): ParseResult {
  const table = parseCsv(text);
  if (!table.length) return { ok: false, errors: ["The file is empty."] };

  const header = table[0].map(norm);
  const col = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i >= 0) return i;
    }
    return -1;
  };

  const iSlug = col("slug", "sku");
  const iRate = col("gst_rate", "gst", "rate");
  const iHsn = col("hsn_code", "hsn", "indicative_hsn");
  const iSource = col("source");
  const iNote = col("note", "remarks", "remark");

  const errors: string[] = [];
  if (iSlug < 0) errors.push('Missing a "slug" (or "sku") column — that is the only way rows are matched to products.');
  if (iRate < 0) errors.push('Missing a "gst_rate" column.');
  if (errors.length) return { ok: false, errors };

  const rows: SheetRow[] = [];
  const seen = new Map<string, number>();

  for (let r = 1; r < table.length; r++) {
    const line = r + 1;
    const cells = table[r];
    const slug = (cells[iSlug] ?? "").trim();
    if (!slug && cells.every((c) => c.trim() === "")) continue; // blank spacer row
    if (!slug) {
      errors.push(`Line ${line}: no slug.`);
      continue;
    }
    const dup = seen.get(slug);
    if (dup) {
      // Two rows for one product: which wins? Refuse rather than pick.
      errors.push(`Line ${line}: "${slug}" also appears on line ${dup}. Remove one.`);
      continue;
    }
    seen.set(slug, line);

    const rate = readRate(cells[iRate] ?? "");
    if (rate === undefined) {
      errors.push(`Line ${line}: "${(cells[iRate] ?? "").trim()}" is not a rate. Use a number 0–100, or leave it blank to keep the current rate.`);
      continue;
    }

    const pick = (i: number) => (i >= 0 ? (cells[i] ?? "").trim() || null : null);
    rows.push({ slug, gstRate: rate, hsn: pick(iHsn), source: pick(iSource), note: pick(iNote), line });
  }

  if (errors.length) return { ok: false, errors };
  if (!rows.length) return { ok: false, errors: ["No data rows — only a header."] };
  return { ok: true, rows };
}

/* ------------------------------------------------------------------ diff */

/**
 * Work out exactly what would change. Pure: it decides nothing and writes nothing, so the
 * preview the admin approves is the same object that gets applied.
 */
export function buildRatePlan(rows: SheetRow[], products: ProductRow[]): RatePlan {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const plan: RatePlan = { changes: [], unchanged: [], unmatched: [], blocked: [], absent: [] };
  const touched = new Set<string>();

  for (const r of rows) {
    const p = bySlug.get(r.slug);
    if (!p) {
      plan.unmatched.push({ slug: r.slug, line: r.line });
      continue;
    }
    touched.add(p.slug);

    // A kit's rate is computed from its contents (0008_kit_gst_auto.sql). Letting a spreadsheet
    // overwrite it would put the two in conflict, and the trigger would win the moment anyone
    // touched the contents — so the spreadsheet value would silently evaporate later.
    if (p.gst_rate_derived && r.gstRate !== null && r.gstRate !== Number(p.gst_rate)) {
      plan.blocked.push({
        slug: p.slug,
        name: p.name,
        reason: "This is a kit — its rate is calculated from its contents. Change the contents, not the rate.",
      });
      continue;
    }

    const toRate = r.gstRate === null ? Number(p.gst_rate) : r.gstRate;
    const toHsn = r.hsn === null ? p.hsn_code : r.hsn;
    const rateSame = toRate === Number(p.gst_rate);
    const hsnSame = (toHsn ?? "") === (p.hsn_code ?? "");

    if (rateSame && hsnSame) {
      plan.unchanged.push({ slug: p.slug, name: p.name, rate: Number(p.gst_rate) });
      continue;
    }

    plan.changes.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      fromRate: Number(p.gst_rate),
      toRate,
      fromHsn: p.hsn_code,
      toHsn,
      source: r.source,
      note: r.note,
    });
  }

  for (const p of products) {
    if (!touched.has(p.slug)) {
      plan.absent.push({ slug: p.slug, name: p.name, rate: Number(p.gst_rate) });
    }
  }
  return plan;
}

/** A one-line summary for the confirmation screen and the stored receipt. */
export function summarisePlan(plan: RatePlan): string {
  const bits = [`${plan.changes.length} to change`, `${plan.unchanged.length} unchanged`];
  if (plan.unmatched.length) bits.push(`${plan.unmatched.length} not found`);
  if (plan.blocked.length) bits.push(`${plan.blocked.length} blocked`);
  if (plan.absent.length) bits.push(`${plan.absent.length} not in the file`);
  return bits.join(", ");
}
