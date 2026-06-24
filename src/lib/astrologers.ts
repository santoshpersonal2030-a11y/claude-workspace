// Roster of astrologers available for instant "talk now" consultations, billed
// per minute from the customer's wallet. Seed data served from here for now (like
// the pooja and consultation catalogs); per-minute RATES are read server-side from
// this list and never trusted from the client.
//
// Live online/busy/offline status is NOT here — it's mutable and lives in the
// `live_astrologer_status` table (see src/lib/live-status.ts). This file is the
// stable identity + pricing of each astrologer.

export type ConsultChannel = "chat" | "call";

export type Astrologer = {
  slug: string;
  name: string;
  /** Emoji avatar until real photos are uploaded. */
  avatar: string;
  /** Headline specialities, shown as chips. */
  specialities: string[];
  /** Spoken languages (English names). */
  languages: string[];
  experienceYears: number;
  /** Per-minute price in whole INR. */
  perMinuteChat: number;
  perMinuteCall: number;
  rating: number; // 0–5, one decimal
  reviews: number;
  shortBio: string;
  popular?: boolean;
};

export const astrologers: Astrologer[] = [
  {
    slug: "pandit-rajesh-sharma",
    name: "Pandit Rajesh Sharma",
    avatar: "🧘",
    specialities: ["Vedic", "Career", "Marriage"],
    languages: ["Hindi", "English"],
    experienceYears: 18,
    perMinuteChat: 25,
    perMinuteCall: 35,
    rating: 4.9,
    reviews: 2143,
    shortBio:
      "Third-generation Vedic jyotishi specialising in career direction, marriage timing and dosha remedies.",
    popular: true,
  },
  {
    slug: "acharya-meera-iyer",
    name: "Acharya Meera Iyer",
    avatar: "🌙",
    specialities: ["KP System", "Love", "Finance"],
    languages: ["English", "Tamil", "Hindi"],
    experienceYears: 12,
    perMinuteChat: 30,
    perMinuteCall: 40,
    rating: 4.8,
    reviews: 1576,
    shortBio:
      "KP-system astrologer known for crisp, time-bound predictions on relationships and money matters.",
    popular: true,
  },
  {
    slug: "dr-anil-trivedi",
    name: "Dr. Anil Trivedi",
    avatar: "📿",
    specialities: ["Numerology", "Vastu", "Business"],
    languages: ["Hindi", "Gujarati", "English"],
    experienceYears: 25,
    perMinuteChat: 40,
    perMinuteCall: 55,
    rating: 4.9,
    reviews: 3008,
    shortBio:
      "Numerology and Vastu expert who has advised founders and families for over two decades.",
  },
  {
    slug: "jyotishi-kavita-rao",
    name: "Jyotishi Kavita Rao",
    avatar: "✨",
    specialities: ["Tarot", "Love", "Health"],
    languages: ["English", "Kannada", "Hindi"],
    experienceYears: 9,
    perMinuteChat: 20,
    perMinuteCall: 28,
    rating: 4.7,
    reviews: 942,
    shortBio:
      "Compassionate tarot and Vedic reader focused on relationships, emotional wellbeing and clarity.",
  },
  {
    slug: "pandit-suresh-mishra",
    name: "Pandit Suresh Mishra",
    avatar: "🔱",
    specialities: ["Lal Kitab", "Remedies", "Career"],
    languages: ["Hindi", "Bhojpuri"],
    experienceYears: 21,
    perMinuteChat: 22,
    perMinuteCall: 32,
    rating: 4.8,
    reviews: 1820,
    shortBio:
      "Lal Kitab specialist prescribing simple, low-cost upay for stubborn career and family blocks.",
  },
  {
    slug: "acharya-deepa-nair",
    name: "Acharya Deepa Nair",
    avatar: "🪔",
    specialities: ["Prashna", "Muhurat", "Marriage"],
    languages: ["English", "Malayalam", "Hindi"],
    experienceYears: 14,
    perMinuteChat: 28,
    perMinuteCall: 38,
    rating: 4.8,
    reviews: 1267,
    shortBio:
      "Prashna and muhurat expert who answers a single pressing question with a clear, actionable reading.",
  },
];

export function getAstrologer(slug: string): Astrologer | undefined {
  return astrologers.find((a) => a.slug === slug);
}

// Per-minute rate for a given channel, read server-side so the client can never
// pick its own price. Returns null for an unknown astrologer.
export function ratePerMinute(
  slug: string,
  channel: ConsultChannel,
): number | null {
  const a = getAstrologer(slug);
  if (!a) return null;
  return channel === "call" ? a.perMinuteCall : a.perMinuteChat;
}
