import type { Locale } from "@/lib/i18n";

/* Translations for the FESTIVAL calendar, in the same shape as the other content-i18n layers
 * (poojas, products, pandits, temple, consultations, ceremonies, calendar).
 *
 * There was no festivals layer, so festival names and their one-line blurbs rendered in English
 * on the Hindi and Telugu sites — on the festivals list, in the reminder push, and now on the
 * per-festival pages. English is canonical: a missing locale, name or field falls back to it.
 *
 * Keyed by the ENGLISH festival name rather than a date, because the same festival recurs every
 * year in src/lib/festivals.ts and one translation should serve all five years. The unit test
 * asserts every name in the table has an entry, so adding a 2031 row cannot silently reintroduce
 * an English name.
 *
 * ⚠️ Written by Claude, not a translator. These are standard, widely-used names and every one is
 * in common use in its script — but they are religious terms and should be read by a native
 * speaker before launch. Listed in the appendix of NIGHT-SHIFT-LOG.md.
 */

export type FestivalText = { name?: string; push?: string };

const DATA: Partial<Record<Locale, Record<string, FestivalText>>> = {
  hi: {
    "Vasant Panchami": {
      name: "वसंत पंचमी",
      push: "ज्ञान और विद्या के लिए माँ सरस्वती की पूजा करें।",
    },
    Mahashivratri: {
      name: "महाशिवरात्रि",
      push: "शिव की महान रात्रि — महाशिवरात्रि पूजा बुक करें।",
    },
    "Holika Dahan": {
      name: "होलिका दहन",
      push: "होलिका दहन की अग्नि प्रज्वलित करें — होलिका दहन पूजा बुक करें।",
    },
    "Ram Navami": {
      name: "राम नवमी",
      push: "भगवान श्रीराम के जन्मोत्सव पर राम नवमी पूजा करें।",
    },
    "Hanuman Jayanti": {
      name: "हनुमान जयंती",
      push: "हनुमान जी की आराधना करें — सुंदरकांड / हनुमान चालीसा पाठ।",
    },
    "Akshaya Tritiya": {
      name: "अक्षय तृतीया",
      push: "नए आरंभ और लक्ष्मी पूजा के लिए अत्यंत शुभ दिन।",
    },
    "Guru Purnima": {
      name: "गुरु पूर्णिमा",
      push: "अपने गुरु का सम्मान करें — सत्यनारायण कथा।",
    },
    "Krishna Janmashtami": {
      name: "कृष्ण जन्माष्टमी",
      push: "श्रीकृष्ण जन्मोत्सव — जन्माष्टमी पूजा बुक करें।",
    },
    "Ganesh Chaturthi": {
      name: "गणेश चतुर्थी",
      push: "गणपति बप्पा का स्वागत करें — गणेश पूजा बुक करें।",
    },
    Navratri: {
      name: "नवरात्रि",
      push: "देवी के नौ दिन — घटस्थापना और दुर्गा पूजा से आरंभ करें।",
    },
    Dussehra: {
      name: "दशहरा",
      push: "विजयादशमी — असत्य पर सत्य की विजय, दुर्गा पूजा करें।",
    },
    "Karwa Chauth": {
      name: "करवा चौथ",
      push: "करवा चौथ व्रत और कथा के लिए पंडित जी बुक करें।",
    },
    Dhanteras: {
      name: "धनतेरस",
      push: "समृद्धि का आह्वान करें — लक्ष्मी-धनतेरस पूजा बुक करें।",
    },
    Diwali: {
      name: "दीपावली",
      push: "प्रकाश का पर्व — अपनी लक्ष्मी पूजा के लिए पंडित जी जल्दी बुक करें।",
    },
    "Govardhan Puja": {
      name: "गोवर्धन पूजा",
      push: "अन्नकूट अर्पित करें — गोवर्धन पूजा बुक करें।",
    },
    "Chhath Puja": {
      name: "छठ पूजा",
      push: "सूर्य को अर्घ्य दें — छठ के लिए पंडित जी बुक करें।",
    },
    "Tulsi Vivah": {
      name: "तुलसी विवाह",
      push: "तुलसी और शालिग्राम का विवाह — तुलसी विवाह बुक करें।",
    },
  },
  te: {
    "Vasant Panchami": {
      name: "వసంత పంచమి",
      push: "జ్ఞానం మరియు విద్య కోసం సరస్వతీ దేవిని పూజించండి.",
    },
    Mahashivratri: {
      name: "మహాశివరాత్రి",
      push: "శివుని మహా రాత్రి — మహాశివరాత్రి పూజను బుక్ చేయండి.",
    },
    "Holika Dahan": {
      name: "హోళికా దహనం",
      push: "హోళికా దహనం అగ్నిని వెలిగించండి — హోళికా దహన పూజను బుక్ చేయండి.",
    },
    "Ram Navami": {
      name: "శ్రీరామ నవమి",
      push: "శ్రీరాముని జన్మదినాన రామ నవమి పూజ చేయించండి.",
    },
    "Hanuman Jayanti": {
      name: "హనుమాన్ జయంతి",
      push: "హనుమంతుని ఆరాధించండి — సుందరకాండ / హనుమాన్ చాలీసా పారాయణం.",
    },
    "Akshaya Tritiya": {
      name: "అక్షయ తృతీయ",
      push: "కొత్త ప్రారంభాలకు మరియు లక్ష్మీ పూజకు అత్యంత శుభమైన రోజు.",
    },
    "Guru Purnima": {
      name: "గురు పూర్ణిమ",
      push: "మీ గురువును గౌరవించండి — సత్యనారాయణ కథ.",
    },
    "Krishna Janmashtami": {
      name: "కృష్ణ జన్మాష్టమి",
      push: "శ్రీకృష్ణ జన్మోత్సవం — జన్మాష్టమి పూజను బుక్ చేయండి.",
    },
    "Ganesh Chaturthi": {
      name: "వినాయక చవితి",
      push: "గణపతి బప్పాకు స్వాగతం — గణేశ పూజను బుక్ చేయండి.",
    },
    Navratri: {
      name: "నవరాత్రి",
      push: "దేవి తొమ్మిది రాత్రులు — ఘటస్థాపన మరియు దుర్గా పూజతో ప్రారంభించండి.",
    },
    Dussehra: {
      name: "దసరా",
      push: "విజయదశమి — చెడుపై మంచి విజయం, దుర్గా పూజ చేయించండి.",
    },
    "Karwa Chauth": {
      name: "కర్వా చౌత్",
      push: "కర్వా చౌత్ వ్రతం మరియు కథ కోసం పండితుడిని బుక్ చేయండి.",
    },
    Dhanteras: {
      name: "ధనత్రయోదశి",
      push: "సంపదను ఆహ్వానించండి — లక్ష్మీ-ధనత్రయోదశి పూజను బుక్ చేయండి.",
    },
    Diwali: {
      name: "దీపావళి",
      push: "దీపాల పండుగ — మీ లక్ష్మీ పూజ కోసం పండితుడిని ముందుగానే బుక్ చేయండి.",
    },
    "Govardhan Puja": {
      name: "గోవర్ధన పూజ",
      push: "అన్నకూట్ సమర్పించండి — గోవర్ధన పూజను బుక్ చేయండి.",
    },
    "Chhath Puja": {
      name: "ఛఠ్ పూజ",
      push: "సూర్యునికి అర్ఘ్యం సమర్పించండి — ఛఠ్ కోసం పండితుడిని బుక్ చేయండి.",
    },
    "Tulsi Vivah": {
      name: "తులసి వివాహం",
      push: "తులసి మరియు శాలిగ్రామ వివాహం — తులసి వివాహాన్ని బుక్ చేయండి.",
    },
  },
};

// The festival's name in `locale`, falling back to the canonical English name.
export function localizeFestivalName(englishName: string, locale: Locale): string {
  return DATA[locale]?.[englishName]?.name ?? englishName;
}

// The one-line nudge in `locale`, falling back to the English one supplied by the caller.
export function localizeFestivalPush(
  englishName: string,
  englishPush: string,
  locale: Locale,
): string {
  return DATA[locale]?.[englishName]?.push ?? englishPush;
}

// Exposed so the unit test can assert full coverage rather than spot-check it.
export function translatedFestivalNames(locale: Locale): string[] {
  return Object.keys(DATA[locale] ?? {});
}
