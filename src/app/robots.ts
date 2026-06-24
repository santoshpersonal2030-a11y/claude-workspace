import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookmypoojari.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private/transactional areas out of the index.
      disallow: ["/admin", "/account", "/priest", "/api", "/cart", "/login"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
