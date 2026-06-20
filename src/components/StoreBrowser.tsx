"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import AddToCartButton from "@/components/AddToCartButton";
import RatingStars from "@/components/RatingStars";
import { formatINR } from "@/lib/poojas";
import type { StoreProduct } from "@/lib/queries";

type Sort = "featured" | "price-asc" | "price-desc" | "rating" | "discount";

const sortLabels: Record<Sort, string> = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Top rated",
  discount: "Biggest discount",
};

function discountPct(p: StoreProduct) {
  return p.mrp && p.mrp > p.price
    ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
    : 0;
}

export default function StoreBrowser({
  products,
  initialCategory,
}: {
  products: StoreProduct[];
  initialCategory?: string;
}) {
  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.category).filter(Boolean) as string[]),
      ).sort(),
    [products],
  );

  const [category, setCategory] = useState<string | null>(
    initialCategory && categories.includes(initialCategory)
      ? initialCategory
      : null,
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("featured");

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = products.filter((p) => {
      const matchesCategory = !category || p.category === category;
      const matchesQuery =
        term === "" ||
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term);
      return matchesCategory && matchesQuery;
    });

    const sorted = [...filtered];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "discount":
        sorted.sort((a, b) => discountPct(b) - discountPct(a));
        break;
    }
    return sorted;
  }, [products, category, query, sort]);

  return (
    <div>
      {/* Search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-full border border-saffron-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground/60">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-full border border-saffron-200 bg-white px-3 py-2 text-sm outline-none focus:border-saffron-400"
          >
            {(Object.keys(sortLabels) as Sort[]).map((s) => (
              <option key={s} value={s}>
                {sortLabels[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !category
                ? "bg-saffron-600 text-white"
                : "border border-saffron-200 bg-white text-saffron-700 hover:bg-saffron-50"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === c
                  ? "bg-saffron-600 text-white"
                  : "border border-saffron-200 bg-white text-saffron-700 hover:bg-saffron-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-foreground/50">
        {visible.length} product{visible.length === 1 ? "" : "s"}
      </p>

      {/* Grid */}
      {visible.length === 0 ? (
        <p className="mt-10 text-center text-foreground/60">
          No products match your search. 🙏
        </p>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => {
            const discount = discountPct(product);
            return (
              <div
                key={product.slug}
                className="flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <Link href={`/store/${product.slug}`} className="text-4xl">
                    🪔
                  </Link>
                  {discount > 0 && (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                      {discount}% off
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
                <div className="mt-1">
                  <RatingStars
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                  />
                </div>
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
                    <span className="text-sm text-foreground/40 line-through">
                      {formatINR(product.mrp)}
                    </span>
                  )}
                </div>
                <AddToCartButton product={product} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
