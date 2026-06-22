// Curated "ceremony families" that group the pooja catalog into the collections
// families look for: the child sanskars, the wedding journey, the antim sanskar,
// grah-shanti remedies, vastu/new-beginnings and katha/path/havan. Marriage is a
// bundled package. Each family references poojas by slug so the data still comes
// from the catalog (DB with seed fallback).

export type LifeEventSlug =
  | "birth"
  | "marriage"
  | "death"
  | "grah-shanti"
  | "vastu"
  | "katha";

export type LifeEvent = {
  slug: LifeEventSlug;
  title: string;
  sanskrit: string;
  emoji: string;
  tagline: string;
  description: string;
  // Ordered ceremony pooja slugs that make up this family.
  poojaSlugs: string[];
  // Marriage is offered as a bundled package of its ceremonies.
  isPackage?: boolean;
  packageName?: string;
  packageNote?: string;
};

export const lifeEvents: LifeEvent[] = [
  {
    slug: "birth",
    title: "Birth & Child Sanskars",
    sanskrit: "जन्म संस्कार",
    emoji: "👶",
    tagline: "Every sacrament from the womb to the sacred thread",
    description:
      "The classical child sanskars in order — the baby shower, the birth and naming rites, the cradle ceremony, first grains, ear-piercing, first haircut, the start of learning and the sacred thread — each performed by verified Pandits who guide your family through every step.",
    poojaSlugs: [
      "godh-bharai",
      "jatakarma",
      "namkaran",
      "nishkramana",
      "annaprashan",
      "karnavedha",
      "mundan",
      "vidyarambha",
      "upanayana",
    ],
  },
  {
    slug: "marriage",
    title: "Marriage Package",
    sanskrit: "विवाह संस्कार",
    emoji: "💍",
    tagline: "Haldi, engagement & wedding — one trusted team",
    description:
      "Book the complete wedding journey — the joyful Haldi, the engagement (Sagai/Roka) and the Vedic Vivah — performed by experienced Pandits who stay with your family through every ritual.",
    poojaSlugs: ["haldi-ceremony", "sagai-engagement", "vivah-sanskar"],
    isPackage: true,
    packageName: "Complete Wedding Package",
    packageNote:
      "Book each ceremony together and the same trusted Pandit team guides your whole celebration. Auspicious muhurats confirmed for the engagement and wedding.",
  },
  {
    slug: "death",
    title: "Death & Antim Sanskar",
    sanskrit: "अन्त्येष्टि",
    emoji: "🪷",
    tagline: "Performed with dignity and compassion",
    description:
      "In difficult times, our Pandits perform the last rites and ancestral rituals — antyeshti, shraddh, tarpan and pind daan — strictly as per Vedic tradition, with respect, care and clear guidance for the family.",
    poojaSlugs: ["antyeshti", "pitru-paksha-shraddh", "tarpan", "pind-daan"],
  },
  {
    slug: "grah-shanti",
    title: "Grah Shanti & Remedies",
    sanskrit: "ग्रह शांति",
    emoji: "🪐",
    tagline: "Pacify the planets, lift the doshas",
    description:
      "Remedial rites for planetary and ancestral doshas — Navagraha Shanti, Kaal Sarp, Manglik (Mangal) and Shani Shanti, Pitru Dosh, the Maha Mrityunjaya homa and Rudrabhishek — performed as prescribed for relief and progress.",
    poojaSlugs: [
      "navagraha-shanti",
      "kaal-sarp-shanti",
      "mangal-dosh-shanti",
      "shani-shanti",
      "pitru-dosh-shanti",
      "mahamrityunjaya-homa",
      "rudrabhishek",
    ],
  },
  {
    slug: "vastu",
    title: "Vastu & New Beginnings",
    sanskrit: "वास्तु एवं शुभारंभ",
    emoji: "🧭",
    tagline: "Bless a new home, site, shop or vehicle",
    description:
      "Auspicious rites for fresh starts — Bhoomi Puja before construction, Griha Pravesh for a new home, Vastu Shanti to harmonise a space, the Ganapati Homa for a clean beginning and Vahan Puja for a new vehicle.",
    poojaSlugs: [
      "bhoomi-puja",
      "griha-pravesh",
      "vastu-shanti",
      "ganapati-homa",
      "vahan-puja",
    ],
  },
  {
    slug: "katha",
    title: "Katha, Path & Havan",
    sanskrit: "कथा एवं पाठ",
    emoji: "📿",
    tagline: "Recitations and fire rituals for the home",
    description:
      "Devotional recitations and homas — the Satyanarayan Katha, Sundarkand and Hanuman Chalisa, the Bhagwat Katha, Durga Saptashati and the Chandi Homa — to invite blessings, peace and prosperity into your home.",
    poojaSlugs: [
      "satyanarayan-katha",
      "sundarkand-path",
      "hanuman-chalisa-path",
      "bhagwat-katha",
      "durga-saptashati-path",
      "chandi-homa",
    ],
  },
];

export function getLifeEvent(slug: string): LifeEvent | undefined {
  return lifeEvents.find((e) => e.slug === slug);
}
