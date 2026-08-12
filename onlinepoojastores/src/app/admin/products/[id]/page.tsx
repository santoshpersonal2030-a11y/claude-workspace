import { notFound } from 'next/navigation';
import { getCategories } from '@/lib/data';
import { createServerSupabase } from '@/lib/supabase/server';
import ProductForm from '../ProductForm';

export const dynamic = 'force-dynamic';

type Row = {
  name: string;
  slug: string;
  description: string | null;
  price: number;
  mrp: number | null;
  sku: string | null;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  product_categories: { category_id: string }[] | null;
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const [{ data }, categories] = await Promise.all([
    supabase
      .from('products')
      .select('*, product_categories(category_id)')
      .eq('id', id)
      .maybeSingle(),
    getCategories(),
  ]);

  if (!data) notFound();
  const p = data as unknown as Row;

  return (
    <div>
      <h1 className="text-2xl font-bold text-burgundy-dark">Edit product</h1>
      <ProductForm
        categories={categories}
        productId={id}
        initial={{
          name: p.name,
          slug: p.slug,
          description: p.description ?? '',
          price: p.price,
          mrp: p.mrp ?? 0,
          sku: p.sku ?? '',
          stock: p.stock,
          image_url: p.image_url ?? '',
          is_active: p.is_active,
          categoryId: p.product_categories?.[0]?.category_id ?? '',
        }}
      />
    </div>
  );
}
