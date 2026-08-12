import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPublishedPosts } from "@/lib/blog-db";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { formatDateShort } from "@/lib/dates";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.blog.title"), description: t("meta.blog.desc") };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);
  const posts = await getPublishedPosts();

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{t("blog.h1")}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("blog.h1")}
            </h1>
            <p className="mt-2 max-w-2xl text-lg text-foreground/70">
              {t("blog.intro")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                {/* The category comes from the database and is English there; only the
                    "N min read" part can be translated from here. */}
                <span className="text-xs font-medium text-saffron-700">
                  {p.category} · {t("blog.readMinutes", { n: p.readingMinutes })}
                </span>
                <h2 className="mt-2 font-heading text-xl text-maroon-700 group-hover:text-saffron-700">
                  {p.title}
                </h2>
                <p className="mt-2 flex-1 text-sm text-foreground/65">
                  {p.excerpt}
                </p>
                {/* Was a hand-rolled formatter with a hardcoded English month array. */}
                <span className="mt-3 text-xs text-foreground/65">
                  {formatDateShort(p.date, loc)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
