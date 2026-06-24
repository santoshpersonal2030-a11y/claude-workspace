import { createClient } from "@/lib/supabase/server";
import { consultations } from "@/lib/consultations";

// Lightweight site-wide search across the public catalog. Uses case-insensitive
// `ilike` over the already-public tables (RLS limits results to active/published
// rows) plus an in-memory filter of the consultation seed. Good enough for the
// catalog's size; can graduate to Postgres full-text search later.

export type SearchHit = {
  title: string;
  href: string;
  subtitle?: string;
  emoji?: string;
  image?: string | null;
};

export type SearchResults = {
  query: string;
  poojas: SearchHit[];
  consultations: SearchHit[];
  products: SearchHit[];
  pandits: SearchHit[];
  blog: SearchHit[];
  total: number;
};

const PER_GROUP = 6;

export function normalizeQuery(raw: string | undefined): string {
  // Strip characters that would break a PostgREST `or=` filter or an ilike
  // pattern, and bound the length.
  return (raw ?? "").trim().replace(/[%_,()]/g, " ").slice(0, 60);
}

export async function searchSite(rawQuery: string): Promise<SearchResults> {
  const query = normalizeQuery(rawQuery);
  const empty: SearchResults = {
    query,
    poojas: [],
    consultations: [],
    products: [],
    pandits: [],
    blog: [],
    total: 0,
  };
  if (query.length < 2) return empty;

  const supabase = await createClient();
  const like = `%${query}%`;

  const [poojasRes, productsRes, panditsRes, blogRes] = await Promise.all([
    supabase
      .from("poojas")
      .select("slug, name, emoji, short_description")
      .or(`name.ilike.${like},short_description.ilike.${like}`)
      .limit(PER_GROUP),
    supabase
      .from("products")
      .select("slug, name, image_url, category")
      .or(`name.ilike.${like},category.ilike.${like}`)
      .limit(PER_GROUP),
    supabase
      .from("pandits")
      .select("slug, full_name, regions")
      .ilike("full_name", like)
      .limit(PER_GROUP),
    supabase
      .from("blog_posts")
      .select("slug, title, excerpt, category")
      .or(`title.ilike.${like},excerpt.ilike.${like}`)
      .limit(PER_GROUP),
  ]);

  const poojas: SearchHit[] = (poojasRes.data ?? []).map((p) => ({
    title: p.name,
    href: `/poojas/${p.slug}`,
    subtitle: p.short_description ?? undefined,
    emoji: p.emoji ?? "🪔",
  }));

  const products: SearchHit[] = (productsRes.data ?? []).map((p) => ({
    title: p.name,
    href: `/store/${p.slug}`,
    subtitle: p.category ?? undefined,
    image: p.image_url,
  }));

  const pandits: SearchHit[] = (panditsRes.data ?? [])
    .filter((p) => p.slug)
    .map((p) => ({
      title: p.full_name,
      href: `/pandits/${p.slug}`,
      subtitle: (p.regions ?? []).slice(0, 3).join(", ") || undefined,
      emoji: "🧑🏽‍🦳",
    }));

  const blog: SearchHit[] = (blogRes.data ?? []).map((b) => ({
    title: b.title,
    href: `/blog/${b.slug}`,
    subtitle: b.category,
    emoji: "📖",
  }));

  // Consultation catalog is seed data — filter it in memory.
  const q = query.toLowerCase();
  const consults: SearchHit[] = consultations
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.shortDescription.toLowerCase().includes(q),
    )
    .slice(0, PER_GROUP)
    .map((c) => ({
      title: c.name,
      href: `/consultations/${c.slug}`,
      subtitle: c.shortDescription,
      emoji: c.emoji,
    }));

  const total =
    poojas.length +
    consults.length +
    products.length +
    pandits.length +
    blog.length;

  return {
    query,
    poojas,
    consultations: consults,
    products,
    pandits,
    blog,
    total,
  };
}
