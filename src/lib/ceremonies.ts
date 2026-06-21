// Life-event "ceremony sections" that curate the pooja catalog into the major
// sanskars families look for: Birth, Marriage and Death (Antim Sanskar).
// Marriage is presented as a package (Haldi → Engagement → Wedding). Each
// section references poojas by slug so the actual data still comes from the
// catalog (DB with seed fallback).

export type LifeEventSlug = "birth" | "marriage" | "death";

export type LifeEvent = {
  slug: LifeEventSlug;
  title: string;
  sanskrit: string;
  emoji: string;
  tagline: string;
  description: string;
  // Ordered ceremony pooja slugs that make up this life event.
  poojaSlugs: string[];
  // Marriage is offered as a bundled package of its ceremonies.
  isPackage?: boolean;
  packageName?: string;
  packageNote?: string;
};

export const lifeEvents: LifeEvent[] = [
  {
    slug: "birth",
    title: "Birth & Child Ceremonies",
    sanskrit: "जन्म संस्कार",
    emoji: "👶",
    tagline: "Welcome and bless your little one",
    description:
      "From naming to the first grains and the first haircut, our verified Pandits perform each child sanskar with warmth, guiding your family through every step.",
    poojaSlugs: ["namkaran", "annaprashan", "mundan"],
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
      "In difficult times, our Pandits perform the last rites and ancestral shraddh strictly as per Vedic tradition — with respect, care and clear guidance for the family.",
    poojaSlugs: ["antyeshti", "pitru-paksha-shraddh"],
  },
];

export function getLifeEvent(slug: string): LifeEvent | undefined {
  return lifeEvents.find((e) => e.slug === slug);
}
