import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/data';
import { formatRupees } from '@/lib/format';
import ProductThumb from '@/components/ProductThumb';

export const dynamic = 'force-dynamic';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const outOfStock = product.stock <= 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm text-burgundy hover:underline">
        ← Back to shop
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-2xl border border-gold/30 bg-white">
          <ProductThumb name={product.name} imageUrl={product.image_url} />
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-burgundy-dark">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-3xl font-bold text-burgundy">
              {formatRupees(product.price)}
            </span>
            {outOfStock ? (
              <span className="rounded bg-burgundy px-2 py-0.5 text-xs font-medium text-cream">
                Out of stock
              </span>
            ) : (
              <span className="rounded bg-gold-soft px-2 py-0.5 text-xs font-medium text-burgundy-dark">
                In stock
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-4 text-sm leading-relaxed text-burgundy-dark/80">
              {product.description}
            </p>
          )}

          <button
            disabled={outOfStock}
            className="mt-6 w-full rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-burgundy-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            title="Cart is coming in the next step"
          >
            {outOfStock ? 'Out of stock' : 'Add to cart (coming soon)'}
          </button>

          <p className="mt-4 text-xs text-burgundy-dark/60">
            Cash on Delivery · Free shipping over ₹999
          </p>
        </div>
      </div>
    </div>
  );
}
