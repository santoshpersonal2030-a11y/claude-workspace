import { createPublicClient } from './supabase/public';
import type {
  Category,
  Product,
  ProductWithCategories,
  Review,
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

// For the product detail page: the product's primary category (for the
// breadcrumb) and a few related products ("you may also like").
export async function getProductExtras(
  productId: string,
): Promise<{ category: { name: string; slug: string } | null; related: Product[] }> {
  const supabase = createPublicClient();

  const { data: pc } = await supabase
    .from('product_categories')
    .select('category_id, categories(name, slug)')
    .eq('product_id', productId)
    .limit(1)
    .maybeSingle();

  const cat = (pc as { categories?: { name: string; slug: string } } | null)
    ?.categories;
  const category = cat ? { name: cat.name, slug: cat.slug } : null;
  const categoryId = (pc as { category_id?: string } | null)?.category_id;

  let related: Product[] = [];
  if (categoryId) {
    const { data } = await supabase
      .from('product_categories')
      .select('products(*)')
      .eq('category_id', categoryId)
      .neq('product_id', productId)
      .limit(8);
    related = ((data ?? []) as unknown as { products: Product | null }[])
      .map((r) => r.products)
      .filter((p): p is Product => !!p && p.is_active)
      .slice(0, 4);
  }

  if (related.length === 0) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .neq('id', productId)
      .limit(4);
    related = (data ?? []) as Product[];
  }

  return { category, related };
}

// Fetch approved reviews for a product (public — RLS allows approved reviews).
export async function getApprovedReviews(productId: string): Promise<Review[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, title, body, created_at')
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Review[];
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
