// Central catalog of poojas offered on BookMyPoojari.
// This is the seed data; later it will be served from the database (Supabase).

export type Pooja = {
  slug: string;
  name: string;
  sanskritName?: string;
  emoji: string;
  category: "Home" | "Festival" | "Life Event" | "Remedial" | "Ancestral";
  shortDescription: string;
  durationHours: number;
  startingPrice: number; // in INR, the dakshina/service starting price
  samagriKitPrice?: number; // optional add-on samagri kit price (INR)
  longDescription?: string;
  includes?: string[];
  popular?: boolean;
};

export const poojas: Pooja[] = [
  {
    slug: "satyanarayan-katha",
    name: "Satyanarayan Katha",
    sanskritName: "सत्यनारायण कथा",
    emoji: "🪔",
    category: "Home",
    shortDescription:
      "Auspicious puja seeking the blessings of Lord Vishnu for prosperity and well-being.",
    durationHours: 2,
    startingPrice: 2100,
    popular: true,
  },
  {
    slug: "griha-pravesh",
    name: "Griha Pravesh",
    sanskritName: "गृह प्रवेश",
    emoji: "🏠",
    category: "Home",
    shortDescription:
      "House-warming ceremony to purify and bless a new home before you move in.",
    durationHours: 3,
    startingPrice: 5100,
    popular: true,
  },
  {
    slug: "ganesh-puja",
    name: "Ganesh Puja",
    sanskritName: "गणेश पूजा",
    emoji: "🐘",
    category: "Festival",
    shortDescription:
      "Invoke Lord Ganesha to remove obstacles before any new beginning or festival.",
    durationHours: 1.5,
    startingPrice: 1500,
    popular: true,
  },
  {
    slug: "lakshmi-puja",
    name: "Lakshmi Puja (Diwali)",
    sanskritName: "लक्ष्मी पूजा",
    emoji: "🌸",
    category: "Festival",
    shortDescription:
      "Diwali puja for wealth, abundance and the blessings of Goddess Lakshmi.",
    durationHours: 2,
    startingPrice: 2500,
    popular: true,
  },
  {
    slug: "namkaran",
    name: "Namkaran (Naming)",
    sanskritName: "नामकरण",
    emoji: "👶",
    category: "Life Event",
    shortDescription:
      "Traditional naming ceremony to welcome and bless a newborn child.",
    durationHours: 2,
    startingPrice: 3100,
  },
  {
    slug: "mundan",
    name: "Mundan Sanskar",
    sanskritName: "मुंडन संस्कार",
    emoji: "✂️",
    category: "Life Event",
    shortDescription:
      "First haircut ceremony performed for the health and long life of a child.",
    durationHours: 1.5,
    startingPrice: 2500,
  },
  {
    slug: "navagraha-shanti",
    name: "Navagraha Shanti",
    sanskritName: "नवग्रह शांति",
    emoji: "🪐",
    category: "Remedial",
    shortDescription:
      "Remedial puja to pacify the nine planets and reduce their malefic effects.",
    durationHours: 3,
    startingPrice: 5100,
  },
  {
    slug: "rudrabhishek",
    name: "Rudrabhishek",
    sanskritName: "रुद्राभिषेक",
    emoji: "🕉️",
    category: "Remedial",
    shortDescription:
      "Powerful abhishek of Lord Shiva for health, peace and removal of negativity.",
    durationHours: 2.5,
    startingPrice: 4100,
  },
  {
    slug: "bhoomi-puja",
    name: "Bhoomi Puja",
    sanskritName: "भूमि पूजा",
    emoji: "🧱",
    category: "Home",
    shortDescription:
      "Ground-breaking ceremony seeking blessings before construction begins.",
    durationHours: 2,
    startingPrice: 3100,
  },
  {
    slug: "satyanarayan-vrat",
    name: "Vahan Puja",
    sanskritName: "वाहन पूजा",
    emoji: "🚗",
    category: "Life Event",
    shortDescription:
      "Blessing ceremony for a new vehicle for safe and auspicious journeys.",
    durationHours: 1,
    startingPrice: 1100,
  },
  {
    slug: "pitru-paksha-shraddh",
    name: "Shraddh / Pitru Paksha",
    sanskritName: "श्राद्ध",
    emoji: "🙏",
    category: "Ancestral",
    shortDescription:
      "Ritual offerings to honour ancestors and seek their blessings and peace.",
    durationHours: 2,
    startingPrice: 2100,
  },
  {
    slug: "vivah-sanskar",
    name: "Vivah (Wedding)",
    sanskritName: "विवाह संस्कार",
    emoji: "💍",
    category: "Life Event",
    shortDescription:
      "Complete Vedic wedding rituals performed by an experienced Pandit.",
    durationHours: 4,
    startingPrice: 11000,
  },
];

export const popularPoojas = poojas.filter((p) => p.popular);

export const poojaCategories = [
  "Home",
  "Festival",
  "Life Event",
  "Remedial",
  "Ancestral",
] as const;

// Languages a Pandit can be requested in.
export const languages = [
  "Hindi",
  "Sanskrit",
  "Marathi",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Kannada",
  "Bengali",
  "Odia",
  "Malayalam",
];

// Default morning/evening slots offered for bookings.
export const timeSlots = [
  "06:00 AM – 08:00 AM",
  "08:00 AM – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "12:00 PM – 02:00 PM",
  "04:00 PM – 06:00 PM",
  "06:00 PM – 08:00 PM",
];

export function getPoojaBySlug(slug: string): Pooja | undefined {
  return poojas.find((p) => p.slug === slug);
}

// What every booking includes, unless a pooja overrides it with its own list.
export function getIncludes(pooja: Pooja): string[] {
  if (pooja.includes && pooja.includes.length > 0) return pooja.includes;
  return [
    "Verified, experienced Pandit at your location",
    "All rituals performed as per Vedic tradition",
    "Pandit speaks your preferred language",
    "Guidance on the muhurat (auspicious time)",
    "Optional authentic samagri kit, delivered to your door",
  ];
}

// The price of the optional samagri kit for a pooja (sensible default).
export function getSamagriKitPrice(pooja: Pooja): number {
  return pooja.samagriKitPrice ?? 751;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
