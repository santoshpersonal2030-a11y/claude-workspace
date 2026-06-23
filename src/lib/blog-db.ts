// SERVER-ONLY: merges DB-authored blog posts over the built-in code seed, so
// the original posts stay live out of the box while the admin CMS can add new
// ones or override a seed post by reusing its slug.

import { createAdminClient } from "@/lib/supabase/admin";
import { blogPosts, parseBlogContent, type BlogPost } from "@/lib/blog";

type Row = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  reading_minutes: number;
  content: string;
  published_at: string;
};

function toPost(r: Row): BlogPost {
  return {
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    date: r.published_at,
    readingMinutes: r.reading_minutes,
    category: r.category,
    body: parseBlogContent(r.content),
  };
}

async function dbPosts(): Promise<BlogPost[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("blog_posts")
      .select(
        "slug, title, excerpt, category, reading_minutes, content, published_at",
      )
      .eq("published", true);
    return (data ?? []).map(toPost);
  } catch (err) {
    console.error("blog DB read failed, using seed only:", err);
    return [];
  }
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const bySlug = new Map<string, BlogPost>();
  for (const p of blogPosts) bySlug.set(p.slug, p);
  for (const p of await dbPosts()) bySlug.set(p.slug, p); // DB overrides seed
  return [...bySlug.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPublishedPost(
  slug: string,
): Promise<BlogPost | undefined> {
  return (await getPublishedPosts()).find((p) => p.slug === slug);
}
