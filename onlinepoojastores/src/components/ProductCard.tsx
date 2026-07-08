import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatRupees } from '@/lib/format';
import ProductThumb from './ProductThumb';

export default function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gold/30 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden">
        <ProductThumb name={product.name} imageUrl={product.image_url} />
        {outOfStock && (
          <span className="absolute right-2 top-2 rounded bg-burgundy px-2 py-0.5 text-xs font-medium text-cream">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-burgundy-dark group-hover:text-burgundy">
          {product.name}
        </h3>
        <div className="mt-auto pt-2">
          <span className="text-lg font-bold text-burgundy">
            {formatRupees(product.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
