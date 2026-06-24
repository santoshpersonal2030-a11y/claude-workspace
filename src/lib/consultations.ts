// Catalog of paid 1:1 consultations offered on BookMyPoojari. Seed data (served
// from here for now, like the pooja catalog); pricing is read server-side from
// this list, never trusted from the client. Delivered over phone or video by a
// verified astrologer/pandit, assigned by an admin after booking.

export type ConsultationMode = "phone" | "video";

export type Consultation = {
  slug: string;
  name: string;
  sanskritName?: string;
  emoji: string;
  shortDescription: string;
  longDescription?: string;
  durationMins: number;
  price: number; // INR
  // Astrology consults need the seeker's birth details; muhurat/vastu don't.
  needsBirthDetails: boolean;
  includes?: string[];
  popular?: boolean;
};

export const consultations: Consultation[] = [
  {
    slug: "kundli-reading",
    name: "Kundli & Horoscope Reading",
    sanskritName: "कुण्डली विश्लेषण",
    emoji: "📜",
    shortDescription:
      "A detailed birth-chart analysis covering career, health, relationships and the year ahead.",
    longDescription:
      "An experienced jyotishi reads your janam kundli in depth — planetary positions, dashas and key yogas — and answers your specific questions with practical, compassionate guidance.",
    durationMins: 45,
    price: 1100,
    needsBirthDetails: true,
    includes: [
      "Full birth-chart (kundli) analysis",
      "Career, finance, health & relationship outlook",
      "Current & upcoming dasha guidance",
      "Q&A on your specific concerns",
    ],
    popular: true,
  },
  {
    slug: "muhurat-consultation",
    name: "Muhurat Selection",
    sanskritName: "मुहूर्त निर्णय",
    emoji: "🗓️",
    shortDescription:
      "Find the most auspicious date and time for your ceremony, travel or new beginning.",
    longDescription:
      "Share your event and preferred window; the astrologer computes the shubh muhurat using panchang, tithi, nakshatra and choghadiya, and explains the reasoning.",
    durationMins: 30,
    price: 751,
    needsBirthDetails: false,
    includes: [
      "Auspicious date & time recommendation",
      "Panchang reasoning (tithi, nakshatra, yoga)",
      "Alternatives if your preferred window is inauspicious",
    ],
    popular: true,
  },
  {
    slug: "gun-milan",
    name: "Kundli Matching (Gun Milan)",
    sanskritName: "गुण मिलान",
    emoji: "💑",
    shortDescription:
      "Compatibility analysis for marriage — ashtakoota guna score with remedies for doshas.",
    longDescription:
      "A thorough match of two horoscopes: the 36-guna ashtakoota score, mangal-dosha check, and practical remedies where needed — guidance for families considering a match.",
    durationMins: 45,
    price: 1500,
    needsBirthDetails: true,
    includes: [
      "36-guna ashtakoota compatibility score",
      "Mangal / Nadi dosha assessment",
      "Remedies and guidance",
    ],
  },
  {
    slug: "vastu-consultation",
    name: "Vastu Consultation",
    sanskritName: "वास्तु परामर्श",
    emoji: "🏠",
    shortDescription:
      "Align your home or workplace with Vastu Shastra for harmony and prosperity.",
    longDescription:
      "Walk through your floor plan with a Vastu expert to identify doshas in direction, layout and placement, with low-disruption corrective remedies.",
    durationMins: 60,
    price: 2100,
    needsBirthDetails: false,
    includes: [
      "Direction & layout review",
      "Room-by-room placement guidance",
      "Practical, low-cost remedies",
    ],
  },
  {
    slug: "remedies-consultation",
    name: "Remedies & Upay Guidance",
    sanskritName: "उपाय परामर्श",
    emoji: "🔱",
    shortDescription:
      "Targeted remedies — mantras, gemstones, daan and poojas — for a specific concern.",
    longDescription:
      "Bring a specific challenge (career block, health, delays in marriage). The astrologer identifies the planetary cause and prescribes scripturally-grounded upay.",
    durationMins: 30,
    price: 851,
    needsBirthDetails: true,
    includes: [
      "Root-cause analysis from your chart",
      "Mantra / gemstone / daan recommendations",
      "Suggested remedial poojas",
    ],
  },
];

export function getConsultation(slug: string): Consultation | undefined {
  return consultations.find((c) => c.slug === slug);
}
