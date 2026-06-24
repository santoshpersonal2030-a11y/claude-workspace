import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddToCartButton from "@/components/AddToCartButton";
import ProductPurchase from "@/components/ProductPurchase";
import ProductThumb from "@/components/ProductThumb";
import ProductGallery from "@/components/ProductGallery";
import WishlistButton from "@/components/WishlistButton";
import NotifyMeButton from "@/components/NotifyMeButton";
import RatingStars from "@/components/RatingStars";
import ProductReviews from "@/components/ProductReviews";
import ReviewForm from "@/components/ReviewForm";
import { formatINR } from "@/lib/poojas";
import {
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
  getProductReviews,
} from "@/lib/queries";

// Re-fetch from the database at most once every 5 minutes.
export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} — Samagri Store`,
    description: product.description ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.slug, product.category);
  const reviews = await getProductReviews(product.slug);

  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href="/store" className="hover:text-saffron-700">
                Samagri Store
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{product.name}</span>
            </nav>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <ProductGallery images={product.images} name={product.name} />

            <div>
              {product.category && (
                <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-medium text-saffron-700">
                  {product.category}
                </span>
              )}
              <h1 className="mt-3 font-heading text-3xl text-maroon-800">
                {product.name}
              </h1>

              <div className="mt-2">
                <RatingStars
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <span className="font-heading text-3xl text-saffron-700">
                  {formatINR(product.price)}
                </span>
                {discount > 0 && product.mrp && (
                  <>
                    <span className="text-lg text-foreground/65 line-through">
                      {formatINR(product.mrp)}
                    </span>
                    <span className="text-sm font-semibold text-green-700">
                      {discount}% off
                    </span>
                  </>
                )}
              </div>

              <p className="mt-2 text-sm text-foreground/65">
                {product.stock > 0
                  ? product.stock <= 5
                    ? `Only ${product.stock} left in stock`
                    : "In stock"
                  : "Currently sold out"}
              </p>

              {product.description && (
                <p className="mt-6 leading-relaxed text-foreground/75">
                  {product.description}
                </p>
              )}

              <div className="mt-8 flex max-w-sm items-center gap-3">
                <div className="flex-1">
                  <ProductPurchase product={product} />
                </div>
                <WishlistButton
                  productId={product.id}
                  className="h-11 w-11 border border-saffron-200"
                />
              </div>

              {product.stock <= 0 && (
                <div className="mt-4">
                  <NotifyMeButton productSlug={product.slug} />
                </div>
              )}

              <p className="mt-4 text-sm text-foreground/65">
                Free delivery on orders over ₹999. Authentic, freshly sourced
                samagri.
              </p>
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-16 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <ProductReviews
              reviews={reviews}
              rating={product.rating}
              reviewCount={product.reviewCount}
            />
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ReviewForm productSlug={product.slug} />
            </div>
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="font-heading text-2xl text-maroon-800">
                You may also like
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((item) => {
                  const itemDiscount =
                    item.mrp && item.mrp > item.price
                      ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
                      : 0;
                  return (
                    <div
                      key={item.slug}
                      className="flex flex-col rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
                    >
                      <Link href={`/store/${item.slug}`}>
                        <ProductThumb
                          imageUrl={item.imageUrl}
                          name={item.name}
                          className="aspect-square w-full rounded-xl"
                          emojiSize="text-3xl"
                        />
                      </Link>
                      <h3 className="mt-3 font-heading text-base text-maroon-700">
                        <Link
                          href={`/store/${item.slug}`}
                          className="hover:text-saffron-700"
                        >
                          {item.name}
                        </Link>
                      </h3>
                      <div className="mt-1">
                        <RatingStars
                          rating={item.rating}
                          reviewCount={item.reviewCount}
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-heading text-lg text-saffron-700">
                          {formatINR(item.price)}
                        </span>
                        {itemDiscount > 0 && item.mrp && (
                          <span className="text-xs text-foreground/65 line-through">
                            {formatINR(item.mrp)}
                          </span>
                        )}
                      </div>
                      <AddToCartButton product={item} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
