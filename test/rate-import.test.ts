import { test } from "node:test";
import assert from "node:assert/strict";

import {
  parseCsv,
  parseRateSheet,
  buildRatePlan,
  summarisePlan,
  type ProductRow,
} from "../src/lib/rate-import.ts";

const PRODUCTS: ProductRow[] = [
  { id: "1", slug: "havan-samagri", name: "Havan Samagri", gst_rate: 18, hsn_code: null },
  { id: "2", slug: "camphor", name: "Camphor", gst_rate: 5, hsn_code: "3307" },
  { id: "3", slug: "diwali-kit", name: "Diwali Kit", gst_rate: 5, hsn_code: null, gst_rate_derived: true },
];

/* ----------------------------------------------------------------- CSV */

test("parseCsv keeps commas that live inside quotes", () => {
  const r = parseCsv('slug,note\ncamphor,"herbs, resin and wood"\n');
  assert.deepEqual(r[1], ["camphor", "herbs, resin and wood"]);
  // CONTROL: without quotes that same line really is three fields — so the quoting did the work.
  assert.equal(parseCsv("slug,note\ncamphor,herbs, resin\n")[1].length, 3);
});

test("parseCsv handles newlines inside quotes, escaped quotes, CRLF and a BOM", () => {
  assert.deepEqual(parseCsv('a,b\n"line\none",x\n')[1], ["line\none", "x"]);
  assert.deepEqual(parseCsv('a\n"say ""hi"""\n')[1], ['say "hi"']);
  assert.equal(parseCsv("a,b\r\n1,2\r\n").length, 2);
  assert.equal(parseCsv("﻿slug,gst_rate\n")[0][0], "slug");
});

test("parseCsv does not invent a row from a trailing newline", () => {
  assert.equal(parseCsv("slug,gst_rate\ncamphor,5\n").length, 2);
});

/* --------------------------------------------------------------- header */

test("a file with no slug column is refused, and says why", () => {
  const r = parseRateSheet("name,gst_rate\nCamphor,5\n");
  assert.equal(r.ok, false);
  assert.match(r.ok === false ? r.errors[0] : "", /slug/i);
});

test("sku is accepted as the match column, name is never used", () => {
  const r = parseRateSheet("sku,gst_rate\ncamphor,5\n");
  assert.equal(r.ok, true);
  // CONTROL: a name column alone is still refused — there is deliberately no name fallback.
  assert.equal(parseRateSheet("name,gst_rate\nCamphor,5\n").ok, false);
});

/* ---------------------------------------------------------------- rates */

test("a BLANK rate means leave it alone — it must never become 0%", () => {
  const r = parseRateSheet("slug,gst_rate\nhavan-samagri,\n");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.rows[0].gstRate, null); // null, NOT 0
  // and it must survive into the plan as "unchanged", not as a change to 0%
  const plan = buildRatePlan(r.ok ? r.rows : [], PRODUCTS);
  assert.equal(plan.changes.length, 0);
  assert.equal(plan.unchanged[0].rate, 18);
});

test('"5" and "5%" both read as 5', () => {
  const a = parseRateSheet("slug,gst_rate\ncamphor, 5 %\n");
  const b = parseRateSheet("slug,gst_rate\ncamphor,5\n");
  assert.equal(a.ok && a.rows[0].gstRate, 5);
  assert.equal(b.ok && b.rows[0].gstRate, 5);
});

test("nonsense, negative and impossible rates are refused whole-file", () => {
  for (const bad of ["abc", "-5", "150", "5%%", "1e3"]) {
    const r = parseRateSheet(`slug,gst_rate\ncamphor,${bad}\n`);
    assert.equal(r.ok, false, `"${bad}" should have been refused`);
  }
  // CONTROL: the same file with a valid rate is accepted, so the refusals are about the value.
  assert.equal(parseRateSheet("slug,gst_rate\ncamphor,12\n").ok, true);
});

test("one product twice in a file is refused, naming both lines", () => {
  const r = parseRateSheet("slug,gst_rate\ncamphor,5\ncamphor,18\n");
  assert.equal(r.ok, false);
  const e = r.ok === false ? r.errors.join(" ") : "";
  assert.match(e, /line 3/i);
  assert.match(e, /line 2/i);
});

test("every problem is reported at once, not one per attempt", () => {
  const r = parseRateSheet("slug,gst_rate\ncamphor,abc\nhavan-samagri,999\n");
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.errors.length, 2);
});

/* ----------------------------------------------------------------- plan */

test("a real change is detected with its before and after", () => {
  const r = parseRateSheet("slug,gst_rate,source\nhavan-samagri,5,GST portal\n");
  const plan = buildRatePlan(r.ok ? r.rows : [], PRODUCTS);
  assert.equal(plan.changes.length, 1);
  assert.equal(plan.changes[0].fromRate, 18);
  assert.equal(plan.changes[0].toRate, 5);
  assert.equal(plan.changes[0].source, "GST portal");
  // CONTROL: the same rate produces no change at all.
  const same = buildRatePlan(
    parseRateSheet("slug,gst_rate\nhavan-samagri,18\n").rows ?? [],
    PRODUCTS,
  );
  assert.equal(same.changes.length, 0);
});

test("a slug not in the catalogue is LISTED, never silently skipped", () => {
  const r = parseRateSheet("slug,gst_rate\nnot-a-real-product,5\n");
  const plan = buildRatePlan(r.ok ? r.rows : [], PRODUCTS);
  assert.equal(plan.unmatched.length, 1);
  assert.equal(plan.unmatched[0].slug, "not-a-real-product");
  assert.equal(plan.unmatched[0].line, 2); // says where to look
  assert.equal(plan.changes.length, 0);
});

test("a kit's calculated rate cannot be overwritten by a spreadsheet", () => {
  const r = parseRateSheet("slug,gst_rate\ndiwali-kit,18\n");
  const plan = buildRatePlan(r.ok ? r.rows : [], PRODUCTS);
  assert.equal(plan.blocked.length, 1);
  assert.equal(plan.changes.length, 0);
  assert.match(plan.blocked[0].reason, /contents/i);
  // CONTROL: the same file against a NON-derived product does change it.
  const plain = buildRatePlan(
    parseRateSheet("slug,gst_rate\ncamphor,18\n").rows ?? [],
    PRODUCTS,
  );
  assert.equal(plain.changes.length, 1);
});

test("a kit row that agrees with the computed rate is not treated as a conflict", () => {
  const r = parseRateSheet("slug,gst_rate\ndiwali-kit,5\n");
  const plan = buildRatePlan(r.ok ? r.rows : [], PRODUCTS);
  assert.equal(plan.blocked.length, 0);
  assert.equal(plan.unchanged.length, 1);
});

test("products missing from the file are reported, and nothing happens to them", () => {
  const r = parseRateSheet("slug,gst_rate\ncamphor,12\n");
  const plan = buildRatePlan(r.ok ? r.rows : [], PRODUCTS);
  assert.equal(plan.absent.length, 2);
  assert.ok(plan.absent.every((a) => a.slug !== "camphor"));
});

test("HSN is updated when supplied and left alone when the cell is blank", () => {
  const withHsn = buildRatePlan(
    parseRateSheet("slug,gst_rate,hsn_code\nhavan-samagri,,1301\n").rows ?? [],
    PRODUCTS,
  );
  assert.equal(withHsn.changes.length, 1);
  assert.equal(withHsn.changes[0].toHsn, "1301");
  assert.equal(withHsn.changes[0].toRate, 18); // rate untouched by a blank cell

  const blank = buildRatePlan(
    parseRateSheet("slug,gst_rate,hsn_code\ncamphor,5,\n").rows ?? [],
    PRODUCTS,
  );
  assert.equal(blank.changes.length, 0); // blank HSN did NOT wipe "3307"
});

test("the summary counts every bucket", () => {
  const r = parseRateSheet(
    "slug,gst_rate\nhavan-samagri,5\ncamphor,5\ndiwali-kit,18\nghost,5\n",
  );
  const plan = buildRatePlan(r.ok ? r.rows : [], PRODUCTS);
  const s = summarisePlan(plan);
  assert.match(s, /1 to change/);
  assert.match(s, /1 not found/);
  assert.match(s, /1 blocked/);
});
