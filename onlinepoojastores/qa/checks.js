#!/usr/bin/env node
/* ONLINE POOJA STORES — STATIC QA CHECKS.    Run:  node qa/checks.js
 *
 * The project's first tests. Before this there were none at all: no test files, no Playwright
 * or Vitest or Jest, no CI workflow, no ESLint config, and no `test` script.
 *
 * WHAT THESE ARE FOR. They do not hunt for new bugs. They LOCK IN what must stay true, so a
 * later change cannot quietly undo it. Written 12-Aug-2026 by reading the code, after the same
 * overselling fault was found here that had already been found and fixed on the sibling project
 * — written twice, because nothing was watching either time.
 *
 * THE RULE THAT MAKES THIS WORTH HAVING: every check carries a CONTROL — a probe that must give
 * the OPPOSITE answer. A check that cannot fail is decoration. On the sibling project a check
 * once confirmed the correct ordering of code that did not exist, because `indexOf` returns −1
 * for something absent and −1 is less than everything.
 *
 * Exit code 0 only when every check passes AND every control holds.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.argv[2] || path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const MIG = path.join(ROOT, "supabase", "migrations");

let passes = 0;
let fails = 0;
let controlsBroken = 0;

const line = (ok, label, detail) => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `   ${detail}` : ""}`);
  ok ? passes++ : fails++;
};
const control = (ok, label) => {
  console.log(ok ? `  ctrl  ${label}` : `  *CONTROL BROKEN* ${label}`);
  if (!ok) controlsBroken++;
};
const head = (t) => console.log(`\n${t}\n${"-".repeat(t.length)}`);

const read = (p) => {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
};
function walk(dir, out = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const ALL = walk(SRC);
const TS = ALL.filter((f) => /\.tsx?$/.test(f));
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const MIGRATIONS = walk(MIG).filter((f) => f.endsWith(".sql"));

/* ⚠️ COMMENTS ARE NOT CODE, and forgetting that made this file report its own fix as broken.
   Migration 0006 removes `greatest(0, stock - …)` — and QUOTES that line in its header comment
   to explain what was wrong with it. A detector that reads the file as one lump of text cannot
   tell the two apart, so it kept failing on prose describing a bug that had just been fixed.
   Comments are stripped before any behavioural test.
   Limitation, stated rather than discovered later: this also strips a `--` sequence inside a
   string literal. No migration here contains one, and a false strip would only ever make a
   check MISS something, never invent a failure — so it fails in the safe direction. */
const stripSqlComments = (sql) => sql.replace(/--[^\n]*/g, "");
const ALL_SQL = MIGRATIONS.map((f) => stripSqlComments(read(f))).join("\n");

console.log("Online Pooja Stores — static QA checks");
console.log("=".repeat(70));

// ═══════════════════════════════════════════════════════════════════════════
head("1. THE MONEY PATH — the most expensive thing in the codebase");
/* Two faults can stack here, and on the sibling project they did:
     ONE   nothing checks stock before taking payment;
     TWO   the shortfall then erases itself, because the decrement clamps at zero.
   Sell three of something you have one of and all three payments succeed, while the stock
   afterwards reads a perfectly ordinary 0. Nothing anywhere records that two are owed. An
   invisible shortfall cannot be reconciled, refunded, or even counted. */

const orders = read(path.join(SRC, "lib", "orders.ts"));
const priceSelect = (orders.match(/\.from\(['"]products['"]\)\s*\n?\s*\.select\(([^)]*)\)/) ||
  [])[1];

line(
  /validateAndPrice/.test(orders),
  "the price is computed on the SERVER, not taken from the browser",
  priceSelect ? `selects ${priceSelect.trim()}` : "",
);
line(
  Boolean(priceSelect) && /\bstock\b/.test(priceSelect),
  "…and that same query READS STOCK, so an order can be refused before money moves",
  priceSelect ? `selects ${priceSelect.trim()}` : "no products select found",
);
line(
  /stock/i.test(read(path.join(SRC, "app", "checkout", "actions.ts"))) ||
    (Boolean(priceSelect) && /\bstock\b/.test(priceSelect)),
  "the checkout path mentions stock at all",
);

/* `greatest(0, stock - qty)` is the exact line that made the sibling project's oversell
   invisible — and it reads as MORE careful than the naive version, which is why it survives
   review. Subtracting to a floor of zero is not a safety net; it is the thing that hides the
   debt. The stock column needs a NOT-NULL >= 0 CONSTRAINT so the database REFUSES, and the
   decrement must not clamp. */
/* ⚠️ ONLY THE LAST DEFINITION COUNTS, and getting this wrong made this very check lie.
   Migrations are append-only: 0002 still contains `greatest(0, stock - …)` and always will,
   because 0006 supersedes it with `create or replace function` rather than editing history.
   The first version of this check scanned every migration as one blob, so it kept reporting the
   fixed code as broken — a false RED, which costs exactly as much trust as a false GREEN.
   What matters is the definition that runs, so this takes the LAST one in file order. */
const DECREMENT_FN = /create\s+or\s+replace\s+function\s+public\.decrement_stock_on_order_item/i;
const defs = MIGRATIONS.slice()
  .sort()
  .map((f) => stripSqlComments(read(f)))
  .filter((sql) => DECREMENT_FN.test(sql));
const liveDecrement = defs.length ? defs[defs.length - 1] : "";
const clampInLive = /greatest\s*\(\s*0\s*,\s*stock\s*-/i.test(liveDecrement);

line(
  defs.length > 0,
  "a stock-decrement trigger function is defined at all",
  `${defs.length} definition(s) across the migrations; the last one wins`,
);
line(
  !clampInLive,
  "the LIVE stock decrement does NOT silently clamp at zero",
  clampInLive ? "the current definition still has `greatest(0, stock - …)`" : "",
);
control(
  defs.length >= 2,
  `more than one definition exists (${defs.length}) — so 'last one wins' is really being exercised`,
);
control(
  /greatest\s*\(\s*0\s*,\s*stock\s*-/i.test(
    stripSqlComments(
      "create or replace function public.decrement_stock_on_order_item() ... greatest(0, stock - x)",
    ),
  ),
  "the clamp detector still catches a clamp when it IS in the live definition",
);
control(
  !/greatest\s*\(\s*0\s*,\s*stock\s*-/i.test(
    stripSqlComments("-- the old version used greatest(0, stock - qty), which was wrong"),
  ),
  "…and is NOT fooled by a comment describing the old clamp — the bug this check had itself",
);
/* ⚠️ THE SHARPEST THING IN THIS FILE. The constraint below ALREADY EXISTS and is correct:
     stock integer not null default 0 check (stock >= 0)
   The database is willing to refuse an oversell outright. `greatest(0, stock - qty)` is
   precisely what stops it ever being asked — the clamp guarantees the value never goes
   negative, so the constraint never fires and the debt is absorbed in silence.
   The fix is therefore to DELETE the clamp, not to add machinery. The safety net is already
   strung; the clamp is holding it slack. */
const hasConstraint = /check\s*\(\s*stock\s*>=\s*0\s*\)|stock_non_negative/i.test(ALL_SQL);
line(hasConstraint, "the database has a stock >= 0 constraint ready to refuse an oversell");
line(
  !(hasConstraint && clampInLive),
  "…and nothing in the live definition clamps the value so that constraint can never fire",
  hasConstraint && clampInLive
    ? "the constraint exists AND is defeated by greatest(0, …) — delete the clamp"
    : "",
);

/* The guarded decrement that replaced the clamp. `where … and stock >= new.quantity` is what
   makes it atomic: two customers in the same instant cannot both match the row. */
line(
  /stock\s*>=\s*new\.quantity/i.test(ALL_SQL),
  "the decrement is guarded in its WHERE clause, so a simultaneous oversell cannot slip through",
);
line(
  /raise exception/i.test(ALL_SQL),
  "…and it RAISES when there is not enough, rather than recording a sale that cannot be met",
);

/* Refusing at the database now means the order row is already written when the failure lands —
   orders and order_items are two statements, not one transaction. Without cleanup that leaves a
   phantom order in the customer's history that can never be fulfilled. */
line(
  /from\('orders'\)\s*\.delete\(\)|from\("orders"\)\s*\.delete\(\)/.test(orders),
  "a failed line insert removes the half-made order instead of leaving a phantom",
);

/* ── Cancelling must put stock back — but only when the goods are still here ──
   Stock came down on order and never went back up, so every cancellation made the shop
   permanently more sold-out than it was. Harmless-looking before 0006; since 0006 that
   understated count actively refuses real customers. */
line(
  /restock_on_order_cancel/i.test(ALL_SQL),
  "cancelling an order puts its stock back",
);
line(
  /stock_restored_at/i.test(ALL_SQL),
  "…and records that it did, so cancelling twice cannot inflate the count",
);
/* The judgement call, pinned. Restocking a SHIPPED order invents inventory that is already in a
   courier's van, and the next customer is then oversold against a phantom. */
line(
  /old\.status\s+in\s*\(\s*'pending'\s*,\s*'confirmed'\s*,\s*'processing'\s*\)/i.test(ALL_SQL),
  "…only from pending / confirmed / processing — never from shipped, delivered or returned",
);
control(
  !/old\.status\s+in\s*\([^)]*'shipped'/i.test(ALL_SQL),
  "'shipped' is genuinely absent from the restock states, not merely unmentioned",
);
control(
  /old\.status\s+in\s*\(\s*'pending'\s*,\s*'confirmed'\s*,\s*'processing'\s*\)/i.test(
    "and old.status in ('pending', 'confirmed', 'processing')",
  ),
  "the restock-state detector matches the real clause",
);
control(
  !/old\.status\s+in\s*\(\s*'pending'\s*,\s*'confirmed'\s*,\s*'processing'\s*\)/i.test(
    "and old.status in ('pending', 'confirmed', 'processing', 'shipped')",
  ),
  "…and does NOT pass if someone later adds 'shipped' to that list",
);

/* ── The admin must be TOLD which of the two happened ────────────────────────
   Both outcomes are correct and both are invisible: the admin clicks Cancelled and reasonably
   assumes the goods went back on the shelf. */
const statusSelect = read(path.join(SRC, "app", "admin", "orders", "StatusSelect.tsx"));
const orderPage = read(path.join(SRC, "app", "admin", "orders", "[orderNumber]", "page.tsx"));

line(
  /RESTOCKS_FROM/.test(statusSelect) && /window\.confirm/.test(statusSelect),
  "the admin is warned BEFORE a cancellation that will not restock",
);
line(
  /stock_restored_at/.test(orderPage),
  "…and the order afterwards says which of the two actually happened",
);

/* THE DRIFT RISK, WHICH IS THE REAL DANGER HERE. The warning lists the restocking states in
   TypeScript; the trigger lists them in SQL. Two copies of one rule. If they ever disagree the
   admin is warned about the wrong thing — worse than no warning, because it would be trusted.
   So the two lists are compared directly. */
const tsStates = (statusSelect.match(/RESTOCKS_FROM[^=]*=\s*\[([^\]]*)\]/) || [])[1] || "";
const sqlStates =
  (ALL_SQL.match(/old\.status\s+in\s*\(([^)]*)\)/i) || [])[1] || "";
const norm = (s) =>
  (s.match(/'([a-z_]+)'/g) || []).map((x) => x.replace(/'/g, "")).sort().join(",");
line(
  norm(tsStates) !== "" && norm(tsStates) === norm(sqlStates),
  "the admin warning and the database trigger agree on WHICH states restock",
  `ui=[${norm(tsStates)}] sql=[${norm(sqlStates)}]`,
);
control(
  norm("'a', 'b'") === "a,b" && norm("'b', 'a'") === "a,b",
  "the comparison ignores order, so a reshuffled list is not a false alarm",
);
control(
  norm("'pending','shipped'") !== norm("'pending'"),
  "…but genuinely different lists still compare unequal",
);

control(
  orders.length > 500,
  `read src/lib/orders.ts (${orders.length} chars) — an empty read would pass everything above`,
);
control(
  /stock\s*>=\s*new\.quantity/i.test("where id = x and stock >= new.quantity;"),
  "the guarded-decrement detector matches the real clause",
);
control(
  !/stock\s*>=\s*new\.quantity/i.test("set stock = stock - new.quantity;"),
  "…and does not fire on an unguarded one",
);
control(
  /greatest\s*\(\s*0\s*,\s*stock\s*-/i.test("set stock = greatest(0, stock - new.quantity)"),
  "the clamp detector catches the exact line this project ships",
);
control(
  !/greatest\s*\(\s*0\s*,\s*stock\s*-/i.test("set stock = stock - new.quantity"),
  "…and does not fire on an unclamped decrement",
);
control(ALL_SQL.length > 1000, `read ${MIGRATIONS.length} migrations (${ALL_SQL.length} chars)`);

// ═══════════════════════════════════════════════════════════════════════════
head("2. SECRETS — nothing that bypasses security may reach a browser");

/* One pattern, used by BOTH the check and its control — so they cannot disagree. My first
   version tested the control against "SUPABASE_SERVICE_ROLE_KEY" using a lower-case-only
   pattern, which matched nothing, and the control correctly reported ITSELF broken. That is the
   whole reason controls exist: it caught me writing a sloppy control, in the very file arguing
   that a check which cannot fail is decoration. */
const SERVICE_ROLE_RE = /service_role|SERVICE_ROLE/i;
const clientLeaks = TS.filter((f) => SERVICE_ROLE_RE.test(read(f))).map(rel);
line(
  clientLeaks.length === 0,
  "no service-role key is referenced anywhere in src/",
  clientLeaks.length ? clientLeaks.join(", ") : "",
);

const example = read(path.join(ROOT, ".env.local.example"));
const realKey = /eyJhbGciOiJIUzI1NiIs|sb_secret_[A-Za-z0-9_-]{10,}/.test(example);
line(!realKey, ".env.local.example carries placeholders, not a real key");

const gitignore = read(path.join(ROOT, ".gitignore"));
line(/\.env/.test(gitignore), ".env files are gitignored");

control(
  SERVICE_ROLE_RE.test("const k = process.env.SUPABASE_SERVICE_ROLE_KEY;"),
  "the service-role detector catches an UPPER-case planted reference",
);
control(
  SERVICE_ROLE_RE.test("createClient(url, service_role_key)"),
  "…and a lower-case one",
);
control(
  !SERVICE_ROLE_RE.test("createClient(url, anonKey)"),
  "…and is not fooled by an ordinary anon-key call",
);
control(
  /eyJhbGciOiJIUzI1NiIs/.test("KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.x"),
  "the real-key detector catches a planted JWT",
);
control(example.length > 50, `read .env.local.example (${example.length} chars)`);

// ═══════════════════════════════════════════════════════════════════════════
head("3. ADMIN — a customer must not be able to act as staff");

const admin = read(path.join(SRC, "lib", "admin.ts"));
line(/is_admin/.test(admin), "the admin gate checks an is_admin flag on the profile");
line(
  /return null/.test(admin),
  "…and returns nothing for a non-admin rather than a usable client",
);

const rlsCount = (ALL_SQL.match(/enable row level security/gi) || []).length;
line(rlsCount >= 10, "row level security is enabled on the tables", `${rlsCount} tables`);

control(admin.length > 200, `read src/lib/admin.ts (${admin.length} chars)`);
control(
  (("x".repeat(10) + "enable row level security").match(/enable row level security/gi) || [])
    .length === 1,
  "the RLS counter counts what it is given",
);

// ═══════════════════════════════════════════════════════════════════════════
head("4. ROUTE INVENTORY — nothing may silently disappear");
/* The number changes only when someone writes the new number down here and says why.
   A route DISAPPEARING looks identical to one being added, which is the case this catches. */
const EXPECTED = { pages: 24, serverActions: 7 };
const pages = ALL.filter((f) => /[/\\]page\.tsx$/.test(f));
const actions = ALL.filter((f) => /[/\\]actions\.ts$/.test(f));

line(pages.length === EXPECTED.pages, `${EXPECTED.pages} page routes present`, `found ${pages.length}`);
line(
  actions.length === EXPECTED.serverActions,
  `${EXPECTED.serverActions} server-action files present`,
  `found ${actions.length}`,
);
control(pages.length > 0, `the page walker found files at all (${pages.length})`);

// ═══════════════════════════════════════════════════════════════════════════
head("5. TAX — this shop sells GOODS, and has no invoicing machinery");
/* It trades under the same GSTIN as its sibling. Goods are taxable and there is no
   religious-ceremony exemption to lean on here — but there is no GST code at all: no rates, no
   HSN, no tax invoice. That is a GAP TO CLOSE BEFORE LAUNCH, not a bug today.
   What IS checkable now, and what protects him: nothing may CALL itself a tax invoice while
   that machinery is missing. An order confirmation is not a tax invoice. */
const claimsInvoice = TS.filter((f) => /tax invoice|GSTIN/i.test(read(f))).map(rel);
line(
  claimsInvoice.length === 0,
  "nothing calls itself a tax invoice while there is no GST machinery",
  claimsInvoice.length ? claimsInvoice.join(", ") : "order confirmations only — correct",
);
control(
  /tax invoice/i.test("<h1>Tax Invoice</h1>"),
  "the tax-invoice detector catches a planted claim",
);

// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${"=".repeat(70)}`);
console.log(`  ${passes} passed, ${fails} failed, ${controlsBroken} controls broken`);
if (controlsBroken) {
  console.log("  A BROKEN CONTROL MEANS THESE CHECKS ARE NOT TRUSTWORTHY.");
}
console.log("=".repeat(70));
process.exit(fails || controlsBroken ? 1 : 0);
