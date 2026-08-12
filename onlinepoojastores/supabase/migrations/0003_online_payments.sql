-- =============================================================================
-- Online Pooja Stores — Online payments (Razorpay) support (Phase 2)
-- Run this ONCE in the Supabase SQL Editor, after the earlier migrations.
-- Only needed if you turn on online payments; Cash on Delivery works without it.
--
-- Adds 'razorpay' as an allowed payment method and two columns on payments to
-- store the payment gateway's reference ids.
-- =============================================================================

alter type public.payment_method add value if not exists 'razorpay';

alter table public.payments
  add column if not exists provider_order_id   text,
  add column if not exists provider_payment_id text;
