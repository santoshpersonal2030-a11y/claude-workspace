'use server';

import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/admin';
import type { OrderStatus } from '@/lib/types';

const STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
];

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ActionResult> {
  if (!STATUSES.includes(status)) {
    return { ok: false, error: 'Invalid status.' };
  }

  const supabase = await getAdminClient();
  if (!supabase) return { ok: false, error: 'Not authorised.' };

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) return { ok: false, error: error.message };

  // When delivered, mark the Cash-on-Delivery payment as paid.
  if (status === 'delivered') {
    await supabase
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('order_id', orderId);
  }

  revalidatePath('/admin/orders');
  return { ok: true };
}
