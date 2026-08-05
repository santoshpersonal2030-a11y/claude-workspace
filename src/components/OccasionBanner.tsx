import Link from "next/link";

import { localizeFestivalName } from "@/lib/festivals-i18n";
import type { Occasion } from "@/lib/store-calendar";
import { getDictionary, type Locale } from "@/lib/i18n";

/* "Diwali is in 12 days" — the one-line join between the store and the calendar.
 *
 * Server component: it takes an already-computed Occasion so the page decides what to show and
 * this only renders it. No client JavaScript, so it works on a prerendered page.
 *
 * Note what it does NOT say when no lead time is configured: it never invents a delivery promise.
 * See samagriLeadDays() in src/lib/store-calendar.ts for why that matters more here than in
 * ordinary retail.
 */
export default function OccasionBanner({
  occasion,
  locale,
  showShopLink = false,
}: {
  occasion: Occasion;
  locale: Locale;
  /** Store pages link to the festival; the festival page links to the store instead. */
  showShopLink?: boolean;
}) {
  const { t } = getDictionary(locale);
  const name = localizeFestivalName(occasion.festival.name, locale);

  const countdown =
    occasion.daysAway === 0
      ? t("sc.countdownToday", { name })
      : occasion.daysAway === 1
        ? t("sc.countdownTomorrow", { name })
        : t("sc.countdown", { name, n: occasion.daysAway });

  const dateFormat = new Intl.DateTimeFormat(
    locale === "hi" ? "hi-IN" : locale === "te" ? "te-IN" : "en-IN",
    { day: "numeric", month: "long", timeZone: "UTC" },
  );

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-saffron-300 bg-saffron-50/70 px-4 py-3">
      <span className="text-2xl" aria-hidden="true">
        {occasion.festival.emoji}
      </span>
      <div className="min-w-48 flex-1">
        <p className="font-heading text-base text-maroon-800">{countdown}</p>

        {occasion.orderBy && !occasion.tooLateToOrder && (
          <p className="mt-0.5 text-sm text-foreground/70">
            {t("sc.orderBy", {
              date: dateFormat.format(new Date(`${occasion.orderBy}T00:00:00Z`)),
            })}
          </p>
        )}
        {occasion.tooLateToOrder && (
          <p className="mt-0.5 text-sm text-foreground/70">{t("sc.tooLate", { name })}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {showShopLink ? (
          <Link
            href="/store"
            className="whitespace-nowrap rounded-full bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            {t("sc.shopFor", { name })}
          </Link>
        ) : (
          <Link
            href={`/festivals/${occasion.festival.slug}`}
            className="whitespace-nowrap rounded-full bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            {name}
          </Link>
        )}
        <Link
          href={`/poojas/${occasion.festival.poojaSlug}`}
          className="whitespace-nowrap rounded-full border border-saffron-300 px-4 py-2 text-sm font-semibold text-saffron-700 hover:bg-white"
        >
          {t("sc.bookFor")}
        </Link>
      </div>
    </div>
  );
}
