import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { blogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Poojas, Muhurat & Hindu Traditions",
  description:
    "Guides to Hindu ceremonies, poojas, the samskaras and choosing an auspicious muhurat — from the team at BookMyPoojari.",
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
function fmt(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export default function BlogPage() {
  const posts = blogPosts
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="hover:text-saffron-700">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">Blog</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">Blog</h1>
            <p className="mt-2 max-w-2xl text-lg text-foreground/70">
              Guides to ceremonies, poojas and the panchang — to help your family
              perform every ritual with confidence.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group flex flex-col rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <span className="text-xs font-medium text-saffron-700">
                  {p.category} · {p.readingMinutes} min read
                </span>
                <h2 className="mt-2 font-heading text-xl text-maroon-700 group-hover:text-saffron-700">
                  {p.title}
                </h2>
                <p className="mt-2 flex-1 text-sm text-foreground/65">
                  {p.excerpt}
                </p>
                <span className="mt-3 text-xs text-foreground/45">
                  {fmt(p.date)}
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
