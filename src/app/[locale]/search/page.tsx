import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBox from "@/components/SearchBox";
import { searchSite, type SearchHit, type SearchResults } from "@/lib/search";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  // Search results aren't useful in the index.
  return { title: t("search.title"), robots: { index: false } };
}

const GROUPS: { key: keyof SearchResults; labelKey: string }[] = [
  { key: "poojas", labelKey: "search.gPoojas" },
  { key: "consultations", labelKey: "search.gConsultations" },
  { key: "products", labelKey: "search.gProducts" },
  { key: "pandits", labelKey: "search.gPandits" },
  { key: "blog", labelKey: "search.gBlog" },
];

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const results = await searchSite(q ?? "");

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
            <h1 className="font-heading text-3xl text-maroon-800">
              {t("search.title")}
            </h1>
            <div className="mt-4">
              <SearchBox
                defaultValue={results.query}
                placeholder={t("search.placeholder")}
                ariaLabel={t("search.title")}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          {results.query.length < 2 ? (
            <p className="text-foreground/65">{t("search.prompt")}</p>
          ) : results.total === 0 ? (
            <p className="text-foreground/65">
              {t("search.none", { q: results.query })}
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm text-foreground/65">
                {t("search.resultsFor", { q: results.query })}
              </p>
              <div className="space-y-8">
                {GROUPS.map(({ key, labelKey }) => {
                  const hits = results[key] as SearchHit[];
                  if (!hits.length) return null;
                  return (
                    <ResultGroup key={key} heading={t(labelKey)} hits={hits} />
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function ResultGroup({
  heading,
  hits,
}: {
  heading: string;
  hits: SearchHit[];
}) {
  return (
    <div>
      <h2 className="font-heading text-lg text-maroon-700">{heading}</h2>
      <ul className="mt-3 divide-y divide-saffron-50 overflow-hidden rounded-2xl border border-saffron-100 bg-white shadow-sm">
        {hits.map((hit) => (
          <li key={hit.href}>
            <Link
              href={hit.href}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-saffron-50"
            >
              {hit.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hit.image}
                  alt=""
                  className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-saffron-50 text-xl">
                  {hit.emoji ?? "🔎"}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground">
                  {hit.title}
                </span>
                {hit.subtitle && (
                  <span className="block truncate text-sm text-foreground/65">
                    {hit.subtitle}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
