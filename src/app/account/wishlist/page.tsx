import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddToCartButton from "@/components/AddToCartButton";
import ProductThumb from "@/components/ProductThumb";
import WishlistButton from "@/components/WishlistButton";
import { formatINR } from "@/lib/poojas";
import type { StoreProduct } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Saved Items" };

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/wishlist");

  const { data: rows } = await supabase
    .from("wishlists")
    .select(
      "created_at, products(id, slug, name, description, price, mrp, category, image_url, stock, rating, review_count)",
    )
    .order("created_at", { ascending: false });

  const products: StoreProduct[] = (rows ?? [])
    .map((r) => r.products)
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: p.price,
      mrp: p.mrp,
      category: p.category,
      imageUrl: p.image_url,
      stock: p.stock,
      rating: Number(p.rating),
      reviewCount: p.review_count,
    }));

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h1 className="font-heading text-3xl text-maroon-800">Saved items</h1>

          {products.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-saffron-100 bg-white p-10 text-center shadow-sm">
              <div className="text-4xl">♡</div>
              <p className="mt-3 text-foreground/65">
                You haven&apos;t saved any items yet.
              </p>
              <Link
                href="/store"
                className="mt-5 inline-block rounded-full bg-saffron-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-700"
              >
                Browse the store
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.slug}
                  className="flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
                >
                  <div className="relative">
                    <Link href={`/store/${product.slug}`}>
                      <ProductThumb
                        imageUrl={product.imageUrl}
                        name={product.name}
                        className="aspect-square w-full rounded-xl"
                      />
                    </Link>
                    <WishlistButton
                      productId={product.id}
                      className="absolute left-2 top-2"
                    />
                  </div>
                  <h3 className="mt-4 font-heading text-lg text-maroon-700">
                    <Link
                      href={`/store/${product.slug}`}
                      className="hover:text-saffron-700"
                    >
                      {product.name}
                    </Link>
                  </h3>
                  <div className="mt-2 flex flex-1 items-end">
                    <span className="font-heading text-xl text-saffron-700">
                      {formatINR(product.price)}
                    </span>
                  </div>
                  <AddToCartButton product={product} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
