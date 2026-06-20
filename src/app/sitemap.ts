import type { MetadataRoute } from "next";

import {
  getPoojaSlugs,
  getProductSlugs,
  getPanditSlugs,
} from "@/lib/queries";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookmypoojari.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/poojas",
    "/store",
    "/pandits",
    "/how-it-works",
    "/about",
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

  const [poojaSlugs, productSlugs, panditSlugs] = await Promise.all([
    getPoojaSlugs(),
    getProductSlugs(),
    getPanditSlugs(),
  ]);

  const dynamicRoutes = [
    ...poojaSlugs.map((slug) => `/poojas/${slug}`),
    ...productSlugs.map((slug) => `/store/${slug}`),
    ...panditSlugs.map((slug) => `/pandits/${slug}`),
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
