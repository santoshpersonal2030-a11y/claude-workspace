import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import {
  type Pooja,
  poojas as seedPoojas,
  popularPoojas as seedPopularPoojas,
  getPoojaBySlug as seedPoojaBySlug,
} from "@/lib/poojas";
import {
  type Pandit,
  pandits as seedPandits,
  getPanditBySlug as seedPanditBySlug,
} from "@/lib/pandits";

// Lightweight, cookieless Supabase client for public catalog reads. It carries
// no user session, so RLS treats it as `anon` (which can read active rows) and
// the pages using it stay cacheable. Auth flows use the cookie-aware clients
// in src/lib/supabase/ instead.
const db = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

type PoojaRow = Database["public"]["Tables"]["poojas"]["Row"];

// Maps a database row to the camelCase `Pooja` shape the UI components expect.
function rowToPooja(row: PoojaRow): Pooja {
  return {
    slug: row.slug,
    name: row.name,
    sanskritName: row.sanskrit_name ?? undefined,
    emoji: row.emoji ?? "🪔",
    category: row.category,
    shortDescription: row.short_description ?? "",
    durationHours: Number(row.duration_hours),
    startingPrice: row.starting_price,
    samagriKitPrice: row.samagri_kit_price ?? undefined,
    longDescription: row.long_description ?? undefined,
    includes: row.includes ?? undefined,
    popular: row.popular,
  };
}

// All active poojas, ordered with the popular ones first. Falls back to the
// bundled seed catalog if the database is unreachable (e.g. during a build
// without network access), so the catalog never goes blank.
export async function getPoojas(): Promise<Pooja[]> {
  try {
    const { data, error } = await db
      .from("poojas")
      .select("*")
      .eq("active", true)
      .order("popular", { ascending: false })
      .order("starting_price", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(rowToPooja);
  } catch (err) {
    console.warn("getPoojas: falling back to seed catalog —", err);
    return seedPoojas;
  }
}

// The most-booked poojas, for the homepage.
export async function getPopularPoojas(): Promise<Pooja[]> {
  try {
    const { data, error } = await db
      .from("poojas")
      .select("*")
      .eq("active", true)
      .eq("popular", true)
      .order("starting_price", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(rowToPooja);
  } catch (err) {
    console.warn("getPopularPoojas: falling back to seed catalog —", err);
    return seedPopularPoojas;
  }
}

// A single active pooja by slug, or null if it doesn't exist.
export async function getPoojaBySlug(slug: string): Promise<Pooja | null> {
  try {
    const { data, error } = await db
      .from("poojas")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (error) throw error;
    return data ? rowToPooja(data) : null;
  } catch (err) {
    console.warn("getPoojaBySlug: falling back to seed catalog —", err);
    return seedPoojaBySlug(slug) ?? null;
  }
}

// Just the slugs, used by generateStaticParams to pre-render detail pages.
export async function getPoojaSlugs(): Promise<string[]> {
  try {
    const { data, error } = await db
      .from("poojas")
      .select("slug")
      .eq("active", true);

    if (error) throw error;
    return (data ?? []).map((r) => r.slug);
  } catch (err) {
    console.warn("getPoojaSlugs: falling back to seed catalog —", err);
    return seedPoojas.map((p) => p.slug);
  }
}

// ── Samagri store products ────────────────────────────────────────────────

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export type StoreProduct = {
  slug: string;
  name: string;
  description: string | null;
  price: number;
  mrp: number | null;
  category: string | null;
  imageUrl: string | null;
  stock: number;
  rating: number;
  reviewCount: number;
};

function rowToProduct(row: ProductRow): StoreProduct {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: row.price,
    mrp: row.mrp,
    category: row.category,
    imageUrl: row.image_url,
    stock: row.stock,
    rating: Number(row.rating),
    reviewCount: row.review_count,
  };
}

// All active products. Products live only in the database (no seed), so on a
// network failure this returns an empty list rather than throwing.
export async function getProducts(): Promise<StoreProduct[]> {
  try {
    const { data, error } = await db
      .from("products")
      .select("*")
      .eq("active", true)
      .order("category", { ascending: true })
      .order("price", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(rowToProduct);
  } catch (err) {
    console.warn("getProducts: returning empty list —", err);
    return [];
  }
}

export async function getProductSlugs(): Promise<string[]> {
  try {
    const { data, error } = await db
      .from("products")
      .select("slug")
      .eq("active", true);

    if (error) throw error;
    return (data ?? []).map((r) => r.slug);
  } catch (err) {
    console.warn("getProductSlugs: returning empty list —", err);
    return [];
  }
}

// ── Pandits ────────────────────────────────────────────────────────────────

type PanditRow = Database["public"]["Tables"]["pandits"]["Row"];

function rowToPandit(row: PanditRow): Pandit {
  return {
    slug: row.slug ?? "",
    fullName: row.full_name,
    bio: row.bio ?? "",
    experienceYears: row.experience_years ?? 0,
    languages: row.languages,
    regions: row.regions,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    photoUrl: row.photo_url,
    verified: row.verified,
  };
}

// Active, verified-first pandits, highest rated first. Falls back to the seed
// roster if the database is unreachable.
export async function getPandits(): Promise<Pandit[]> {
  try {
    const { data, error } = await db
      .from("pandits")
      .select("*")
      .eq("active", true)
      .not("slug", "is", null)
      .order("verified", { ascending: false })
      .order("rating", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(rowToPandit);
  } catch (err) {
    console.warn("getPandits: falling back to seed roster —", err);
    return seedPandits;
  }
}

export async function getPanditBySlug(slug: string): Promise<Pandit | null> {
  try {
    const { data, error } = await db
      .from("pandits")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (error) throw error;
    return data ? rowToPandit(data) : null;
  } catch (err) {
    console.warn("getPanditBySlug: falling back to seed roster —", err);
    return seedPanditBySlug(slug) ?? null;
  }
}

export async function getPanditSlugs(): Promise<string[]> {
  try {
    const { data, error } = await db
      .from("pandits")
      .select("slug")
      .eq("active", true)
      .not("slug", "is", null);

    if (error) throw error;
    return (data ?? []).map((r) => r.slug as string);
  } catch (err) {
    console.warn("getPanditSlugs: falling back to seed roster —", err);
    return seedPandits.map((p) => p.slug);
  }
}

export async function getProductBySlug(
  slug: string,
): Promise<StoreProduct | null> {
  try {
    const { data, error } = await db
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (error) throw error;
    return data ? rowToProduct(data) : null;
  } catch (err) {
    console.warn("getProductBySlug: returning null —", err);
    return null;
  }
}

// Other active products in the same category, for "You may also like".
export async function getRelatedProducts(
  slug: string,
  category: string | null,
  limit = 4,
): Promise<StoreProduct[]> {
  if (!category) return [];
  try {
    const { data, error } = await db
      .from("products")
      .select("*")
      .eq("active", true)
      .eq("category", category)
      .neq("slug", slug)
      .order("review_count", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map(rowToProduct);
  } catch (err) {
    console.warn("getRelatedProducts: returning empty list —", err);
    return [];
  }
}

export type ProductReview = {
  id: string;
  reviewerName: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
};

// Public reviews for a product, newest first.
export async function getProductReviews(
  productSlug: string,
): Promise<ProductReview[]> {
  try {
    const { data: product } = await db
      .from("products")
      .select("id")
      .eq("slug", productSlug)
      .maybeSingle();
    if (!product) return [];

    const { data, error } = await db
      .from("product_reviews")
      .select("id, reviewer_name, rating, title, body, created_at")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      reviewerName: r.reviewer_name,
      rating: r.rating,
      title: r.title,
      body: r.body,
      createdAt: r.created_at,
    }));
  } catch (err) {
    console.warn("getProductReviews: returning empty list —", err);
    return [];
  }
}

