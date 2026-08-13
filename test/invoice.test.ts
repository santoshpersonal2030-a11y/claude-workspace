import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";

import {
  invoiceNumber,
  invoiceNumberFits,
  isInterState,
  MAX_INVOICE_NO_LEN,
} from "../src/lib/invoice.ts";

/* The site token exists so that two businesses filing under ONE GSTIN cannot issue the same
   document number. These tests are the thing that stops a future refactor quietly reverting it. */

test("an order number carries the site token, not a generic INV", () => {
  const n = invoiceNumber(1, 2026);
  assert.equal(n, "BMP-2026/0001");
  // CONTROL: the old generic prefix must be gone — that value is what collided across sites.
  assert.ok(!n.startsWith("INV-"), `still generic: ${n}`);
});

test("document types are appended to the site token, never replacing it", () => {
  assert.equal(invoiceNumber(1, 2026, "BKG"), "BMPBKG-2026/0001");
  assert.equal(invoiceNumber(12, 2026, "CN"), "BMPCN-2026/0012");
  // CONTROL: a bare document type would collide with the other site's credit notes.
  assert.ok(!invoiceNumber(1, 2026, "CN").startsWith("CN-"));
});

test("numbering pads to four digits and rolls past it without truncating", () => {
  assert.equal(invoiceNumber(9, 2026), "BMP-2026/0009");
  assert.equal(invoiceNumber(12345, 2026), "BMP-2026/12345");
});

test("no invoice number, no fabricated one", () => {
  assert.equal(invoiceNumber(null, 2026), "—");
  assert.equal(invoiceNumber(0, 2026), "—");
});

test("missing financial year still yields a usable number", () => {
  assert.equal(invoiceNumber(7, null), "BMP-7");
});

/* Rule 46(b) CGST: "a consecutive serial number not exceeding sixteen characters".
   GSTR-1's inum enforces the same 16. The site token made every number longer, so this is the
   check that proves the change did not quietly breach the limit. */
test("every site x document-type combination fits in 16 characters", () => {
  const failures: string[] = [];
  for (const site of ["BMP", "OPS"]) {
    for (const docType of ["", "BKG", "CN"]) {
      // Composed the same way invoiceNumber() does, at the widest realistic serial.
      const formatted = `${site}${docType}-2026/9999`;
      if (formatted.length > MAX_INVOICE_NO_LEN) {
        failures.push(`${formatted} = ${formatted.length} chars`);
      }
    }
  }
  assert.deepEqual(failures, [], `over the ${MAX_INVOICE_NO_LEN}-char legal limit`);
});

test("invoiceNumberFits actually rejects something too long", () => {
  assert.ok(invoiceNumberFits("BMPBKG-2026/0001")); // 16 exactly — the tightest real case
  assert.ok(invoiceNumberFits("—"));
  // CONTROL: a checker that never says no is decoration.
  assert.ok(!invoiceNumberFits("BMPVERYLONG-2026/00001"));
});

/* The env var is the whole mechanism for giving onlinepoojastores a different series. Asserted
   in a child process because NEXT_PUBLIC_* is read once at module load. */
test("NEXT_PUBLIC_INVOICE_PREFIX actually changes the series", () => {
  const mod = path
    .join(process.cwd(), "src/lib/invoice.ts")
    .replace(/\\/g, "/");
  const out = execFileSync(
    process.execPath,
    [
      "-e",
      `import("file:///${mod}").then(m => console.log(m.invoiceNumber(1, 2026)));`,
    ],
    { env: { ...process.env, NEXT_PUBLIC_INVOICE_PREFIX: "OPS" }, encoding: "utf8" },
  ).trim();
  assert.equal(out, "OPS-2026/0001");
});

test("isInterState decides CGST+SGST versus IGST, and treats unknown as local", () => {
  assert.equal(isInterState("Karnataka", "Telangana"), true);
  assert.equal(isInterState(" telangana ", "Telangana"), false);
  assert.equal(isInterState(null, "Telangana"), false);
});
