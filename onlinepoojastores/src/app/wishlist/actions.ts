'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';

export type WishlistResult =
  | { ok: true; inWishlist: boolean }
  | { ok: false; error: string };

// Add the product if it's not saved, remove it if it is.
export async function toggleWishlist(
  productId: string,
): Promise<WishlistResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in to save items.' };

  const { data: existing } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/wishlist');
    return { ok: true, inWishlist: false };
  }

  const { error } = await supabase
    .from('wishlist_items')
    .insert({ user_id: user.id, product_id: productId });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/wishlist');
  return { ok: true, inWishlist: true };
}

export async function removeFromWishlist(
  productId: string,
): Promise<WishlistResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in.' };

  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/wishlist');
  return { ok: true, inWishlist: false };
}
