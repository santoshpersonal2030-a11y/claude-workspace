import type { MetadataRoute } from "next";

// Web app manifest (served at /manifest.webmanifest) — makes the site
// installable as a PWA and is the source of truth the native wrappers
// (Bubblewrap TWA / Capacitor — see docs/NATIVE-APP.md) build on top of.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BookMyPoojari — Pandits & Pooja Samagri",
    short_name: "BookMyPoojari",
    description:
      "Book verified Hindu priests for any ceremony and order authentic pooja samagri, delivered to your door.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fffaf3",
    theme_color: "#d4540a",
    lang: "en",
    categories: ["lifestyle", "shopping"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press / quick actions on the installed app icon.
    shortcuts: [
      {
        name: "Book a Pooja",
        short_name: "Book Pooja",
        description: "Book a verified Pandit for a ceremony",
        url: "/poojas",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Talk to an Astrologer",
        short_name: "Astrologer",
        description: "Chat or call a live astrologer now",
        url: "/live-astrology",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Today's Panchang",
        short_name: "Panchang",
        description: "Tithi, nakshatra and muhurat for today",
        url: "/panchang",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Samagri Store",
        short_name: "Store",
        description: "Shop authentic pooja samagri",
        url: "/store",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
    // Accept text/links shared from other apps into our search.
    share_target: {
      action: "/search",
      method: "GET",
      params: { title: "q", text: "q", url: "q" },
    },
  };
}
