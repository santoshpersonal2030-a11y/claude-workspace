import { createPublicClient } from './supabase/public';
import type {
  Category,
  Product,
  ProductWithCategories,
  ShippingZone,
} from './types';

// Fetch all active products, each with the list of category ids it belongs to.
export async function getProducts(): Promise<ProductWithCategories[]> {
  const supabase = createPublicClient();
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
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, sort_order')
    .order('sort_order');

  if (error) throw error;
  return (data ?? []) as Category[];
}

// Fetch a single product by its slug (for the product detail page).
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return (data as Product) ?? null;
}

// Fetch the shipping zones with their rates (for checkout shipping calc).
export async function getShippingZones(): Promise<ShippingZone[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('shipping_zones')
    .select('*, shipping_rates(rate, free_above)')
    .order('priority');

  if (error) throw error;

  return (data ?? []).map((row) => {
    const { shipping_rates, ...zone } = row as ShippingZone & {
      shipping_rates: { rate: number; free_above: number }[] | null;
    };
    const rate = shipping_rates?.[0];
    return {
      ...zone,
      rate: rate?.rate ?? 0,
      free_above: rate?.free_above ?? 999,
    };
  });
}
