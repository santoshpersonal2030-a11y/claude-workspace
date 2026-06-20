import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddToCartButton from "@/components/AddToCartButton";
import { formatINR } from "@/lib/poojas";
import { getProductBySlug, getProductSlugs } from "@/lib/queries";

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
            <nav className="text-sm text-foreground/60">
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
            <div className="flex items-center justify-center rounded-2xl border border-saffron-100 bg-cream-100/60 p-12">
              <span className="text-8xl">🪔</span>
            </div>

            <div>
              {product.category && (
                <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-medium text-saffron-700">
                  {product.category}
                </span>
              )}
              <h1 className="mt-3 font-heading text-3xl text-maroon-800">
                {product.name}
              </h1>

              <div className="mt-4 flex items-center gap-3">
                <span className="font-heading text-3xl text-saffron-700">
                  {formatINR(product.price)}
                </span>
                {discount > 0 && product.mrp && (
                  <>
                    <span className="text-lg text-foreground/40 line-through">
                      {formatINR(product.mrp)}
                    </span>
                    <span className="text-sm font-semibold text-green-700">
                      {discount}% off
                    </span>
                  </>
                )}
              </div>

              <p className="mt-2 text-sm text-foreground/60">
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

              <div className="mt-8 max-w-xs">
                <AddToCartButton product={product} />
              </div>

              <p className="mt-4 text-sm text-foreground/60">
                Free delivery on orders over ₹999. Authentic, freshly sourced
                samagri.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
