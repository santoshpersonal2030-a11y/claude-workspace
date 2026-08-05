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
    <>
      {/* The page heading and the search box now share one row.
          This block used to live in poojas/page.tsx while the search sat below it, at the top of
          this component. Santosh asked in June for the search to move up beside the "Book a
          Pooja" heading, so the hero moved in here instead — the search owns the query state and
          the two cannot be in different components and still sit on the same line.
          The heading is still server-rendered: Next renders client components on the server too,
          so the <h1> is in the HTML a crawler receives, exactly as before. */}
      <section className="bg-temple-gradient">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <nav className="text-sm text-foreground/65">
            <span>{t("common.home")}</span>
            <span className="mx-2">/</span>
            <span className="text-saffron-700">{t("nav.bookPooja")}</span>
          </nav>

          {/* Stacks on a phone, side by side from 640px up. Hindi and Telugu headings are longer
              than the English one, which is why the search has a max width rather than a fixed
              one and the row is allowed to wrap. */}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="font-heading text-4xl text-maroon-800">
              {t("nav.bookPooja")}
            </h1>
            <div className="relative w-full sm:w-auto sm:min-w-56 sm:max-w-sm sm:flex-1">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/65"
              >
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
          </div>

          <p className="mt-3 max-w-2xl text-lg text-foreground/70">
            {t("poojas.subtitle")}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
      <h2 className="sr-only">{t("dir.allPoojas")}</h2>
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
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((pooja) => (
          <Link
            key={pooja.slug}
            href={`/poojas/${pooja.slug}`}
            className="group flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-saffron-200 hover:shadow-md"
          >
            {/* The icon used to sit on its own line above the name. It now sits beside it (see
                the <h3> below), so this row carries only the category and ritual chips. */}
            <div className="flex items-start justify-end">
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-medium text-saffron-700">
                  {t(`pcat.${pooja.category}`)}
                </span>
                <span className="rounded-full bg-maroon-50 px-2.5 py-0.5 text-[11px] font-medium text-maroon-700">
                  {t(`prit.${pooja.ritualType}`)}
                </span>
              </div>
            </div>
            {/* aria-hidden on the icon: it repeats what the name already says, and a screen
                reader announcing "diya lamp, Satyanarayan Katha" is noise, not information. */}
            <h3 className="mt-4 flex items-start gap-2.5 font-heading text-lg text-maroon-700">
              <span aria-hidden="true" className="text-2xl leading-tight">
                {pooja.emoji}
              </span>
              <span>{pooja.name}</span>
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
        <p className="mt-5 text-center text-foreground/65">
          {term
            ? t("browse.noMatch", { q: query.trim() })
            : t("browse.noneInCategory")}
        </p>
      )}
      </div>
    </>
  );
}
