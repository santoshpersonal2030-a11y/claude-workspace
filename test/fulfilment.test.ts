import { test } from "node:test";
import assert from "node:assert/strict";

/* THE OVERSELL GUARD, PER FULFILMENT MODE.
 *
 * The guard added with the stock fix refuses any order where stock < requested. That is right
 * for something off Santosh's own shelf and wrong for a dropship product, whose `stock` column
 * describes a shelf he does not own and will read 0 forever — so the guard would refuse an order
 * he could fulfil perfectly well.
 *
 * The rule below is a copy of the one in /api/checkout, kept here so the DECISION is testable
 * without a database. The controls matter more than the happy path: the dangerous mistake is not
 * "dropship is blocked", it is "everything became unlimited because a value was missing".
 */

type Item = { name: string; requested: number; stock: number; fulfilment?: string };

/** Mirrors the guard in src/app/api/checkout/route.ts. */
function short(items: Item[]) {
  return items
    .map((i) => {
      const NO_SHELF = ["dropship", "made_to_order"];
      const mode = i.fulfilment ?? "stock";
      if (NO_SHELF.includes(mode)) return null;
      return { name: i.name, requested: i.requested, available: i.stock ?? 0 };
    })
    .filter((s): s is { name: string; requested: number; available: number } => s !== null)
    .filter((s) => s.available < s.requested);
}

test("a stock-managed product is still refused when there are not enough", () => {
  const s = short([{ name: "Camphor", requested: 3, stock: 1, fulfilment: "stock" }]);
  assert.equal(s.length, 1);
  assert.equal(s[0].available, 1);
});

test("a dropship product is not judged on a shelf that is not his", () => {
  const s = short([{ name: "Brass Thali", requested: 12, stock: 0, fulfilment: "dropship" }]);
  assert.equal(s.length, 0);
});

test("made-to-order has no shelf to run out of either", () => {
  assert.equal(short([{ name: "Custom Kit", requested: 5, stock: 0, fulfilment: "made_to_order" }]).length, 0);
});

test("CONTROL — a MISSING fulfilment value keeps the guard ON, it does not disable it", () => {
  // This is the whole point. If an unset value meant "skip the check", one forgotten column
  // would quietly turn the entire catalogue into an unlimited shelf.
  const s = short([{ name: "Camphor", requested: 3, stock: 1 }]);
  assert.equal(s.length, 1, "a product with no fulfilment mode must still be stock-checked");
});

test("CONTROL — an unrecognised mode does NOT bypass the guard", () => {
  /* The exempt modes are listed explicitly, so a typo is stock-checked like anything else.
     Written the other way round — "not stock means skip" — one bad string would sell what is not
     there. The database enum in 0010 should stop a typo ever arriving, but a guard that depends
     on another layer holding is not a guard. */
  const s = short([{ name: "Camphor", requested: 3, stock: 1, fulfilment: "stcok" }]);
  assert.equal(s.length, 1, "a misspelled mode must still be stock-checked");
});

test("a mixed cart judges each line on its own terms", () => {
  const s = short([
    { name: "Camphor", requested: 3, stock: 1, fulfilment: "stock" },     // short
    { name: "Brass Thali", requested: 9, stock: 0, fulfilment: "dropship" }, // fine
    { name: "Wicks", requested: 2, stock: 50, fulfilment: "stock" },      // fine
  ]);
  assert.deepEqual(s.map((x) => x.name), ["Camphor"]);
});

test("CONTROL — enough stock produces no shortage at all", () => {
  assert.equal(short([{ name: "Wicks", requested: 2, stock: 2, fulfilment: "stock" }]).length, 0);
});
