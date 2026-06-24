// Catalog of Temple e-Pujas / Chadhava — a remote puja performed at a famous
// temple in the devotee's name and gotra, with a video shared back and
// (optionally) tirth prasad delivered home. Seed data, like the pooja catalog;
// pricing is read server-side from here, never trusted from the client.

export type TemplePuja = {
  slug: string;
  name: string; // the puja / seva name
  temple: string; // temple + location
  deity: string;
  emoji: string;
  category: "Jyotirlinga" | "Shaktipeeth" | "Dosh Nivaran" | "Prosperity" | "Blessings";
  shortDescription: string;
  longDescription?: string;
  price: number; // INR
  includesPrasad: boolean;
  includes?: string[];
  popular?: boolean;
};

export const templePujas: TemplePuja[] = [
  {
    slug: "kashi-rudrabhishek",
    name: "Rudrabhishek",
    temple: "Kashi Vishwanath, Varanasi",
    deity: "Lord Shiva",
    emoji: "🕉️",
    category: "Jyotirlinga",
    shortDescription:
      "Rudrabhishek at the Kashi Vishwanath Jyotirlinga in your name and gotra, for health and removal of obstacles.",
    longDescription:
      "Our temple purohit performs the Rudrabhishek with milk, honey and bilva patra at the sacred Kashi Vishwanath Jyotirlinga, taking your sankalp (name and gotra). You receive a video of the ritual and tirth prasad at home.",
    price: 1100,
    includesPrasad: true,
    includes: [
      "Sankalp in your name & gotra",
      "Rudrabhishek by a temple purohit",
      "Video of the ritual",
      "Tirth prasad delivered home",
    ],
    popular: true,
  },
  {
    slug: "mahakaleshwar-bhasma-seva",
    name: "Bhasma Aarti Seva",
    temple: "Mahakaleshwar, Ujjain",
    deity: "Lord Mahakal",
    emoji: "🔱",
    category: "Jyotirlinga",
    shortDescription:
      "Participate in the famed Bhasma Aarti at Mahakaleshwar through a seva offered in your name.",
    price: 1500,
    includesPrasad: true,
    includes: [
      "Sankalp in your name & gotra",
      "Seva at the Bhasma Aarti",
      "Video of the aarti",
      "Tirth prasad delivered home",
    ],
    popular: true,
  },
  {
    slug: "trimbakeshwar-kaalsarp",
    name: "Kaal Sarp Dosh Nivaran",
    temple: "Trimbakeshwar, Nashik",
    deity: "Lord Shiva",
    emoji: "🐍",
    category: "Dosh Nivaran",
    shortDescription:
      "The classical Kaal Sarp Dosh Nivaran pooja at Trimbakeshwar, the prescribed kshetra for this remedy.",
    price: 2100,
    includesPrasad: true,
    includes: [
      "Sankalp in your name & gotra",
      "Kaal Sarp Shanti vidhi by temple pandits",
      "Video of the pooja",
      "Prasad delivered home",
    ],
  },
  {
    slug: "mangalnath-mangal-dosh",
    name: "Mangal Dosh (Bhaat Pooja)",
    temple: "Mangalnath, Ujjain",
    deity: "Mangal Dev",
    emoji: "🔴",
    category: "Dosh Nivaran",
    shortDescription:
      "Mangal Dosh Nivaran at Mangalnath, the birthplace of Mars, for relief in marriage and property matters.",
    price: 1800,
    includesPrasad: true,
    includes: [
      "Sankalp in your name & gotra",
      "Mangal Bhaat pooja",
      "Video of the pooja",
      "Prasad delivered home",
    ],
  },
  {
    slug: "tirupati-archana",
    name: "Archana Seva",
    temple: "Tirumala Tirupati, Andhra Pradesh",
    deity: "Lord Venkateswara",
    emoji: "🙏",
    category: "Blessings",
    shortDescription:
      "An Archana offered to Lord Venkateswara at Tirumala in your name, for prosperity and well-being.",
    price: 951,
    includesPrasad: true,
    includes: [
      "Sankalp in your name & gotra",
      "Archana to Lord Venkateswara",
      "Video / confirmation",
      "Laddu prasadam delivered home",
    ],
    popular: true,
  },
  {
    slug: "mahalakshmi-shree-suktam",
    name: "Shree Suktam Lakshmi Pooja",
    temple: "Mahalakshmi, Kolhapur",
    deity: "Goddess Mahalakshmi",
    emoji: "🪔",
    category: "Prosperity",
    shortDescription:
      "Shree Suktam abhishek and pooja to Goddess Mahalakshmi for wealth, abundance and family prosperity.",
    price: 1251,
    includesPrasad: true,
    includes: [
      "Sankalp in your name & gotra",
      "Shree Suktam abhishek & pooja",
      "Video of the pooja",
      "Prasad delivered home",
    ],
  },
  {
    slug: "kamakhya-shakti-pooja",
    name: "Shakti Pooja",
    temple: "Kamakhya Devi, Guwahati",
    deity: "Goddess Kamakhya",
    emoji: "🌺",
    category: "Shaktipeeth",
    shortDescription:
      "A pooja at the Kamakhya Shaktipeeth invoking the Devi's blessings for fulfilment of wishes.",
    price: 1600,
    includesPrasad: true,
    includes: [
      "Sankalp in your name & gotra",
      "Devi pooja at the Shaktipeeth",
      "Video of the pooja",
      "Prasad delivered home",
    ],
  },
  {
    slug: "shani-shingnapur-taila-abhishek",
    name: "Shani Taila Abhishek",
    temple: "Shani Shingnapur, Maharashtra",
    deity: "Lord Shani",
    emoji: "🪐",
    category: "Dosh Nivaran",
    shortDescription:
      "Oil abhishek to Lord Shani at Shingnapur to ease the effects of Shani's dasha and sade-sati.",
    price: 851,
    includesPrasad: false,
    includes: [
      "Sankalp in your name & gotra",
      "Taila (oil) abhishek to Shani Dev",
      "Video of the abhishek",
    ],
  },
];

export function getTemplePuja(slug: string): TemplePuja | undefined {
  return templePujas.find((p) => p.slug === slug);
}
