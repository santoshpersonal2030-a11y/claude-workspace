'use server';

import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/admin';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function approveReview(id: string): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return { ok: false, error: 'Not authorised.' };

  const { error } = await supabase
    .from('reviews')
    .update({ is_approved: true })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/reviews');
  return { ok: true };
}

export async function deleteReview(id: string): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return { ok: false, error: 'Not authorised.' };

  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/reviews');
  return { ok: true };
}
