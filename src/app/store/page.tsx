import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddToCartButton from "@/components/AddToCartButton";
import { formatINR } from "@/lib/poojas";
import { getProducts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Samagri Store — Pooja Items & Kits",
  description:
    "Order authentic pooja samagri — ready-made kits, diyas, agarbatti, havan samagri and more — delivered to your door.",
};

// Re-fetch products from the database at most once every 5 minutes.
export const revalidate = 300;

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const allProducts = await getProducts();

  // Build the category chips from whatever categories are in the catalog.
  const categories = Array.from(
    new Set(allProducts.map((p) => p.category).filter(Boolean) as string[]),
  ).sort();

  const activeCategory =
    category && categories.includes(category) ? category : null;
  const products = activeCategory
    ? allProducts.filter((p) => p.category === activeCategory)
    : allProducts;

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <nav className="text-sm text-foreground/60">
              <span>Home</span>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">Samagri Store</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              Samagri Store
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              Authentic pooja items and ready-made kits — sourced fresh and
              delivered to your door. Free delivery on orders over ₹999.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          {categories.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              <Link
                href="/store"
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory
                    ? "border border-saffron-200 text-saffron-700 hover:bg-saffron-50"
                    : "bg-saffron-600 text-white"
                }`}
              >
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={`/store?category=${encodeURIComponent(c)}`}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeCategory === c
                      ? "bg-saffron-600 text-white"
                      : "border border-saffron-200 text-saffron-700 hover:bg-saffron-50"
                  }`}
                >
                  {c}
                </Link>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <p className="text-center text-foreground/60">
              Our store is being stocked — please check back shortly. 🙏
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const discount =
                  product.mrp && product.mrp > product.price
                    ? Math.round(
                        ((product.mrp - product.price) / product.mrp) * 100,
                      )
                    : 0;
                return (
                  <div
                    key={product.slug}
                    className="flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-4xl">🪔</div>
                      {product.category && (
                        <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-medium text-saffron-700">
                          {product.category}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 font-heading text-lg text-maroon-700">
                      <Link
                        href={`/store/${product.slug}`}
                        className="hover:text-saffron-700"
                      >
                        {product.name}
                      </Link>
                    </h3>
                    {product.description && (
                      <p className="mt-2 flex-1 text-sm text-foreground/65">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="font-heading text-xl text-saffron-700">
                        {formatINR(product.price)}
                      </span>
                      {discount > 0 && product.mrp && (
                        <>
                          <span className="text-sm text-foreground/40 line-through">
                            {formatINR(product.mrp)}
                          </span>
                          <span className="text-xs font-semibold text-green-700">
                            {discount}% off
                          </span>
                        </>
                      )}
                    </div>
                    <AddToCartButton product={product} />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
