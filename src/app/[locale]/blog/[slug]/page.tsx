import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getPublishedPost } from "@/lib/blog-db";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { formatDate } from "@/lib/dates";

export const revalidate = 300;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookmypoojari.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const post = await getPublishedPost(slug);
  if (!post) return { title: t("blog.notFound") };
  return { title: `${post.title} — BookMyPoojari`, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    articleSection: post.category,
    author: { "@type": "Organization", name: "BookMyPoojari" },
    publisher: { "@type": "Organization", name: "BookMyPoojari", url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <nav className="text-sm text-foreground/65">
            <Link href="/blog" className="hover:text-saffron-700">
              {t("blog.back")}
            </Link>
          </nav>
          <p className="mt-4 text-xs font-medium text-saffron-700">
            {post.category} · {t("blog.readMinutes", { n: post.readingMinutes })}{" "}
            · {formatDate(post.date, loc)}
          </p>
          <h1 className="mt-2 font-heading text-4xl text-maroon-800">
            {post.title}
          </h1>
          <p className="mt-3 text-lg text-foreground/70">{post.excerpt}</p>

          <div className="mt-4 space-y-6">
            {post.body.map((section, i) => (
              <section key={i}>
                {section.heading && (
                  <h2 className="font-heading text-2xl text-maroon-800">
                    {section.heading}
                  </h2>
                )}
                {section.paragraphs.map((para, j) => (
                  <p
                    key={j}
                    className="mt-3 leading-relaxed text-foreground/75"
                  >
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm">
            <Link
              href="/poojas"
              className="rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
            >
              {t("blog.bookPooja")}
            </Link>
            <Link
              href="/muhurat"
              className="rounded-full border border-saffron-300 px-6 py-2.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
            >
              {t("blog.findMuhurat")}
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
