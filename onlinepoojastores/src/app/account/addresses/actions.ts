'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';

export type AddressInput = {
  label: 'home' | 'work' | 'other';
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

export type AddressResult = { ok: true } | { ok: false; error: string };

export async function saveAddress(
  input: AddressInput,
  id?: string,
): Promise<AddressResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in.' };

  const row = {
    user_id: user.id,
    label: input.label,
    full_name: input.full_name,
    phone: input.phone,
    line1: input.line1,
    line2: input.line2 || null,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    is_default: input.is_default,
  };

  let savedId = id;
  if (id) {
    const { error } = await supabase.from('addresses').update(row).eq('id', id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data, error } = await supabase
      .from('addresses')
      .insert(row)
      .select('id')
      .single();
    if (error) return { ok: false, error: error.message };
    savedId = data.id;
  }

  // Ensure only one default address for this user.
  if (input.is_default && savedId) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .neq('id', savedId);
  }

  revalidatePath('/account/addresses');
  revalidatePath('/checkout');
  return { ok: true };
}

export async function deleteAddress(id: string): Promise<AddressResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in.' };

  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/account/addresses');
  revalidatePath('/checkout');
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<AddressResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in.' };

  await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', user.id);
  const { error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/account/addresses');
  revalidatePath('/checkout');
  return { ok: true };
}
