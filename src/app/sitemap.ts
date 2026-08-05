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
import { festivalPages } from "@/lib/festival-pages";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookmypoojari.com";

/* The site is served in three languages: English at clean URLs ("/poojas"), Hindi and Telugu
   under a prefix ("/hi/poojas", "/te/poojas") — see src/proxy.ts. Until 05-Aug-2026 this sitemap
   listed each page exactly once, at its English URL, so the Hindi and Telugu pages were invisible
   to search engines even though they exist and are fully translated. Every page is now listed in
   every language, and each entry carries hreflang alternates so the three are understood as the
   same page in three languages rather than three duplicates competing with each other. */
const localizedUrl = (locale: string, path: string) =>
  `${siteUrl}${locale === DEFAULT_LOCALE ? "" : `/${locale}`}${path}`;

// The hreflang block is identical for every language version of a page, and x-default points at
// English — the version served to a visitor whose language we do not know.
const alternatesFor = (path: string) => ({
  languages: {
    ...Object.fromEntries(LOCALES.map((l) => [l, localizedUrl(l, path)])),
    "x-default": localizedUrl(DEFAULT_LOCALE, path),
  },
});

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
  ].flatMap((path) =>
    LOCALES.map((locale) => ({
      url: localizedUrl(locale, path),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
      alternates: alternatesFor(path),
    })),
  );

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
    // One page per festival. These are the highest-intent URLs on the site — people search
    // "when is Diwali 2027" by name, every year — so they must not be left out of the sitemap
    // the way the whole Hindi and Telugu site was until this morning.
    ...festivalPages().map((f) => `/festivals/${f.slug}`),
  ].flatMap((path) =>
    LOCALES.map((locale) => ({
      url: localizedUrl(locale, path),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: alternatesFor(path),
    })),
  );

  return [...staticRoutes, ...dynamicRoutes];
}
