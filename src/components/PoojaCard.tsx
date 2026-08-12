import Link from "next/link";

import { type Pooja, formatINR } from "@/lib/poojas";
import { getDictionary, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

// A single pooja card linking to its booking page. Server component, reused by
// the ceremony sections (the catalog grid has its own client-filtered copy).
// The locale has to be passed in: a server component has no context to read it from, which is
// why "Starts at" and "Book →" were English here while the client-filtered copy of this same
// card translated both correctly. The keys are browse.* — the ones that copy already uses —
// rather than new ones, so the two cards cannot drift apart.
export default function PoojaCard({
  pooja,
  locale = DEFAULT_LOCALE,
}: {
  pooja: Pooja;
  locale?: Locale;
}) {
  const { t } = getDictionary(locale);
  return (
    <Link
      href={`/poojas/${pooja.slug}`}
      className="group flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-saffron-200 hover:shadow-md"
    >
      {/* Icon inline beside the name rather than stacked above it — matches PoojaList. */}
      <div className="flex items-start justify-end">
        <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-medium text-saffron-700">
          {/* PoojaList renders the very same badge as t(`pcat.${category}`). This one
              printed the raw English value, so the two cards disagreed on the same page —
              the third time these two have drifted (see "Starts at" and "Book →"). */}
          {t(`pcat.${pooja.category}`)}
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
  );
}
