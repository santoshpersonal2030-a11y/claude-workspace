'use server';

import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/admin';

export type ProductInput = {
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  sku: string;
  stock: number;
  image_url: string;
  is_active: boolean;
  categoryId: string;
};

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Build the DB row. `mrp` is included only when set, so products keep saving
// even before migration 0005 (which adds the mrp column) is applied.
function productRow(input: ProductInput, slug: string): Record<string, unknown> {
  const row: Record<string, unknown> = {
    name: input.name,
    slug,
    description: input.description || null,
    price: input.price,
    sku: input.sku || null,
    stock: input.stock,
    image_url: input.image_url || null,
    is_active: input.is_active,
  };
  if (input.mrp && input.mrp > 0) row.mrp = input.mrp;
  return row;
}

async function setCategory(
  supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>>,
  productId: string,
  categoryId: string,
) {
  await supabase.from('product_categories').delete().eq('product_id', productId);
  if (categoryId) {
    await supabase
      .from('product_categories')
      .insert({ product_id: productId, category_id: categoryId });
  }
}

export async function createProduct(input: ProductInput): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return { ok: false, error: 'Not authorised.' };

  const slug = input.slug ? slugify(input.slug) : slugify(input.name);

  const { data, error } = await supabase
    .from('products')
    .insert(productRow(input, slug))
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  await setCategory(supabase, data.id, input.categoryId);

  revalidatePath('/admin/products');
  revalidatePath('/');
  return { ok: true };
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return { ok: false, error: 'Not authorised.' };

  const slug = input.slug ? slugify(input.slug) : slugify(input.name);

  const { error } = await supabase
    .from('products')
    .update(productRow(input, slug))
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  await setCategory(supabase, id, input.categoryId);

  revalidatePath('/admin/products');
  revalidatePath('/');
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return { ok: false, error: 'Not authorised.' };

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/products');
  revalidatePath('/');
  return { ok: true };
}
