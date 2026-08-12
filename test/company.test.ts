import { test } from "node:test";
import assert from "node:assert/strict";

import {
  canIssueTaxInvoice,
  invoiceBlockers,
  isRealGstin,
  splitAddress,
  type Company,
} from "../src/lib/company.ts";

/* THE POINT OF THIS FILE.
   Until 12-Aug-2026 src/lib/company.ts defaulted the seller GSTIN to "29ABCDE1234F1Z5" and the
   state to "Karnataka". Both were invented, and getCompany() falls back to them whenever the
   database is unreachable — which it is, because the project is paused. So a real GST invoice
   would have printed a fictitious tax number, and nothing would have complained. */

const READY: Company = {
  name: "PROVIDENT GLOBAL SERVICES",
  gstin: "36EBQPS5960G1ZX",
  state: "Telangana",
  upi: "",
  email: "",
  phone: "",
  addressLines: ["Emerald Heights", "Ranga Reddy, Telangana 500088"],
};

test("the old built-in placeholder GSTIN passes a FORMAT check — which is why format is not enough", () => {
  const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  assert.equal(
    GSTIN_RE.test("29ABCDE1234F1Z5"),
    true,
    "if this ever goes false the sample stopped being dangerous and this test can go",
  );
  // …and is nonetheless rejected, because it is a known sample.
  assert.equal(isRealGstin("29ABCDE1234F1Z5"), false);
});

test("a genuine GSTIN is accepted", () => {
  assert.equal(isRealGstin("36EBQPS5960G1ZX"), true);
  assert.equal(isRealGstin(" 36ebqps5960g1zx "), true, "trims and upper-cases");
});

test("malformed GSTINs are rejected", () => {
  for (const bad of ["", "36EBQPS5960G1Z", "GSTIN", "3600000000000000", "36EBQPS5960G1ZX9"]) {
    assert.equal(isRealGstin(bad), false, `accepted ${JSON.stringify(bad)}`);
  }
});

test("a fully configured business can issue a tax invoice", () => {
  assert.deepEqual(invoiceBlockers(READY), []);
  assert.equal(canIssueTaxInvoice(READY), true);
});

test("every missing detail is named, so the invoice says WHAT is wrong", () => {
  const blank: Company = {
    name: "",
    gstin: "",
    state: "",
    upi: "",
    email: "",
    phone: "",
    addressLines: [],
  };
  assert.deepEqual(invoiceBlockers(blank), ["business name", "GSTIN", "state", "address"]);
  assert.equal(canIssueTaxInvoice(blank), false);
});

test("the sample GSTIN alone is enough to block an otherwise complete business", () => {
  // The exact shape of the old bug: everything filled in, and the tax number fictitious.
  const fake = { ...READY, gstin: "29ABCDE1234F1Z5" };
  assert.deepEqual(invoiceBlockers(fake), ["GSTIN"]);
  assert.equal(canIssueTaxInvoice(fake), false);
});

test("splitAddress handles both separators and drops blanks", () => {
  assert.deepEqual(splitAddress("A|B\nC"), ["A", "B", "C"]);
  assert.deepEqual(splitAddress("  A  |  | B "), ["A", "B"]);
  assert.deepEqual(splitAddress(""), []);
});
