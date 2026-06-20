import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoreBrowser from "@/components/StoreBrowser";
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
  const products = await getProducts();

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
          {products.length === 0 ? (
            <p className="text-center text-foreground/60">
              Our store is being stocked — please check back shortly. 🙏
            </p>
          ) : (
            <StoreBrowser products={products} initialCategory={category} />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
