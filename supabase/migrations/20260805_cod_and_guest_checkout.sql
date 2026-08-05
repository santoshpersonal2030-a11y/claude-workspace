-- Cash on Delivery + guest checkout.
--
-- ⚠️ NOT APPLIED. Written 05-Aug-2026 against a PAUSED Supabase project. Nothing here has been
-- run. Neither feature can work until it is, because both are blocked on schema, not on code:
--
--   guest checkout   orders.user_id and payments.user_id are both NOT NULL, and every SELECT
--                    policy on orders / order_items / payments is `user_id = auth.uid()`.
--                    A visitor with no account has no auth.uid(), so they cannot own an order and
--                    could not read it back even if they could.
--   cash on delivery there is no payment-method column anywhere, and the order_status enum has no
--                    value meaning "confirmed, cash not yet collected". `paid` is the only status
--                    that reserves stock and it also grants loyalty, settles wallet credit and
--                    pays referral rewards — none of which may happen before the cash exists.
--
-- The application-side rules that DON'T need the database are already written and unit-tested:
--   src/lib/cod.ts          COD eligibility and fee   (test/cod.test.ts)
--   src/lib/guest-order.ts  guest order access tokens (test/guest-order.test.ts)
-- Run them with `npm test`. They are pure functions; they will not be touched by this migration.

-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- PART 1 — GUEST CHECKOUT
-- ═══════════════════════════════════════════════════════════════════════════════════════════════
--
-- TWO WAYS TO DO THIS. Read both before choosing; they are not equally cheap.
--
-- OPTION A (recommended) — Supabase anonymous sign-in.
--   Turn on "Allow anonymous sign-ins" in Auth settings, and call supabase.auth.signInAnonymously()
--   before checkout when there is no session. The visitor gets a real auth.uid() without ever
--   seeing a sign-up form, so user_id stays NOT NULL and EVERY EXISTING RLS POLICY KEEPS WORKING
--   UNCHANGED. That is the whole argument for it: no policy rewrite, no new access path to get
--   wrong, and the account can be upgraded to a real one later without moving the orders.
--   The only gap is that an anonymous user has no email address, so the order confirmation has
--   nowhere to go — which the guest_email column below fixes.
--   Cost: anonymous users accumulate in auth.users and need periodic pruning.
--
-- OPTION B — genuinely null user_id.
--   Everything below under "Option B only". More faithful to "guest", but it means rewriting the
--   read policies on three tables and inventing a token-based access path. More surface, more to
--   get wrong. Only take this if Option A is unacceptable for some reason.

-- ── Needed for BOTH options ────────────────────────────────────────────────────────────────────
-- Where to send the confirmation. Today sendOrderConfirmation() looks the address up from
-- profiles.email via the user id; a guest (anonymous or null) has no profile row with an email.
alter table public.orders
  add column if not exists guest_email text;

comment on column public.orders.guest_email is
  'Contact email for an order placed without a real account. sendOrderConfirmation() must prefer this over profiles.email when set.';

-- ── Option B only ──────────────────────────────────────────────────────────────────────────────
-- Uncomment ONLY if you are not taking Option A.
--
-- alter table public.orders  alter column user_id drop not null;
-- alter table public.payments alter column user_id drop not null;
--
-- -- A guest proves ownership with an unguessable token from their confirmation email rather than
-- -- with a session. Stored as a hash: a leaked database row must not hand over working links.
-- alter table public.orders
--   add column if not exists guest_token_hash text;
-- create index if not exists orders_guest_token_hash_idx
--   on public.orders (guest_token_hash) where guest_token_hash is not null;
--
-- -- The token travels in a request header, read here via a setting the server sets per request.
-- create or replace function public.current_guest_token_hash()
-- returns text language sql stable as $$
--   select nullif(current_setting('request.guest_token_hash', true), '')
-- $$;
--
-- drop policy if exists orders_select_own on public.orders;
-- create policy orders_select_own on public.orders for select using (
--   (user_id = auth.uid())
--   or is_admin()
--   or (guest_token_hash is not null and guest_token_hash = public.current_guest_token_hash())
-- );
-- -- order_items and payments need the same treatment, joined through orders.

-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- PART 2 — CASH ON DELIVERY
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

-- How the order is being paid for. Existing rows are all prepaid.
do $$ begin
  create type public.payment_method as enum ('prepaid', 'cod');
exception when duplicate_object then null;
end $$;

alter table public.orders
  add column if not exists payment_method public.payment_method not null default 'prepaid';

-- Cash actually collected, and how much (COD fee makes it differ from total_amount).
alter table public.orders
  add column if not exists cod_fee integer not null default 0;
alter table public.orders
  add column if not exists cod_collected_at timestamptz;
alter table public.orders
  add column if not exists cod_collected_amount integer;

-- A COD order is confirmed and must hold stock, but no money has changed hands. `paid` cannot be
-- reused: it is what triggers loyalty, wallet settlement and referral payout.
alter type public.order_status add value if not exists 'awaiting_cod' before 'packed';

comment on column public.orders.payment_method is
  'prepaid = money taken up front via Razorpay or wallet. cod = cash due on delivery; the order sits at awaiting_cod until cod_collected_at is set.';

-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- PART 3 — THE APPLICATION CHANGES THAT MUST GO WITH THIS
-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- Deliberately NOT written. Every one of them is on the money path, none of them can be run or
-- tested while the project is paused, and payment code that looks finished but has never executed
-- is exactly how money bugs reach customers.
--
--  1. src/app/api/checkout/route.ts
--     - drop the `if (!user) return 401`; for Option A, call signInAnonymously() first
--     - accept guest_email and persist it
--     - accept paymentMethod; when 'cod', run codEligibility() from src/lib/cod.ts SERVER-SIDE
--       (never trust the client's word that COD is allowed), add the fee, skip Razorpay entirely,
--       set status 'awaiting_cod', and reserve stock
--     - COD orders must NOT redeem wallet credit: there is no payment to offset
--
--  2. src/lib/payments.ts
--     - finalizeOrderPaid() must not run for a COD order at creation time. Loyalty, referral and
--       wallet settlement wait until the cash is collected
--     - a new finalizeCodCollected(orderId, amount) doing exactly those three things, once
--
--  3. src/lib/notifications.ts
--     - emailForUser() must prefer orders.guest_email when set, or the confirmation silently
--       goes nowhere for every guest order (it returns null and the send is skipped)
--
--  4. src/app/[locale]/admin/actions.ts
--     - an action to mark COD cash collected, which calls finalizeCodCollected()
--     - cancelling an awaiting_cod order must restock it: add 'awaiting_cod' to
--       STOCK_CONSUMED_STATUSES, since a COD order holds stock from the moment it is confirmed
--
--  5. Returns-to-origin. A refused COD delivery is normal, not exceptional. There must be a way
--     to mark it and put the stock back, or inventory drifts exactly as it did before commit
--     e175ccf.
--
--  6. src/app/[locale]/cart/page.tsx — a payment-method choice, and an email field for guests.
--
-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- PART 4 — DECISIONS SANTOSH MUST MAKE FIRST
-- ═══════════════════════════════════════════════════════════════════════════════════════════════
--   a. COD order value floor and ceiling. Defaults in src/lib/cod.ts are placeholders.
--   b. The COD fee, if any.
--   c. Which pincodes get COD. There is no serviceability data in this project at all.
--   d. Guest checkout via Option A or Option B above.
--   e. Whether a guest may use a coupon (today coupons are per-code, not per-user, so yes by
--      default — worth confirming that is intended before guests can reach them).
