'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';

export type ReviewInput = {
  productId: string;
  slug: string;
  rating: number;
  title: string;
  body: string;
};

export type ReviewResult = { ok: true } | { ok: false; error: string };

export async function addReview(input: ReviewInput): Promise<ReviewResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Please sign in to write a review.' };

  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));

  // Upsert so a customer can update their own review; it goes back to
  // "pending approval" whenever it changes.
  const { error } = await supabase.from('reviews').upsert(
    {
      product_id: input.productId,
      user_id: user.id,
      rating,
      title: input.title || null,
      body: input.body || null,
      is_approved: false,
    },
    { onConflict: 'product_id,user_id' },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/products/${input.slug}`);
  return { ok: true };
}
