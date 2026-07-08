import { createSupabaseClient } from './supabase';
import type { Category, Product, ProductWithCategories } from './types';

// Fetch all active products, each with the list of category ids it belongs to.
export async function getProducts(): Promise<ProductWithCategories[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, product_categories(category_id)')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;

  return (data ?? []).map((row) => {
    const { product_categories, ...product } = row as Product & {
      product_categories: { category_id: string }[] | null;
    };
    return {
      ...product,
      categoryIds: (product_categories ?? []).map((pc) => pc.category_id),
    };
  });
}

// Fetch all categories, ordered for the storefront.
export async function getCategories(): Promise<Category[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, sort_order')
    .order('sort_order');

  if (error) throw error;
  return (data ?? []) as Category[];
}

// Fetch a single product by its slug (for the product detail page).
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return (data as Product) ?? null;
}
