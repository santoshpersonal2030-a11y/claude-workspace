// Shared structured-data helpers. Pages compose these into JSON-LD via the
// <JsonLd> component. Keeping the Organization/WebSite identity in one place
// lets every schema cross-reference it by @id.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookmypoojari.com";

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const organizationLd = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "BookMyPoojari",
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  description:
    "Book verified Hindu priests (Pandits/Poojaris) for any ceremony, and order authentic pooja samagri delivered to your door.",
};

// WebSite + a sitelinks SearchAction pointing at the on-site search.
export const websiteLd = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: "BookMyPoojari",
  publisher: { "@id": ORG_ID },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// A BreadcrumbList from [{name, path}] crumbs (path relative to the site root).
export function breadcrumbLd(
  crumbs: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
}
