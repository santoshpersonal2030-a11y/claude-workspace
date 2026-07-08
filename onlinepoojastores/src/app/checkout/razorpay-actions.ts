'use server';

import crypto from 'node:crypto';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  validateAndPrice,
  insertOrder,
  finalizeExtras,
  type OrderInput,
} from '@/lib/orders';

export type CreateRzpResult =
  | {
      ok: true;
      razorpayOrderId: string;
      amount: number;
      keyId: string;
      prefill: { name: string; email: string; contact: string };
    }
  | { ok: false; error: string };

// Step 1: create a Razorpay order for the current cart. No DB order is created
// yet — that happens only after the payment is verified, so unpaid attempts
// never leave a stray order or reduce stock.
export async function createRazorpayOrder(
  input: OrderInput,
): Promise<CreateRzpResult> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return { ok: false, error: 'Online payment isn’t set up yet.' };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in or continue as guest.' };

  const priced = await validateAndPrice(supabase, input);
  if (!priced.ok) return { ok: false, error: priced.error };

  const amountPaise = Math.round(priced.priced.total * 100);
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  try {
    const resp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `ops_${user.id.slice(0, 8)}_${amountPaise}`,
      }),
    });
    if (!resp.ok) {
      return { ok: false, error: 'Could not start the payment. Please try again.' };
    }
    const rzp = (await resp.json()) as { id: string };
    return {
      ok: true,
      razorpayOrderId: rzp.id,
      amount: amountPaise,
      keyId,
      prefill: {
        name: input.fullName,
        email: user.email || input.guestEmail,
        contact: input.phone,
      },
    };
  } catch {
    return { ok: false, error: 'Could not reach the payment service.' };
  }
}

export type FinalizeResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

// Step 2: after the customer pays, verify the signature and create the paid
// order. The signature proves the payment matches the order we created.
export async function finalizeRazorpayOrder(
  input: OrderInput,
  pay: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
): Promise<FinalizeResult> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return { ok: false, error: 'Online payment isn’t set up.' };

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${pay.razorpay_order_id}|${pay.razorpay_payment_id}`)
    .digest('hex');

  const valid =
    expected.length === pay.razorpay_signature.length &&
    crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(pay.razorpay_signature),
    );
  if (!valid) return { ok: false, error: 'Payment could not be verified.' };

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Session expired. Please try again.' };

  const priced = await validateAndPrice(supabase, input);
  if (!priced.ok) return { ok: false, error: priced.error };

  const created = await insertOrder(supabase, user.id, input, priced.priced, {
    method: 'razorpay',
    status: 'paid',
    providerOrderId: pay.razorpay_order_id,
    providerPaymentId: pay.razorpay_payment_id,
  });
  if (!created.ok) return { ok: false, error: created.error };

  await finalizeExtras(supabase, user, input, priced.priced, created.orderNumber);

  return { ok: true, orderNumber: created.orderNumber };
}
