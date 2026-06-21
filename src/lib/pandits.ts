// Seed data for the verified Pandits/Poojaris available for booking.
// Like the pooja catalog, this is mirrored in the Supabase `pandits` table and
// used as a build-time / offline fallback by src/lib/queries.ts.

import type { PoojaCategory } from "@/lib/poojas";

export type Pandit = {
  slug: string;
  fullName: string;
  bio: string;
  experienceYears: number;
  languages: string[];
  regions: string[];
  // Pooja categories this priest performs — the primary "right pandit for this
  // pooja" matcher. Empty means generalist / not yet specified.
  specializations: PoojaCategory[];
  rating: number;
  reviewCount: number;
  photoUrl: string | null;
  verified: boolean;
};

export const pandits: Pandit[] = [
  {
    slug: "ramesh-sharma",
    fullName: "Pandit Ramesh Sharma",
    bio: "Trained in the Kashi (Varanasi) tradition, Pandit Ramesh ji specialises in Satyanarayan Katha, Griha Pravesh and Vedic havans, performed with precise mantra-uchcharan.",
    experienceYears: 22,
    languages: ["Hindi", "Sanskrit", "Bhojpuri"],
    regions: ["Delhi NCR"],
    specializations: ["Home", "Festival"],
    rating: 4.9,
    reviewCount: 312,
    photoUrl: null,
    verified: true,
  },
  {
    slug: "suresh-joshi",
    fullName: "Acharya Suresh Joshi",
    bio: "An Acharya from Nashik well-versed in life-event ceremonies — weddings, naming and thread ceremonies — guiding families warmly through every ritual.",
    experienceYears: 18,
    languages: ["Hindi", "Sanskrit", "Marathi"],
    regions: ["Mumbai", "Pune"],
    specializations: ["Life Event", "Home"],
    rating: 4.8,
    reviewCount: 256,
    photoUrl: null,
    verified: true,
  },
  {
    slug: "krishna-iyer",
    fullName: "Pandit Krishna Iyer",
    bio: "A South-Indian Vedic scholar specialising in Ganapathi Homam, Navagraha shanti and traditional Iyer-sampradaya rituals, with clear English explanations.",
    experienceYears: 25,
    languages: ["Tamil", "Sanskrit", "English"],
    regions: ["Bengaluru", "Chennai"],
    specializations: ["Festival", "Remedial", "Home"],
    rating: 4.9,
    reviewCount: 401,
    photoUrl: null,
    verified: true,
  },
  {
    slug: "vasudev-mishra",
    fullName: "Pandit Vasudev Mishra",
    bio: "Known for remedial and ancestral rituals — Pitru Paksha shraddh, Rudrabhishek and graha-shanti poojas — performed strictly as per the shastras.",
    experienceYears: 15,
    languages: ["Hindi", "Sanskrit"],
    regions: ["Lucknow", "Kanpur"],
    specializations: ["Remedial", "Ancestral"],
    rating: 4.7,
    reviewCount: 188,
    photoUrl: null,
    verified: true,
  },
  {
    slug: "narayan-bhatt",
    fullName: "Acharya Narayan Bhatt",
    bio: "A senior Acharya with three decades of experience in festival poojas and large community havans, blending devotion with impeccable discipline.",
    experienceYears: 30,
    languages: ["Gujarati", "Hindi", "Sanskrit"],
    regions: ["Ahmedabad", "Surat"],
    specializations: ["Festival", "Home"],
    rating: 4.9,
    reviewCount: 357,
    photoUrl: null,
    verified: true,
  },
  {
    slug: "devdutt-tripathi",
    fullName: "Pandit Devdutt Tripathi",
    bio: "A young, personable priest popular for home poojas and Satyanarayan Katha, patiently explaining the meaning behind each step for the whole family.",
    experienceYears: 12,
    languages: ["Hindi", "Sanskrit", "English"],
    regions: ["Pune", "Mumbai"],
    specializations: ["Home"],
    rating: 4.8,
    reviewCount: 142,
    photoUrl: null,
    verified: true,
  },
];

export function getPanditBySlug(slug: string): Pandit | undefined {
  return pandits.find((p) => p.slug === slug);
}
