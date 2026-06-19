"use client";

import { useState } from "react";
import Link from "next/link";
import { type Pooja, poojaCategories, formatINR } from "@/lib/poojas";

export default function PoojaList({ poojas }: { poojas: Pooja[] }) {
  const [active, setActive] = useState<string>("All");

  const filters = ["All", ...poojaCategories];
  const visible =
    active === "All" ? poojas : poojas.filter((p) => p.category === active);

  return (
    <div>
      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors " +
                (isActive
                  ? "bg-saffron-600 text-white shadow-sm"
                  : "border border-saffron-200 bg-white text-saffron-700 hover:bg-saffron-50")
              }
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((pooja) => (
          <Link
            key={pooja.slug}
            href={`/poojas/${pooja.slug}`}
            className="group flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-saffron-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="text-4xl">{pooja.emoji}</div>
              <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-medium text-saffron-700">
                {pooja.category}
              </span>
            </div>
            <h3 className="mt-4 font-heading text-lg text-maroon-700">
              {pooja.name}
            </h3>
            {pooja.sanskritName && (
              <p className="text-sm text-saffron-700">{pooja.sanskritName}</p>
            )}
            <p className="mt-2 flex-1 text-sm text-foreground/65">
              {pooja.shortDescription}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-saffron-50 pt-4">
              <span className="text-sm text-foreground/60">
                Starts at{" "}
                <span className="font-semibold text-foreground">
                  {formatINR(pooja.startingPrice)}
                </span>
              </span>
              <span className="text-sm font-semibold text-saffron-700">
                Book →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-10 text-center text-foreground/60">
          No poojas in this category yet.
        </p>
      )}
    </div>
  );
}
