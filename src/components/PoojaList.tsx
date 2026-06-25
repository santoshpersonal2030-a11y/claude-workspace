"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type Pooja,
  poojaCategories,
  ritualTypes,
  formatINR,
} from "@/lib/poojas";
import { useT } from "@/components/LanguageProvider";

export default function PoojaList({ poojas }: { poojas: Pooja[] }) {
  const t = useT();
  const [active, setActive] = useState<string>("All");
  const [activeType, setActiveType] = useState<string>("All");
  const [query, setQuery] = useState("");

  const filters = ["All", ...poojaCategories];
  const typeFilters = ["All", ...ritualTypes];
  const term = query.trim().toLowerCase();
  const visible = poojas.filter((p) => {
    const matchesCategory = active === "All" || p.category === active;
    const matchesType = activeType === "All" || p.ritualType === activeType;
    const matchesQuery =
      term === "" ||
      p.name.toLowerCase().includes(term) ||
      p.sanskritName?.toLowerCase().includes(term) ||
      p.shortDescription.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.ritualType.toLowerCase().includes(term);
    return matchesCategory && matchesType && matchesQuery;
  });

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/65">
          🔍
        </span>
        <input
          type="search"
          value={query}
          aria-label={t("browse.searchPoojas")}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("browse.searchPoojas")}
          className="w-full rounded-full border border-saffron-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
        />
      </div>

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
                  ? "bg-saffron-700 text-white shadow-sm"
                  : "border border-saffron-200 bg-white text-saffron-700 hover:bg-saffron-50")
              }
            >
              {cat === "All" ? t("browse.all") : t(`pcat.${cat}`)}
            </button>
          );
        })}
      </div>

      {/* Ritual-type filter chips */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs text-foreground/65">{t("browse.type")}</span>
        {typeFilters.map((rt) => {
          const isActive = activeType === rt;
          return (
            <button
              key={rt}
              onClick={() => setActiveType(rt)}
              className={
                "rounded-full px-3 py-1 text-xs font-medium transition-colors " +
                (isActive
                  ? "bg-maroon-700 text-white shadow-sm"
                  : "border border-stone-200 bg-white text-foreground/65 hover:bg-stone-50")
              }
            >
              {rt === "All" ? t("browse.all") : t(`prit.${rt}`)}
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
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-medium text-saffron-700">
                  {t(`pcat.${pooja.category}`)}
                </span>
                <span className="rounded-full bg-maroon-50 px-2.5 py-0.5 text-[11px] font-medium text-maroon-700">
                  {t(`prit.${pooja.ritualType}`)}
                </span>
              </div>
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
              <span className="text-sm text-foreground/65">
                {t("browse.startsAt")}{" "}
                <span className="font-semibold text-foreground">
                  {formatINR(pooja.startingPrice)}
                </span>
              </span>
              <span className="text-sm font-semibold text-saffron-700">
                {t("browse.book")}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-10 text-center text-foreground/65">
          {term
            ? t("browse.noMatch", { q: query.trim() })
            : t("browse.noneInCategory")}
        </p>
      )}
    </div>
  );
}
