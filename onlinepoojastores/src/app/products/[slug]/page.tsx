import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getApprovedReviews, getProductBySlug } from '@/lib/data';
import { formatRupees } from '@/lib/format';
import { createServerSupabase } from '@/lib/supabase/server';
import ProductThumb from '@/components/ProductThumb';
import AddToCartButton from '@/components/AddToCartButton';
import WishlistButton from '@/components/WishlistButton';
import ReviewForm from './ReviewForm';

export const dynamic = 'force-dynamic';

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value.toFixed(1)} out of 5`} className="text-gold">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? '' : 'text-gold/30'}>
          ★
        </span>
      ))}
    </span>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const reviews = await getApprovedReviews(product.id);
  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let inWishlist = false;
  if (user) {
    const { data: saved } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle();
    inWishlist = !!saved;
  }

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

          {reviews.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Stars value={avg} />
              <span className="text-burgundy-dark/70">
                {avg.toFixed(1)} · {reviews.length} review
                {reviews.length > 1 ? 's' : ''}
              </span>
            </div>
          )}

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

          <AddToCartButton
            slug={product.slug}
            name={product.name}
            price={product.price}
            imageUrl={product.image_url}
            inStock={!outOfStock}
          />

          <WishlistButton
            productId={product.id}
            slug={product.slug}
            signedIn={!!user}
            initialInWishlist={inWishlist}
          />

          <p className="mt-4 text-xs text-burgundy-dark/60">
            Cash on Delivery · Free shipping over ₹999
          </p>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-12 max-w-2xl">
        <h2 className="text-xl font-bold text-burgundy-dark">
          Customer reviews
        </h2>

        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-burgundy-dark/60">
            No reviews yet. Be the first to review this product.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-gold/40 bg-white p-4"
              >
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  {r.title && (
                    <span className="text-sm font-semibold text-burgundy-dark">
                      {r.title}
                    </span>
                  )}
                </div>
                {r.body && (
                  <p className="mt-1 text-sm text-burgundy-dark/80">{r.body}</p>
                )}
                <p className="mt-2 text-xs text-burgundy-dark/50">
                  Verified customer ·{' '}
                  {new Date(r.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-burgundy-dark">
            Write a review
          </h3>
          <div className="mt-3">
            {user ? (
              <ReviewForm productId={product.id} slug={product.slug} />
            ) : (
              <p className="text-sm text-burgundy-dark/70">
                <Link
                  href={`/login?next=/products/${product.slug}`}
                  className="font-semibold text-burgundy underline"
                >
                  Sign in
                </Link>{' '}
                to write a review.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
