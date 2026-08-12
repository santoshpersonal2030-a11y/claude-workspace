import { getCategories } from '@/lib/data';
import ProductForm from '../ProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <div>
      <h1 className="text-2xl font-bold text-burgundy-dark">Add product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
