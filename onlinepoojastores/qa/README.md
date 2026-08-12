# onlinepoojastores — the stock fix, and the first QA suite

Everything here was written by reading the real code (fetched read-only from
`claude-workspace`, branch `claude/new-session-u9rb3c`) and **run against it**. Nothing was
guessed.

**Pushed to branch `onlinepoojastores-stock-fix`, deliberately NOT to `claude/new-session-u9rb3c`** — that branch has another session working on it and pushing into it mid-work would collide. Merge it when that session is idle.

**The database is untouched.** The two migrations below have NOT been run; they are yours to run.

## The files

| File | Goes to | What it is |
|---|---|---|
| `supabase/migrations/0006_stock_no_silent_oversell.sql` | same path | ⚠️ **run once in the Supabase SQL editor** |
| `supabase/migrations/0007_restock_on_cancel.sql` | same path | ⚠️ **run once, after 0006** |
| `src/lib/orders.ts` | same path | the code half — replaces the existing file |
| `orders.ts.patch` | — | the same change as a diff, if you prefer to review it |
| `qa/checks.js` | same path | the project's first tests |
| `qa/run-all.js` | same path | one command: `node qa/run-all.js` |

**Apply the migration and the code together.** The migration alone is still correct — it just
turns a silent wrong answer into a loud one at the last moment, after the customer has filled in
the form. The code is what refuses politely, before any money moves.

---

## The bug

`0002_auto_stock_decrement.sql` reduced stock like this:

```sql
set stock = greatest(0, stock - new.quantity)
```

**Sell three of something you have one of, and all three payments succeed** — while the stock
afterwards reads a perfectly ordinary `0`. Nothing records that two customers are owed an item
that does not exist. The money is real; the shortfall is invisible. An invisible shortfall
cannot be reconciled, refunded, or even counted. You find out from the customer.

And nothing stopped it earlier either: `validateAndPrice` selected
`id, slug, name, price, is_active` — **never `stock`**.

### The safety net was already there

`0001_initial_schema.sql` line 92 already says:

```sql
stock integer not null default 0 check (stock >= 0)
```

The database has always been willing to refuse an oversell. `greatest(0, …)` is exactly what
stopped it ever being asked. **So the fix deletes the clamp rather than building anything.**

⚠️ **The same fault, in the same shape, was found and fixed on bookmypoojari on 05-Aug-2026.**
It was written twice because nothing was watching either time. `qa/checks.js` section 1 is now
watching.

## The fix, in three parts

1. **The database refuses.** The decrement carries its guard in the `WHERE` clause —
   `where id = … and stock >= new.quantity` — which is atomic, so two customers in the same
   instant cannot both succeed. When it does not apply, it raises a message naming the product
   and how many are actually left.
2. **The checkout refuses first, and politely.** `validateAndPrice` now selects `stock` and
   returns *"Some items are no longer available in the quantity you chose — Brass Diya: only 2
   left"* before shipping is computed and before any order row exists.
3. **No phantom orders.** The order and its lines are two separate statements, not one
   transaction, so a refusal at step 1 would leave an order with no items sitting in the
   customer's history. That path went from theoretical to likely the moment the trigger started
   refusing, so a failed line insert now deletes the half-made order.

## Verified, not asserted

- Fixed code: **19 passed, 0 failed, 0 controls broken**
- The same checks against the **unfixed** code: **7 of them fail**, naming the exact fault

A check that cannot fail is decoration, so each was run against the broken code first.

---

## Three traps hit while writing this — all now commented in the code

1. **The runner reported the checks as FAILED without ever running them.** Node lives at
   `C:\Program Files\nodejs\node.exe`; `shell: true` split that path at the space, so the command
   exited 1 with no output. It *looked* right because those checks genuinely did fail.
   **A QA tool giving the right answer for the wrong reason is the worst possible bug in a QA
   tool** — the next time the checks passed, it would still have said FAIL.

2. **`npx tsc` with no `node_modules` downloads a decoy package** that prints *"This is not the
   tsc command you are looking for"* and exits non-zero — which reads as "your types are broken"
   when the truth is "you never ran npm install". **A false RED costs the same trust as a false
   GREEN.**

3. **The clamp detector failed on its own fix.** Migration 0006 removes `greatest(0, …)` and
   *quotes that line in a comment* explaining what was wrong. A detector reading the file as one
   lump of text cannot tell code from prose, so it reported the fix as broken. Comments are
   stripped before any behavioural test now.

And a fourth, in the suite's favour: **a control caught me writing a broken control** — the
service-role detector was tested with a lower-case pattern against an upper-case string, matched
nothing, and the suite printed `*CONTROL BROKEN*` and refused to be trusted.

---

## 0007 — cancelling now puts the stock back

Stock came down when an order was placed and **never went back up**. Cancel an order and those
units were gone from the count for good — and the same number drives the "in stock" figure, the
admin list, and (since 0006) whether a customer is allowed to buy at all.

So every cancellation made the shop permanently more sold-out than it really was. This hole
predates 0006, but **0006 made it matter**: before, an understated count merely looked wrong;
now it actively turns real customers away while the goods sit on your shelf.

### The judgement call, made explicitly

| Cancelled from | Restock? | Why |
|---|---|---|
| `pending` · `confirmed` · `processing` | ✅ **yes** | nothing has been dispatched |
| `shipped` · `delivered` | ❌ **no** | those goods are in a van. Adding them back invents inventory, and the next customer is oversold against a phantom |
| `returned` | ❌ **no, deliberately** | the goods came back, but whether they can be **sold again** is a human decision — someone has to open the box. Auto-restocking a damaged item is how a shop sells something it cannot ship |

**It cannot double-count.** `stock_restored_at` records that an order has already been put back,
so cancelling twice — or `cancelled → pending → cancelled` — cannot inflate stock. Without that,
the obvious "fix" for a missing restock is to cancel the order again, which would create stock
out of nothing.

**It does not backfill.** Orders cancelled before this migration are left alone: there is no
record of which were pre-dispatch, so a blanket backfill would restock shipped goods — the exact
thing the table above prevents. The migration ends with the query to find them and decide by hand.

**Proven both ways:** the three new checks fail against the code without 0007, and when I planted
`'shipped'` into the restock list the check went red *and* its control broke.

## What is still NOT done

- **Stock is not reserved during payment.** Two people can still race to the payment sheet; only
  one gets an order. That is the right trade-off at this size — reservations need a timeout and a
  sweeper, and an unswept reservation is its own bug.
---

## The admin is now told which happened

Both outcomes above are correct, and both were **completely invisible**. An admin clicks
*Cancelled* and reasonably assumes the goods went back on the shelf. Two places now say
otherwise:

- **Before** — cancelling an order that has already shipped or been delivered asks first:
  *"This order is already 'Shipped', so cancelling it will NOT put the stock back — those goods
  have left. If they come back, raise the stock by hand once you have checked them. Cancel
  anyway?"*
- **After** — the order page states plainly whether stock was returned, in green, or was not, in
  amber, with what to do about it.

### ⚠️ The real hazard here, and the check that guards it

The warning lists the restocking states **in TypeScript**; the trigger lists them **in SQL**.
That is two copies of one rule, and a duplicate nobody checks is a divergence waiting to happen.
**If they ever disagree, the admin is warned about the wrong thing — which is worse than no
warning, because it would be believed.**

So a check compares the two lists directly, order-insensitively. Proven by poisoning: removing
`processing` from the UI list alone turns it red —

```
FAIL  the admin warning and the database trigger agree on WHICH states restock
      ui=[confirmed,pending] sql=[confirmed,pending,processing]
```

**Final state: 25 passed, 0 failed, 0 controls broken.**
