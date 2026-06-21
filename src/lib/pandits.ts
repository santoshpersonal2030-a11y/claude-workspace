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
  // Formal qualifications (degrees, gurukul/paathshala, lineage, certs) and
  // notable achievements/awards — showcased on the public profile.
  qualifications: string[];
  achievements: string[];
  // Service area (manual coverage). homePincode = local/no-fee band; every
  // pincode the priest is willing to travel to is listed in servicePincodes
  // (which always includes homePincode). maxTravelMins is an advisory cap.
  homePincode: string | null;
  servicePincodes: string[];
  maxTravelMins: number;
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
    qualifications: [
      "Shastri (Karmakanda), Sampurnanand Sanskrit University, Varanasi",
      "Trained in the Kashi tradition under Pt. Bhavani Shankar",
    ],
    achievements: [
      "Performed 1000+ Satyanarayan Kathas across Delhi NCR",
      "Lead priest for community Maha Rudrabhishek, 2022",
    ],
    homePincode: "110001",
    servicePincodes: ["110001", "110002", "110005"],
    maxTravelMins: 30,
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
    qualifications: [
      "Acharya (Veda-Vedanga), Tilak Maharashtra Vidyapeeth, Pune",
      "Specialist diploma in Vivah & Sanskar vidhi",
    ],
    achievements: [
      "Solemnised 500+ weddings and thread ceremonies",
      "Recognised by local mandals for naming-ceremony guidance",
    ],
    homePincode: "400050",
    servicePincodes: ["400050", "400058", "411001"],
    maxTravelMins: 30,
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
    qualifications: [
      "Ghanapathi — mastery of Krishna Yajurveda recitation",
      "Vedic studies, Sringeri Sharada Peetham tradition",
    ],
    achievements: [
      "Conducted 300+ Ganapathi & Navagraha Homams",
      "Invited ritvik for temple Kumbhabhishekam, 2019 & 2023",
    ],
    homePincode: "560034",
    servicePincodes: ["560034", "560001", "560078"],
    maxTravelMins: 30,
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
    qualifications: [
      "Shastri in Jyotish & Karmakanda, Lucknow",
      "Trained in Pitru-karma and graha-shanti vidhi as per the shastras",
    ],
    achievements: [
      "Performed Pitru Paksha shraddh for 200+ families",
      "Known for precise Rudrabhishek and Navagraha shanti rituals",
    ],
    homePincode: "226001",
    servicePincodes: ["226001", "226010", "208001"],
    maxTravelMins: 30,
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
    qualifications: [
      "Acharya with 30 years in festival poojas and community havans",
      "Veda-paathshala training, Ahmedabad",
    ],
    achievements: [
      "Led large community havans for 500+ attendees",
      "Three decades of disciplined, shastra-aligned practice",
    ],
    homePincode: "380015",
    servicePincodes: ["380015", "380001", "395001"],
    maxTravelMins: 30,
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
    qualifications: [
      "Shastri (Karmakanda), Pune",
      "Fluent ritual explanation in Hindi, Sanskrit & English",
    ],
    achievements: [
      "Popular for family-friendly home poojas and Satyanarayan Katha",
      "Consistently 4.8★ across 140+ reviews",
    ],
    homePincode: "411004",
    servicePincodes: ["411004", "411001", "411038"],
    maxTravelMins: 30,
    rating: 4.8,
    reviewCount: 142,
    photoUrl: null,
    verified: true,
  },
];

export function getPanditBySlug(slug: string): Pandit | undefined {
  return pandits.find((p) => p.slug === slug);
}
