import Link from "next/link";

import { type Pooja, formatINR } from "@/lib/poojas";

// A single pooja card linking to its booking page. Server component, reused by
// the ceremony sections (the catalog grid has its own client-filtered copy).
export default function PoojaCard({ pooja }: { pooja: Pooja }) {
  return (
    <Link
      href={`/poojas/${pooja.slug}`}
      className="group flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-saffron-200 hover:shadow-md"
    >
      {/* Icon inline beside the name rather than stacked above it — matches PoojaList. */}
      <div className="flex items-start justify-end">
        <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-medium text-saffron-700">
          {pooja.category}
        </span>
      </div>
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
          Starts at{" "}
          <span className="font-semibold text-foreground">
            {formatINR(pooja.startingPrice)}
          </span>
        </span>
        <span className="text-sm font-semibold text-saffron-700">Book →</span>
      </div>
    </Link>
  );
}
