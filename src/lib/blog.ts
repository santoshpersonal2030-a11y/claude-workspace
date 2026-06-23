// Editorial blog content — self-contained, typed seed posts (no CMS dependency).
// Each post links into the catalog/almanac for SEO and internal navigation.

export type BlogSection = { heading?: string; paragraphs: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO YYYY-MM-DD
  readingMinutes: number;
  category: string;
  body: BlogSection[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "16-hindu-samskaras-explained",
    title: "The 16 Hindu Samskaras, Explained",
    excerpt:
      "From Jatakarma at birth to Antyeshti at the end of life, the sixteen sacraments that mark a Hindu life — and when each is performed.",
    date: "2026-05-10",
    readingMinutes: 7,
    category: "Sanskars",
    body: [
      {
        paragraphs: [
          "The samskaras are the sixteen sacraments (sanskars) that sanctify the key milestones of a Hindu life. Each is a rite of passage, performed with specific mantras and, for many, at an auspicious muhurat. While few families today observe all sixteen, the major ones remain central to family life.",
        ],
      },
      {
        heading: "Before and around birth",
        paragraphs: [
          "The cycle begins in the womb with Garbhadhana, Pumsavana and Simantonnayana (the baby shower, or Godh Bharai). Soon after birth comes Jatakarma, the welcoming rite, followed by Namkaran — the naming ceremony — and Nishkramana, the cradle ceremony and baby's first outing.",
        ],
      },
      {
        heading: "Childhood",
        paragraphs: [
          "Annaprashan marks the first solid food; Chudakarana (Mundan) the first haircut; and Karnavedha the ear-piercing. Vidyarambha begins formal learning, when the child writes their first letters under the blessings of Saraswati.",
        ],
      },
      {
        heading: "Coming of age and beyond",
        paragraphs: [
          "Upanayana — the sacred-thread (janeu) ceremony — initiates the child into Vedic study. Vivaha (marriage) is the grand householder sacrament, and Antyeshti, the last rites, completes the cycle with dignity.",
          "You can book a verified Pandit for any of these ceremonies, with the muhurat confirmed where needed, from our ceremonies and poojas pages.",
        ],
      },
    ],
  },
  {
    slug: "choosing-a-muhurat-for-griha-pravesh",
    title: "Choosing a Muhurat for Griha Pravesh",
    excerpt:
      "What makes a date auspicious for a house-warming — the nakshatra, tithi and the months to avoid — and how to find one.",
    date: "2026-05-22",
    readingMinutes: 5,
    category: "Muhurat",
    body: [
      {
        paragraphs: [
          "Griha Pravesh, the house-warming ceremony, is traditionally performed at an auspicious muhurat so the family enters their new home under favourable stars. A good muhurat balances several factors of the panchang.",
        ],
      },
      {
        heading: "What goes into the date",
        paragraphs: [
          "Favourable nakshatras for Griha Pravesh include Rohini, Mrigashira, Uttara Phalguni, Hasta, Chitra, Anuradha, Uttara Ashadha, Uttara Bhadrapada and Revati. The tithi should avoid the Rikta tithis (4th, 9th, 14th) and Amavasya, and the day should be free of the Vishti (Bhadra) karana.",
          "Certain months are traditionally avoided altogether — Kharmas (when the Sun is in Sagittarius or Pisces) and the Chaturmas / monsoon window. Our computed engine applies exactly these rules.",
        ],
      },
      {
        heading: "Finding one",
        paragraphs: [
          "You can browse computed, astrologer-reviewed Griha Pravesh muhurats on our Shubh Muhurat page, check the day's panchang for any date, and book a verified Pandit who will confirm the final timing with you.",
        ],
      },
    ],
  },
  {
    slug: "what-to-expect-satyanarayan-katha",
    title: "What to Expect in a Satyanarayan Katha",
    excerpt:
      "A simple guide to the Satyanarayan Puja and Katha — what happens, what you need, and when families perform it.",
    date: "2026-06-02",
    readingMinutes: 4,
    category: "Poojas",
    body: [
      {
        paragraphs: [
          "The Satyanarayan Katha is among the most popular household poojas, performed to seek the blessings of Lord Vishnu for prosperity and well-being. It is commonly done on a Purnima (full moon), Ekadashi, or to mark a new beginning or a fulfilled wish.",
        ],
      },
      {
        heading: "How it unfolds",
        paragraphs: [
          "The Pandit begins with a sankalp and Ganesh puja, then the worship of Lord Satyanarayan, followed by the recitation of the five chapters of the katha. It closes with the aarti and distribution of prasad — traditionally a sweet sheera (sapaat).",
        ],
      },
      {
        heading: "What you'll need",
        paragraphs: [
          "A clean space, a low table for the deity, and the samagri — which you can add as a kit at checkout and have delivered to your door. The ceremony usually takes around two hours and has flexible timing, so you can pick any convenient slot.",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
