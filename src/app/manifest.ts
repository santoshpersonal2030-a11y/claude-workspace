import type { MetadataRoute } from "next";

// Web app manifest (served at /manifest.webmanifest) — makes the site
// installable as a PWA.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BookMyPoojari — Pandits & Pooja Samagri",
    short_name: "BookMyPoojari",
    description:
      "Book verified Hindu priests for any ceremony and order authentic pooja samagri, delivered to your door.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fffaf3",
    theme_color: "#d4540a",
    lang: "en",
    categories: ["lifestyle", "shopping"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
