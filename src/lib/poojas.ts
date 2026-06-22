// Central catalog of poojas offered on BookMyPoojari.
// This is the seed data; later it will be served from the database (Supabase).

export type PoojaCategory =
  | "Home"
  | "Festival"
  | "Life Event"
  | "Remedial"
  | "Ancestral";

// The ritual FORM (a second axis, orthogonal to the occasion-based category):
// the kind of rite being performed, for richer browsing/filtering.
//   Sanskar  — life-cycle sacrament (the 16 samskaras)
//   Pooja    — deity worship / ceremony
//   Havan    — fire ritual (homa / havan)
//   Shanti   — remedial / dosh-nivaran rite
//   Katha    — recitation / path / vrat-katha
//   Abhishek — ceremonial bathing of a deity
//   Shraddh  — ancestral rite (tarpan / pind-daan / shraddh)
export type RitualType =
  | "Sanskar"
  | "Pooja"
  | "Havan"
  | "Shanti"
  | "Katha"
  | "Abhishek"
  | "Shraddh";

export type Pooja = {
  slug: string;
  name: string;
  sanskritName?: string;
  emoji: string;
  category: PoojaCategory;
  ritualType: RitualType;
  shortDescription: string;
  durationHours: number;
  startingPrice: number; // in INR, the dakshina/service starting price
  samagriKitPrice?: number; // optional add-on samagri kit price (INR)
  longDescription?: string;
  includes?: string[];
  popular?: boolean;
  // True when the ceremony needs an auspicious muhurat (timing confirmed by the
  // priest); false/undefined means flexible timing the customer can freely pick.
  requiresMuhurat?: boolean;
};

export const poojas: Pooja[] = [
  // ── Home & deity poojas ───────────────────────────────────────────────────
  {
    slug: "satyanarayan-katha",
    name: "Satyanarayan Katha",
    sanskritName: "सत्यनारायण कथा",
    emoji: "🪔",
    category: "Home",
    ritualType: "Katha",
    shortDescription:
      "Auspicious puja seeking the blessings of Lord Vishnu for prosperity and well-being.",
    durationHours: 2,
    startingPrice: 2100,
    requiresMuhurat: false,
    popular: true,
  },
  {
    slug: "griha-pravesh",
    name: "Griha Pravesh",
    sanskritName: "गृह प्रवेश",
    emoji: "🏠",
    category: "Home",
    ritualType: "Pooja",
    shortDescription:
      "House-warming ceremony to purify and bless a new home before you move in.",
    durationHours: 3,
    startingPrice: 5100,
    requiresMuhurat: true,
    popular: true,
  },
  {
    slug: "ganesh-puja",
    name: "Ganesh Puja",
    sanskritName: "गणेश पूजा",
    emoji: "🐘",
    category: "Festival",
    ritualType: "Pooja",
    shortDescription:
      "Invoke Lord Ganesha to remove obstacles before any new beginning or festival.",
    durationHours: 1.5,
    startingPrice: 1500,
    requiresMuhurat: false,
    popular: true,
  },
  {
    slug: "lakshmi-puja",
    name: "Lakshmi Puja (Diwali)",
    sanskritName: "लक्ष्मी पूजा",
    emoji: "🌸",
    category: "Festival",
    ritualType: "Pooja",
    shortDescription:
      "Diwali puja for wealth, abundance and the blessings of Goddess Lakshmi.",
    durationHours: 2,
    startingPrice: 2500,
    requiresMuhurat: true,
    popular: true,
  },
  {
    slug: "saraswati-puja",
    name: "Saraswati Puja",
    sanskritName: "सरस्वती पूजा",
    emoji: "📖",
    category: "Festival",
    ritualType: "Pooja",
    shortDescription:
      "Vasant Panchami worship of Goddess Saraswati for learning, music and wisdom.",
    durationHours: 1.5,
    startingPrice: 2100,
    longDescription:
      "Worship of Goddess Saraswati, the giver of knowledge, speech and the arts — performed on Vasant Panchami, before exams or new studies, or alongside a child's Vidyarambha. The Pandit invokes the goddess for clarity of mind and success in learning and creative pursuits.",
    includes: [
      "Kalash sthapana and Saraswati avahan",
      "Recitation of Saraswati Vandana and stotra",
      "Offering of books, pen and instruments for blessing",
      "Aarti and prasad distribution",
      "Verified Pandit in your preferred language",
    ],
    requiresMuhurat: false,
  },
  {
    slug: "durga-puja",
    name: "Durga Puja (Navratri)",
    sanskritName: "दुर्गा पूजा",
    emoji: "🔱",
    category: "Festival",
    ritualType: "Pooja",
    shortDescription:
      "Navratri worship of Goddess Durga for strength, protection and victory over evil.",
    durationHours: 2,
    startingPrice: 3100,
    longDescription:
      "Navratri worship of Goddess Durga in her nine forms, invoking Shakti for strength, protection and victory over difficulties. Performed with Durga Saptashati recitation and a sankalp for the family's well-being.",
    includes: [
      "Ghatasthapana / Kalash sthapana",
      "Durga avahan and shodashopachar puja",
      "Selected paath from the Durga Saptashati",
      "Aarti, kanya-bhoj guidance and prasad",
      "Verified Pandit with each vidhi explained",
    ],
    requiresMuhurat: false,
  },
  {
    slug: "janmashtami-puja",
    name: "Janmashtami Puja",
    sanskritName: "जन्माष्टमी पूजा",
    emoji: "🦚",
    category: "Festival",
    ritualType: "Pooja",
    shortDescription:
      "Midnight worship of Lord Krishna on Janmashtami for joy, devotion and protection.",
    durationHours: 2,
    startingPrice: 2500,
    longDescription:
      "Midnight celebration of the birth of Lord Krishna with abhishek of the laddu Gopal, jhula and bhajan. The Pandit guides the vrat and the auspicious madhyaratri puja for joy, devotion and protection of the home.",
    includes: [
      "Bal Gopal abhishek and shringar",
      "Midnight (madhyaratri) Krishna janma puja",
      "Bhajan, jhula and aarti",
      "Vrat sankalp and paran guidance",
      "Verified Pandit and prasad",
    ],
    requiresMuhurat: false,
  },
  {
    slug: "vishwakarma-puja",
    name: "Vishwakarma Puja",
    sanskritName: "विश्वकर्मा पूजा",
    emoji: "🛠️",
    category: "Festival",
    ritualType: "Pooja",
    shortDescription:
      "Worship of Lord Vishwakarma for tools, machinery and the workplace.",
    durationHours: 1.5,
    startingPrice: 2100,
    longDescription:
      "Worship of Lord Vishwakarma, the divine architect, to bless tools, machinery, vehicles and the workplace for safety and productivity. Commonly performed at factories, workshops and offices.",
    includes: [
      "Vishwakarma avahan and puja",
      "Blessing of tools, machines and instruments",
      "Hawan / aarti for the workplace",
      "Sankalp for safety and prosperity",
      "Verified Pandit at your premises",
    ],
    requiresMuhurat: false,
  },
  {
    slug: "hanuman-chalisa-path",
    name: "Hanuman Chalisa Path",
    sanskritName: "हनुमान चालीसा",
    emoji: "🛕",
    category: "Home",
    ritualType: "Katha",
    shortDescription:
      "Recitation of the Hanuman Chalisa for courage, protection and removal of fear.",
    durationHours: 1,
    startingPrice: 1500,
    longDescription:
      "A recitation of the Hanuman Chalisa, often in multiples (11, 21 or 108 paath), invoking Lord Hanuman for courage, protection and relief from fear and obstacles. Ideal on Tuesdays, Saturdays or during a difficult phase.",
    includes: [
      "Sankalp and Hanuman avahan",
      "Hanuman Chalisa paath (count as requested)",
      "Offering of sindoor, chola and bundi",
      "Aarti and prasad",
      "Verified Pandit in your language",
    ],
    requiresMuhurat: false,
  },
  {
    slug: "sundarkand-path",
    name: "Sundarkand Path",
    sanskritName: "सुंदरकांड",
    emoji: "📜",
    category: "Home",
    ritualType: "Katha",
    shortDescription:
      "Recitation of the Sundarkand for protection, success and the grace of Lord Hanuman.",
    durationHours: 2.5,
    startingPrice: 3100,
    longDescription:
      "A complete recitation of the Sundarkand from the Ramcharitmanas — the most auspicious section for success, protection and removal of obstacles — performed with melodious paath and an aarti for the family's well-being.",
    includes: [
      "Ganesh and Hanuman puja sankalp",
      "Full Sundarkand paath with bhajan",
      "Hanuman aarti and chola offering",
      "Prasad and family blessings",
      "Verified Pandit; about 2.5 hours",
    ],
    requiresMuhurat: false,
  },
  {
    slug: "bhagwat-katha",
    name: "Bhagwat Katha",
    sanskritName: "भागवत कथा",
    emoji: "📿",
    category: "Home",
    ritualType: "Katha",
    shortDescription:
      "Discourse and recitation from the Shrimad Bhagwat for devotion and family blessings.",
    durationHours: 4,
    startingPrice: 11000,
    longDescription:
      "A discourse and recitation from the Shrimad Bhagwat Mahapuran — arranged as a single sabha or a multi-day saptah — narrating the leelas of Lord Krishna for devotion, peace and family blessings. Scope and days are tailored to your plan.",
    includes: [
      "Vyas-peeth sthapana and sankalp",
      "Katha vachan from the Shrimad Bhagwat",
      "Daily aarti and bhajan",
      "Guidance on bhog and poornahuti",
      "Experienced Katha-vachak Pandit",
    ],
    requiresMuhurat: false,
  },
  {
    slug: "bhoomi-puja",
    name: "Bhoomi Puja",
    sanskritName: "भूमि पूजा",
    emoji: "🧱",
    category: "Home",
    ritualType: "Pooja",
    shortDescription:
      "Ground-breaking ceremony seeking blessings before construction begins.",
    durationHours: 2,
    startingPrice: 3100,
    requiresMuhurat: true,
  },
  {
    slug: "vahan-puja",
    name: "Vahan Puja",
    sanskritName: "वाहन पूजा",
    emoji: "🚗",
    category: "Home",
    ritualType: "Pooja",
    shortDescription:
      "Blessing ceremony for a new vehicle for safe and auspicious journeys.",
    durationHours: 1,
    startingPrice: 1100,
    requiresMuhurat: false,
  },
  {
    slug: "vastu-shanti",
    name: "Vastu Shanti",
    sanskritName: "वास्तु शांति",
    emoji: "🧭",
    category: "Home",
    ritualType: "Shanti",
    shortDescription:
      "Rite to harmonise a home or workplace and remove vastu dosha before occupying it.",
    durationHours: 2.5,
    startingPrice: 4100,
    longDescription:
      "A rite to harmonise the energies of a home, office or plot and pacify vastu dosha before you occupy it or after alterations. Includes a vastu-purush puja and havan invoking the directional deities for peace and prosperity.",
    includes: [
      "Vastu-purush mandala puja",
      "Navagraha and dik-pala invocation",
      "Vastu shanti havan",
      "Sankalp for peace and prosperity in the space",
      "Verified Pandit; samagri guidance",
    ],
    requiresMuhurat: true,
  },

  // ── Havans / Homas ──────────────────────────────────────────────────────────
  {
    slug: "ganapati-homa",
    name: "Ganapati Homa",
    sanskritName: "गणपति होम",
    emoji: "🔥",
    category: "Home",
    ritualType: "Havan",
    shortDescription:
      "Fire ritual to Lord Ganesha to clear obstacles before any auspicious undertaking.",
    durationHours: 2,
    startingPrice: 3100,
    longDescription:
      "A fire ritual to Lord Ganesha, performed before any auspicious undertaking to clear obstacles and invite success — often at the start of a new venture, home or ceremony.",
    includes: [
      "Ganapati avahan and shodashopachar puja",
      "Ganapati homa with modak offering",
      "Sankalp for the intended purpose",
      "Poornahuti and aarti",
      "Verified Pandit; havan-kund setup guidance",
    ],
    requiresMuhurat: false,
  },
  {
    slug: "mahamrityunjaya-homa",
    name: "Maha Mrityunjaya Homa",
    sanskritName: "महामृत्युंजय होम",
    emoji: "🔥",
    category: "Remedial",
    ritualType: "Havan",
    shortDescription:
      "Powerful homa to Lord Shiva for health, longevity and protection from illness.",
    durationHours: 3,
    startingPrice: 6100,
    longDescription:
      "A powerful homa centred on the Maha Mrityunjaya mantra to Lord Shiva, performed for recovery from illness, longevity and protection from untimely danger. The jaap count (e.g. 1.25 lakh) is set per the sankalp.",
    includes: [
      "Kalash sthapana and Shiva avahan",
      "Maha Mrityunjaya mantra jaap (count per sankalp)",
      "Mrityunjaya homa and poornahuti",
      "Sankalp in the patient's name and nakshatra",
      "Verified Pandit; about 3 hours",
    ],
    requiresMuhurat: true,
  },
  {
    slug: "chandi-homa",
    name: "Chandi Homa",
    sanskritName: "चण्डी होम",
    emoji: "🔥",
    category: "Remedial",
    ritualType: "Havan",
    shortDescription:
      "Durga Saptashati fire ritual for protection, removal of enemies and great obstacles.",
    durationHours: 4,
    startingPrice: 11000,
    longDescription:
      "A major homa based on the Durga Saptashati (Chandi Path), invoking Goddess Chandi for protection, removal of enemies and relief from severe obstacles. A grand rite often performed over several hours with multiple ritviks.",
    includes: [
      "Kalash sthapana and Devi avahan",
      "Durga Saptashati paath",
      "Chandi homa and poornahuti",
      "Kanya-puja and aarti",
      "Experienced Pandit team; samagri guidance",
    ],
    requiresMuhurat: true,
  },
  {
    slug: "ayushya-homa",
    name: "Ayushya Homa",
    sanskritName: "आयुष्य होम",
    emoji: "🔥",
    category: "Life Event",
    ritualType: "Havan",
    shortDescription:
      "Birthday longevity homa for the health and long life of a child or adult.",
    durationHours: 2,
    startingPrice: 3100,
    longDescription:
      "A longevity fire ritual performed on a birthday (especially a child's), invoking the deities of long life and health. A joyful rite seeking a long, healthy and prosperous life for the celebrant.",
    includes: [
      "Ayushya sukta and Markandeya invocation",
      "Ayushya homa with ghee offerings",
      "Sankalp in the celebrant's name and nakshatra",
      "Blessing and aarti",
      "Verified Pandit at your home",
    ],
    requiresMuhurat: false,
  },
  {
    slug: "dhanvantari-homa",
    name: "Dhanvantari Homa",
    sanskritName: "धन्वंतरि होम",
    emoji: "🔥",
    category: "Remedial",
    ritualType: "Havan",
    shortDescription:
      "Fire ritual to Lord Dhanvantari for recovery from illness and good health.",
    durationHours: 2.5,
    startingPrice: 4100,
    longDescription:
      "A fire ritual to Lord Dhanvantari, the deity of healing and Ayurveda, performed for recovery from illness and lasting good health. Recommended during prolonged sickness or for the family's well-being.",
    includes: [
      "Dhanvantari avahan and puja",
      "Dhanvantari homa with herbal offerings",
      "Sankalp for the patient's recovery",
      "Poornahuti and prasad",
      "Verified Pandit; samagri guidance",
    ],
    requiresMuhurat: false,
  },

  // ── Remedial / Shanti ────────────────────────────────────────────────────────
  {
    slug: "navagraha-shanti",
    name: "Navagraha Shanti",
    sanskritName: "नवग्रह शांति",
    emoji: "🪐",
    category: "Remedial",
    ritualType: "Shanti",
    shortDescription:
      "Remedial puja to pacify the nine planets and reduce their malefic effects.",
    durationHours: 3,
    startingPrice: 5100,
    requiresMuhurat: true,
  },
  {
    slug: "rudrabhishek",
    name: "Rudrabhishek",
    sanskritName: "रुद्राभिषेक",
    emoji: "🕉️",
    category: "Remedial",
    ritualType: "Abhishek",
    shortDescription:
      "Powerful abhishek of Lord Shiva for health, peace and removal of negativity.",
    durationHours: 2.5,
    startingPrice: 4100,
    requiresMuhurat: false,
  },
  {
    slug: "kaal-sarp-shanti",
    name: "Kaal Sarp Dosh Shanti",
    sanskritName: "कालसर्प दोष शांति",
    emoji: "🐍",
    category: "Remedial",
    ritualType: "Shanti",
    shortDescription:
      "Remedial rite to relieve Kaal Sarp dosha and its obstacles in life and career.",
    durationHours: 3,
    startingPrice: 6100,
    longDescription:
      "A remedial rite to relieve Kaal Sarp dosha — the chart condition where all planets sit between Rahu and Ketu — which can stall career, marriage and progress. Performed with naga puja and homa, at home or at a recognised kshetra.",
    includes: [
      "Naga / Rahu-Ketu avahan and puja",
      "Kaal Sarp shanti homa",
      "Silver naga visarjan guidance",
      "Sankalp for relief from obstacles",
      "Verified Pandit; muhurat confirmed",
    ],
    requiresMuhurat: true,
  },
  {
    slug: "mangal-dosh-shanti",
    name: "Mangal Dosh Shanti",
    sanskritName: "मंगल दोष शांति",
    emoji: "🔴",
    category: "Remedial",
    ritualType: "Shanti",
    shortDescription:
      "Rite to pacify Mangal (Manglik) dosha, often before marriage, for marital harmony.",
    durationHours: 2.5,
    startingPrice: 5100,
    longDescription:
      "A rite to pacify Mangal (Manglik) dosha, often performed before marriage to remove obstacles to a happy married life. Includes Mangal graha puja, jaap and homa as prescribed.",
    includes: [
      "Mangal graha avahan and puja",
      "Mangal mantra jaap (count per sankalp)",
      "Mangal shanti homa",
      "Daan and remedy guidance",
      "Verified Pandit; muhurat confirmed",
    ],
    requiresMuhurat: true,
  },
  {
    slug: "pitru-dosh-shanti",
    name: "Pitru Dosh Shanti",
    sanskritName: "पितृ दोष शांति",
    emoji: "🪯",
    category: "Remedial",
    ritualType: "Shanti",
    shortDescription:
      "Remedial rite to relieve ancestral (pitru) dosha and bring peace and progress.",
    durationHours: 3,
    startingPrice: 5100,
    longDescription:
      "A remedial rite to relieve Pitru dosha — ancestral karmic debt that can obstruct progeny, prosperity and peace. Performed with tarpan and a shanti homa for the contentment of the ancestors.",
    includes: [
      "Pitru avahan and tarpan",
      "Pitru dosh shanti homa",
      "Brahmin bhoj and daan guidance",
      "Sankalp for family peace and progress",
      "Verified Pandit; muhurat confirmed",
    ],
    requiresMuhurat: true,
  },
  {
    slug: "shani-shanti",
    name: "Shani Shanti",
    sanskritName: "शनि शांति",
    emoji: "🪐",
    category: "Remedial",
    ritualType: "Shanti",
    shortDescription:
      "Rite to pacify Saturn during Sade Sati or Shani dasha for relief from hardship.",
    durationHours: 2.5,
    startingPrice: 4100,
    longDescription:
      "A rite to pacify Saturn during Sade Sati, dhaiya or a difficult Shani dasha, for relief from delays, hardship and ill health. Includes Shani graha puja, jaap, homa and the prescribed daan.",
    includes: [
      "Shani graha avahan and puja",
      "Shani mantra jaap (count per sankalp)",
      "Shani shanti homa with til / oil offerings",
      "Daan guidance (til, iron, black cloth)",
      "Verified Pandit; ideally on a Saturday",
    ],
    requiresMuhurat: true,
  },

  // ── Recitations (Katha / Path) ───────────────────────────────────────────────
  {
    slug: "durga-saptashati-path",
    name: "Durga Saptashati Path",
    sanskritName: "दुर्गा सप्तशती",
    emoji: "📕",
    category: "Remedial",
    ritualType: "Katha",
    shortDescription:
      "Recitation of the 700 verses of Durga Saptashati for protection and strength.",
    durationHours: 3,
    startingPrice: 5100,
    longDescription:
      "A recitation of the 700 verses of the Durga Saptashati (Chandi Path), invoking the Goddess for protection, strength and the removal of obstacles. Performed as a single or multi-fold paath per your sankalp.",
    includes: [
      "Devi avahan and kalash sthapana",
      "Durga Saptashati paath (folds per sankalp)",
      "Argala, Keelak and Devi kavach",
      "Aarti and prasad",
      "Verified Pandit; about 3 hours",
    ],
    requiresMuhurat: false,
  },

  // ── Life events: the samskaras ────────────────────────────────────────────────
  {
    slug: "jatakarma",
    name: "Jatakarma (Birth Rite)",
    sanskritName: "जातकर्म",
    emoji: "🍼",
    category: "Life Event",
    ritualType: "Sanskar",
    shortDescription:
      "The newborn welcoming rite, performed soon after birth for the baby's well-being.",
    durationHours: 1.5,
    startingPrice: 2500,
    longDescription:
      "The first samskara after birth, traditionally performed to welcome the newborn with mantras for health, intellect and long life. A gentle rite the Pandit adapts respectfully to the family and the baby's comfort.",
    includes: [
      "Sankalp and Ganesh puja",
      "Jatakarma mantras for the newborn",
      "Madhu-ghrita prashan ritual",
      "Blessings for health and long life",
      "Verified Pandit; muhurat guided",
    ],
    requiresMuhurat: true,
  },
  {
    slug: "godh-bharai",
    name: "Godh Bharai (Baby Shower)",
    sanskritName: "सीमन्तोन्नयन",
    emoji: "🤰",
    category: "Life Event",
    ritualType: "Sanskar",
    shortDescription:
      "Simantonnayana — the blessing of the mother-to-be for a safe and healthy delivery.",
    durationHours: 1.5,
    startingPrice: 2500,
    longDescription:
      "Simantonnayana — the traditional baby shower performed in the later months of pregnancy to bless the mother-to-be and pray for a safe, healthy delivery. A warm family rite with puja and blessings.",
    includes: [
      "Sankalp and Ganesh-Gauri puja",
      "Blessing of the expectant mother",
      "Mantras for a safe and healthy delivery",
      "Aarti and family blessings",
      "Verified Pandit in your language",
    ],
    requiresMuhurat: true,
  },
  {
    slug: "namkaran",
    name: "Namkaran (Naming)",
    sanskritName: "नामकरण",
    emoji: "👶",
    category: "Life Event",
    ritualType: "Sanskar",
    shortDescription:
      "Traditional naming ceremony to welcome and bless a newborn child.",
    durationHours: 2,
    startingPrice: 3100,
    requiresMuhurat: true,
  },
  {
    slug: "nishkramana",
    name: "Nishkramana (Cradle / First Outing)",
    sanskritName: "निष्क्रमण",
    emoji: "🌅",
    category: "Life Event",
    ritualType: "Sanskar",
    shortDescription:
      "Cradle ceremony marking the baby's first outing and first sight of the sun.",
    durationHours: 1.5,
    startingPrice: 2500,
    longDescription:
      "The cradle ceremony marking the baby's first formal outing and first sight of the sun, performed in the third or fourth month for the child's health and protection. Often combined with placing the baby in the cradle (palna / jhula).",
    includes: [
      "Sankalp and Surya darshan ritual",
      "Cradle (palna) placement and blessing",
      "Mantras for the child's protection",
      "Aarti and prasad",
      "Verified Pandit; muhurat guided",
    ],
    requiresMuhurat: true,
  },
  {
    slug: "annaprashan",
    name: "Annaprashan (First Rice)",
    sanskritName: "अन्नप्राशन",
    emoji: "🍚",
    category: "Life Event",
    ritualType: "Sanskar",
    shortDescription:
      "First-grain ceremony marking when a baby begins to eat solid food, for health and nourishment.",
    durationHours: 1.5,
    startingPrice: 2500,
    requiresMuhurat: true,
  },
  {
    slug: "karnavedha",
    name: "Karnavedha (Ear Piercing)",
    sanskritName: "कर्णवेध",
    emoji: "👂",
    category: "Life Event",
    ritualType: "Sanskar",
    shortDescription:
      "Ear-piercing sacrament for a child, performed on an auspicious day for health.",
    durationHours: 1.5,
    startingPrice: 2500,
    longDescription:
      "The ear-piercing samskara, performed on an auspicious day for the child's health and as a traditional rite of well-being. The Pandit performs the puja and sankalp; the piercing itself is done by your chosen practitioner.",
    includes: [
      "Sankalp and Ganesh puja",
      "Mantras during the karnavedha rite",
      "Blessing for the child's health",
      "Aarti and prasad",
      "Verified Pandit; muhurat confirmed",
    ],
    requiresMuhurat: true,
  },
  {
    slug: "mundan",
    name: "Mundan Sanskar",
    sanskritName: "मुंडन संस्कार",
    emoji: "✂️",
    category: "Life Event",
    ritualType: "Sanskar",
    shortDescription:
      "First haircut ceremony performed for the health and long life of a child.",
    durationHours: 1.5,
    startingPrice: 2500,
    requiresMuhurat: true,
  },
  {
    slug: "vidyarambha",
    name: "Vidyarambha (Aksharabhyasam)",
    sanskritName: "विद्यारम्भ",
    emoji: "✏️",
    category: "Life Event",
    ritualType: "Sanskar",
    shortDescription:
      "The start-of-learning rite, when a child writes their first letters under blessings.",
    durationHours: 1.5,
    startingPrice: 2100,
    longDescription:
      "The start-of-learning rite (Aksharabhyasam), when a child writes their first letters under the blessings of Ganesha and Saraswati — often on Vasant Panchami or Vijayadashami. A joyful beginning to the child's education.",
    includes: [
      "Ganesh and Saraswati puja",
      "Guided writing of the first letters",
      "Blessing of slate, chalk and books",
      "Aarti and prasad",
      "Verified Pandit in your language",
    ],
    requiresMuhurat: true,
  },
  {
    slug: "upanayana",
    name: "Upanayana (Janeu / Sacred Thread)",
    sanskritName: "उपनयन",
    emoji: "🧵",
    category: "Life Event",
    ritualType: "Sanskar",
    shortDescription:
      "Sacred-thread (janeu) ceremony initiating a child into Vedic study and discipline.",
    durationHours: 3,
    startingPrice: 7100,
    longDescription:
      "The sacred-thread (janeu / yajnopavita) ceremony initiating a child into Vedic study and discipline, with the Gayatri upadesha. A major samskara performed over a few hours with homa and family blessings.",
    includes: [
      "Sankalp, Ganesh puja and homa",
      "Yajnopavita (janeu) dharan",
      "Gayatri mantra upadesha",
      "Bhiksha ritual and blessings",
      "Experienced Pandit; muhurat confirmed",
    ],
    requiresMuhurat: true,
  },
  {
    slug: "sagai-engagement",
    name: "Engagement (Sagai / Roka)",
    sanskritName: "सगाई",
    emoji: "💑",
    category: "Life Event",
    ritualType: "Sanskar",
    shortDescription:
      "Ring and roka ceremony formalising the betrothal with the blessings of both families.",
    durationHours: 1.5,
    startingPrice: 3100,
    requiresMuhurat: true,
  },
  {
    slug: "haldi-ceremony",
    name: "Haldi Ceremony",
    sanskritName: "हल्दी",
    emoji: "🌼",
    category: "Life Event",
    ritualType: "Sanskar",
    shortDescription:
      "Joyful turmeric ceremony for the bride and groom, for blessings and a radiant glow before the wedding.",
    durationHours: 1.5,
    startingPrice: 2100,
    requiresMuhurat: false,
  },
  {
    slug: "vivah-sanskar",
    name: "Vivah (Wedding)",
    sanskritName: "विवाह संस्कार",
    emoji: "💍",
    category: "Life Event",
    ritualType: "Sanskar",
    shortDescription:
      "Complete Vedic wedding rituals performed by an experienced Pandit.",
    durationHours: 4,
    startingPrice: 11000,
    requiresMuhurat: true,
  },

  // ── Ancestral rites ────────────────────────────────────────────────────────
  {
    slug: "pitru-paksha-shraddh",
    name: "Shraddh / Pitru Paksha",
    sanskritName: "श्राद्ध",
    emoji: "🙏",
    category: "Ancestral",
    ritualType: "Shraddh",
    shortDescription:
      "Ritual offerings to honour ancestors and seek their blessings and peace.",
    durationHours: 2,
    startingPrice: 2100,
    requiresMuhurat: true,
  },
  {
    slug: "tarpan",
    name: "Tarpan",
    sanskritName: "तर्पण",
    emoji: "💧",
    category: "Ancestral",
    ritualType: "Shraddh",
    shortDescription:
      "Water and sesame offerings to satisfy and honour departed ancestors.",
    durationHours: 1,
    startingPrice: 1500,
    longDescription:
      "Water and sesame offerings (tarpan) to satisfy and honour departed ancestors, performed on Amavasya, during Pitru Paksha, or on a death anniversary. A concise but important rite for the peace of the pitrs.",
    includes: [
      "Sankalp and pitru avahan",
      "Til-jal tarpan for the ancestors",
      "Mantras for the peace of departed souls",
      "Daan guidance",
      "Verified Pandit; performed as per tradition",
    ],
    requiresMuhurat: true,
  },
  {
    slug: "pind-daan",
    name: "Pind Daan",
    sanskritName: "पिण्डदान",
    emoji: "🍙",
    category: "Ancestral",
    ritualType: "Shraddh",
    shortDescription:
      "Rice-ball offerings for the liberation and peace of departed souls.",
    durationHours: 2.5,
    startingPrice: 5100,
    longDescription:
      "Rice-ball (pinda) offerings for the liberation and peace of departed souls, performed during Pitru Paksha or at a tirtha such as Gaya. The Pandit performs the full vidhi with tarpan and brahmin-bhoj guidance.",
    includes: [
      "Sankalp and pitru avahan",
      "Pind daan with til and kusha",
      "Tarpan and ancestral mantras",
      "Brahmin bhoj and daan guidance",
      "Verified Pandit; performed strictly per vidhi",
    ],
    requiresMuhurat: true,
  },
  {
    slug: "antyeshti",
    name: "Antyeshti (Last Rites)",
    sanskritName: "अन्त्येष्टि",
    emoji: "🪷",
    category: "Ancestral",
    ritualType: "Sanskar",
    shortDescription:
      "Funeral rites performed with dignity and compassion, strictly as per Vedic tradition.",
    durationHours: 3,
    startingPrice: 5100,
    requiresMuhurat: false,
  },
];

export const popularPoojas = poojas.filter((p) => p.popular);

export const poojaCategories: readonly PoojaCategory[] = [
  "Home",
  "Festival",
  "Life Event",
  "Remedial",
  "Ancestral",
] as const;

export const ritualTypes: readonly RitualType[] = [
  "Sanskar",
  "Pooja",
  "Havan",
  "Shanti",
  "Katha",
  "Abhishek",
  "Shraddh",
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
