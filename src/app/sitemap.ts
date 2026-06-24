import type { MetadataRoute } from "next";

import {
  getPoojaSlugs,
  getProductSlugs,
  getPanditSlugs,
} from "@/lib/queries";
import { CITY_COORDS } from "@/lib/muhurat-engine";
import { getPublishedPosts } from "@/lib/blog-db";
import { consultations } from "@/lib/consultations";
import { templePujas } from "@/lib/temple-pujas";
import { SIGNS } from "@/lib/horoscope";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookmypoojari.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/poojas",
    "/store",
    "/pandits",
    "/muhurat",
    "/panchang",
    "/choghadiya",
    "/gun-milan",
    "/festivals",
    "/consultations",
    "/temple-puja",
    "/horoscope",
    "/kundli",
    "/blog",
    "/how-it-works",
    "/about",
    "/become-a-pandit",
    "/contact",
    "/terms",
    "/privacy",
    "/refund-policy",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const [poojaSlugs, productSlugs, panditSlugs, posts] = await Promise.all([
    getPoojaSlugs(),
    getProductSlugs(),
    getPanditSlugs(),
    getPublishedPosts(),
  ]);

  const citySlugs = Object.keys(CITY_COORDS).map(
    (c) => `/pandits/in/${c.toLowerCase().replace(/\s+/g, "-")}`,
  );

  const dynamicRoutes = [
    ...poojaSlugs.map((slug) => `/poojas/${slug}`),
    ...productSlugs.map((slug) => `/store/${slug}`),
    ...panditSlugs.map((slug) => `/pandits/${slug}`),
    ...consultations.map((c) => `/consultations/${c.slug}`),
    ...templePujas.map((p) => `/temple-puja/${p.slug}`),
    ...SIGNS.map((s) => `/horoscope/${s.slug}`),
    ...citySlugs,
    ...posts.map((p) => `/blog/${p.slug}`),
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
