// Localization data for the multi-language Hindu Calendar (/calendar).
//
// This is SEPARATE from the site-wide UI i18n in i18n.ts: the calendar lets a
// visitor read the calendar in any of the languages below regardless of the
// site's UI language, so the picker offers more languages than the site chrome.
//
// The festival/tithi names are proper nouns rendered in each script. They're a
// best-effort, recognizable rendering — a native speaker can refine any entry
// without touching the calendar logic, since everything keys off these tables.

export const CAL_LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "te", label: "తెలుగు" },
  { code: "ta", label: "தமிழ்" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "mr", label: "मराठी" },
] as const;

export type CalLang = (typeof CAL_LANGS)[number]["code"];

export const CAL_LANG_CODES = CAL_LANGS.map((l) => l.code);

export function isCalLang(v: string | undefined | null): v is CalLang {
  return !!v && (CAL_LANG_CODES as string[]).includes(v);
}

export const DEFAULT_CAL_LANG: CalLang = "en";

// Gregorian month names (the grid is a Gregorian month with Hindu festivals and
// tithis overlaid), index 0 = January.
export const CAL_MONTHS: Record<CalLang, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
  te: ["జనవరి", "ఫిబ్రవరి", "మార్చి", "ఏప్రిల్", "మే", "జూన్", "జూలై", "ఆగస్టు", "సెప్టెంబర్", "అక్టోబర్", "నవంబర్", "డిసెంబర్"],
  ta: ["ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்", "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"],
  kn: ["ಜನವರಿ", "ಫೆಬ್ರವರಿ", "ಮಾರ್ಚ್", "ಏಪ್ರಿಲ್", "ಮೇ", "ಜೂನ್", "ಜುಲೈ", "ಆಗಸ್ಟ್", "ಸೆಪ್ಟೆಂಬರ್", "ಅಕ್ಟೋಬರ್", "ನವೆಂಬರ್", "ಡಿಸೆಂಬರ್"],
  ml: ["ജനുവരി", "ഫെബ്രുവരി", "മാർച്ച്", "ഏപ്രിൽ", "മേയ്", "ജൂൺ", "ജൂലൈ", "ഓഗസ്റ്റ്", "സെപ്റ്റംബർ", "ഒക്ടോബർ", "നവംബർ", "ഡിസംബർ"],
  mr: ["जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"],
};

// Short weekday headers, index 0 = Sunday (matches engine weekdayOf()).
export const CAL_WEEKDAYS: Record<CalLang, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  hi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
  te: ["ఆది", "సోమ", "మంగళ", "బుధ", "గురు", "శుక్ర", "శని"],
  ta: ["ஞாயி", "திங்", "செவ்", "புத", "வியா", "வெள்", "சனி"],
  kn: ["ಭಾನು", "ಸೋಮ", "ಮಂಗಳ", "ಬುಧ", "ಗುರು", "ಶುಕ್ರ", "ಶನಿ"],
  ml: ["ഞായ", "തിങ്ക", "ചൊവ്വ", "ബുധ", "വ്യാഴം", "വെള്ളി", "ശനി"],
  mr: ["रवि", "सोम", "मंगळ", "बुध", "गुरु", "शुक्र", "शनि"],
};

// Paksha (lunar fortnight) prefixes.
const CAL_PAKSHA: Record<CalLang, { shukla: string; krishna: string }> = {
  en: { shukla: "Shukla", krishna: "Krishna" },
  hi: { shukla: "शुक्ल", krishna: "कृष्ण" },
  te: { shukla: "శుక్ల", krishna: "కృష్ణ" },
  ta: { shukla: "சுக்ல", krishna: "கிருஷ்ண" },
  kn: { shukla: "ಶುಕ್ಲ", krishna: "ಕೃಷ್ಣ" },
  ml: { shukla: "ശുക്ല", krishna: "കൃഷ്ണ" },
  mr: { shukla: "शुक्ल", krishna: "कृष्ण" },
};

// Tithi names 1..14 (Pratipada..Chaturdashi). Purnima/Amavasya handled apart.
const CAL_TITHIS: Record<CalLang, string[]> = {
  en: ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi"],
  hi: ["प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पंचमी", "षष्ठी", "सप्तमी", "अष्टमी", "नवमी", "दशमी", "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी"],
  te: ["ప్రతిపద", "ద్వితీయ", "తృతీయ", "చతుర్థి", "పంచమి", "షష్ఠి", "సప్తమి", "అష్టమి", "నవమి", "దశమి", "ఏకాదశి", "ద్వాదశి", "త్రయోదశి", "చతుర్దశి"],
  ta: ["பிரதிபதை", "துவிதியை", "திருதியை", "சதுர்த்தி", "பஞ்சமி", "சஷ்டி", "சப்தமி", "அஷ்டமி", "நவமி", "தசமி", "ஏகாதசி", "துவாதசி", "திரயோதசி", "சதுர்த்தசி"],
  kn: ["ಪ್ರತಿಪದ", "ದ್ವಿತೀಯ", "ತೃತೀಯ", "ಚತುರ್ಥಿ", "ಪಂಚಮಿ", "ಷಷ್ಠಿ", "ಸಪ್ತಮಿ", "ಅಷ್ಟಮಿ", "ನವಮಿ", "ದಶಮಿ", "ಏಕಾದಶಿ", "ದ್ವಾದಶಿ", "ತ್ರಯೋದಶಿ", "ಚತುರ್ದಶಿ"],
  ml: ["പ്രതിപദം", "ദ്വിതീയ", "തൃതീയ", "ചതുർത്ഥി", "പഞ്ചമി", "ഷഷ്ഠി", "സപ്തമി", "അഷ്ടമി", "നവമി", "ദശമി", "ഏകാദശി", "ദ്വാദശി", "ത്രയോദശി", "ചതുർദശി"],
  mr: ["प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पंचमी", "षष्ठी", "सप्तमी", "अष्टमी", "नवमी", "दशमी", "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी"],
};

const CAL_PURNIMA: Record<CalLang, string> = {
  en: "Purnima", hi: "पूर्णिमा", te: "పూర్ణిమ", ta: "பௌர்ணமி", kn: "ಪೂರ್ಣಿಮಾ", ml: "പൗർണമി", mr: "पौर्णिमा",
};
const CAL_AMAVASYA: Record<CalLang, string> = {
  en: "Amavasya", hi: "अमावस्या", te: "అమావాస్య", ta: "அமாவாசை", kn: "ಅಮಾವಾಸ್ಯೆ", ml: "അമാവാസി", mr: "अमावस्या",
};

// Localized label for a tithi number (1..30) as produced by panchangaAt().
export function calTithiLabel(lang: CalLang, num: number): string {
  if (num === 15) return CAL_PURNIMA[lang];
  if (num === 30) return CAL_AMAVASYA[lang];
  const shukla = num <= 15;
  const idx = (shukla ? num : num - 15) - 1;
  const name = CAL_TITHIS[lang][idx] ?? CAL_TITHIS.en[idx] ?? "";
  const paksha = shukla ? CAL_PAKSHA[lang].shukla : CAL_PAKSHA[lang].krishna;
  return `${paksha} ${name}`.trim();
}

// Festival names keyed by the English name used in src/lib/festivals.ts.
const CAL_FESTIVALS: Record<string, Partial<Record<CalLang, string>>> = {
  "Vasant Panchami": { hi: "वसंत पंचमी", te: "వసంత పంచమి", ta: "வசந்த பஞ்சமி", kn: "ವಸಂತ ಪಂಚಮಿ", ml: "വസന്ത പഞ്ചമി", mr: "वसंत पंचमी" },
  Mahashivratri: { hi: "महाशिवरात्रि", te: "మహా శివరాత్రి", ta: "மகா சிவராத்திரி", kn: "ಮಹಾ ಶಿವರಾತ್ರಿ", ml: "മഹാ ശിവരാത്രി", mr: "महाशिवरात्री" },
  "Holika Dahan": { hi: "होलिका दहन", te: "హోలికా దహనం", ta: "ஹோலிகா தகனம்", kn: "ಹೋಲಿಕಾ ದಹನ", ml: "ഹോളിക ദഹനം", mr: "होलिका दहन" },
  "Ram Navami": { hi: "राम नवमी", te: "శ్రీరామ నవమి", ta: "ராம நவமி", kn: "ಶ್ರೀರಾಮ ನವಮಿ", ml: "ശ്രീരാമ നവമി", mr: "राम नवमी" },
  "Hanuman Jayanti": { hi: "हनुमान जयंती", te: "హనుమాన్ జయంతి", ta: "அனுமன் ஜெயந்தி", kn: "ಹನುಮ ಜಯಂತಿ", ml: "ഹനുമാൻ ജയന്തി", mr: "हनुमान जयंती" },
  "Akshaya Tritiya": { hi: "अक्षय तृतीया", te: "అక్షయ తృతీయ", ta: "அட்சய திருதியை", kn: "ಅಕ್ಷಯ ತೃತೀಯ", ml: "അക്ഷയ തൃതീയ", mr: "अक्षय्य तृतीया" },
  "Guru Purnima": { hi: "गुरु पूर्णिमा", te: "గురు పూర్ణిమ", ta: "குரு பூர்ணிமா", kn: "ಗುರು ಪೂರ್ಣಿಮಾ", ml: "ഗുരു പൗർണമി", mr: "गुरु पौर्णिमा" },
  "Krishna Janmashtami": { hi: "कृष्ण जन्माष्टमी", te: "శ్రీ కృష్ణ జన్మాష్టమి", ta: "கிருஷ்ண ஜென்மாஷ்டமி", kn: "ಶ್ರೀ ಕೃಷ್ಣ ಜನ್ಮಾಷ್ಟಮಿ", ml: "ശ്രീകൃഷ്ണ ജന്മാഷ്ടമി", mr: "कृष्ण जन्माष्टमी" },
  "Ganesh Chaturthi": { hi: "गणेश चतुर्थी", te: "వినాయక చవితి", ta: "விநாயகர் சதுர்த்தி", kn: "ಗಣೇಶ ಚತುರ್ಥಿ", ml: "വിനായക ചതുർത്ഥി", mr: "गणेश चतुर्थी" },
  Navratri: { hi: "नवरात्रि", te: "నవరాత్రి", ta: "நவராத்திரி", kn: "ನವರಾತ್ರಿ", ml: "നവരാത്രി", mr: "नवरात्री" },
  Dussehra: { hi: "दशहरा", te: "దసరా", ta: "தசரா", kn: "ದಸರಾ", ml: "ദസറ", mr: "दसरा" },
  "Karwa Chauth": { hi: "करवा चौथ", te: "కర్వా చౌత్", ta: "கர்வா சவுத்", kn: "ಕರ್ವಾ ಚೌತ್", ml: "കർവ ചൗത്ത്", mr: "करवा चौथ" },
  Dhanteras: { hi: "धनतेरस", te: "ధనత్రయోదశి", ta: "தன்தேராஸ்", kn: "ಧನತ್ರಯೋದಶಿ", ml: "ധനത്രയോദശി", mr: "धनत्रयोदशी" },
  Diwali: { hi: "दिवाली", te: "దీపావళి", ta: "தீபாவளி", kn: "ದೀಪಾವಳಿ", ml: "ദീപാവലി", mr: "दिवाळी" },
  "Govardhan Puja": { hi: "गोवर्धन पूजा", te: "గోవర్ధన పూజ", ta: "கோவர்தன பூஜை", kn: "ಗೋವರ್ಧನ ಪೂಜೆ", ml: "ഗോവർധന പൂജ", mr: "गोवर्धन पूजा" },
  "Chhath Puja": { hi: "छठ पूजा", te: "ఛఠ్ పూజ", ta: "சத் பூஜை", kn: "ಛಠ್ ಪೂಜೆ", ml: "ഛഠ് പൂജ", mr: "छठ पूजा" },
  "Tulsi Vivah": { hi: "तुलसी विवाह", te: "తులసి వివాహం", ta: "துளசி விவாஹம்", kn: "ತುಳಸಿ ವಿವಾಹ", ml: "തുളസി വിവാഹം", mr: "तुळशी विवाह" },
};

// Localized festival name, falling back to the English name itself.
export function calFestivalName(lang: CalLang, englishName: string): string {
  if (lang === "en") return englishName;
  return CAL_FESTIVALS[englishName]?.[lang] ?? englishName;
}

// UI chrome strings for the calendar page.
export type CalUi = {
  title: string;
  subtitle: string;
  chooseLanguage: string;
  today: string;
  festivalsThisMonth: string;
  noFestivals: string;
  bookThisPooja: string;
  fullPanchang: string;
  prevMonth: string;
  nextMonth: string;
  jumpToToday: string;
};

export const CAL_UI: Record<CalLang, CalUi> = {
  en: {
    title: "Hindu Calendar",
    subtitle: "Festivals, tithis and auspicious days — in your language.",
    chooseLanguage: "Choose your language",
    today: "Today",
    festivalsThisMonth: "Festivals this month",
    noFestivals: "No major festivals this month.",
    bookThisPooja: "Book this pooja →",
    fullPanchang: "Full panchang →",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    jumpToToday: "Today",
  },
  hi: {
    title: "हिन्दू कैलेंडर",
    subtitle: "त्योहार, तिथि और शुभ दिन — आपकी भाषा में।",
    chooseLanguage: "अपनी भाषा चुनें",
    today: "आज",
    festivalsThisMonth: "इस माह के त्योहार",
    noFestivals: "इस माह कोई प्रमुख त्योहार नहीं।",
    bookThisPooja: "यह पूजा बुक करें →",
    fullPanchang: "पूरा पंचांग →",
    prevMonth: "पिछला माह",
    nextMonth: "अगला माह",
    jumpToToday: "आज",
  },
  te: {
    title: "హిందూ క్యాలెండర్",
    subtitle: "పండుగలు, తిథులు, శుభ దినాలు — మీ భాషలో.",
    chooseLanguage: "మీ భాషను ఎంచుకోండి",
    today: "ఈరోజు",
    festivalsThisMonth: "ఈ నెల పండుగలు",
    noFestivals: "ఈ నెలలో ప్రధాన పండుగలు లేవు.",
    bookThisPooja: "ఈ పూజను బుక్ చేయండి →",
    fullPanchang: "పూర్తి పంచాంగం →",
    prevMonth: "మునుపటి నెల",
    nextMonth: "తదుపరి నెల",
    jumpToToday: "ఈరోజు",
  },
  ta: {
    title: "இந்து நாட்காட்டி",
    subtitle: "பண்டிகைகள், திதிகள், நல்ல நாட்கள் — உங்கள் மொழியில்.",
    chooseLanguage: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    today: "இன்று",
    festivalsThisMonth: "இந்த மாதப் பண்டிகைகள்",
    noFestivals: "இந்த மாதம் முக்கியப் பண்டிகைகள் இல்லை.",
    bookThisPooja: "இந்தப் பூஜையைப் பதிவு செய்யவும் →",
    fullPanchang: "முழு பஞ்சாங்கம் →",
    prevMonth: "முந்தைய மாதம்",
    nextMonth: "அடுத்த மாதம்",
    jumpToToday: "இன்று",
  },
  kn: {
    title: "ಹಿಂದೂ ಕ್ಯಾಲೆಂಡರ್",
    subtitle: "ಹಬ್ಬಗಳು, ತಿಥಿಗಳು, ಶುಭ ದಿನಗಳು — ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ.",
    chooseLanguage: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆರಿಸಿ",
    today: "ಇಂದು",
    festivalsThisMonth: "ಈ ತಿಂಗಳ ಹಬ್ಬಗಳು",
    noFestivals: "ಈ ತಿಂಗಳು ಪ್ರಮುಖ ಹಬ್ಬಗಳಿಲ್ಲ.",
    bookThisPooja: "ಈ ಪೂಜೆಯನ್ನು ಬುಕ್ ಮಾಡಿ →",
    fullPanchang: "ಪೂರ್ಣ ಪಂಚಾಂಗ →",
    prevMonth: "ಹಿಂದಿನ ತಿಂಗಳು",
    nextMonth: "ಮುಂದಿನ ತಿಂಗಳು",
    jumpToToday: "ಇಂದು",
  },
  ml: {
    title: "ഹിന്ദു കലണ്ടർ",
    subtitle: "ഉത്സവങ്ങൾ, തിഥികൾ, ശുഭ ദിനങ്ങൾ — നിങ്ങളുടെ ഭാഷയിൽ.",
    chooseLanguage: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക",
    today: "ഇന്ന്",
    festivalsThisMonth: "ഈ മാസത്തെ ഉത്സവങ്ങൾ",
    noFestivals: "ഈ മാസം പ്രധാന ഉത്സവങ്ങളില്ല.",
    bookThisPooja: "ഈ പൂജ ബുക്ക് ചെയ്യുക →",
    fullPanchang: "പൂർണ്ണ പഞ്ചാംഗം →",
    prevMonth: "കഴിഞ്ഞ മാസം",
    nextMonth: "അടുത്ത മാസം",
    jumpToToday: "ഇന്ന്",
  },
  mr: {
    title: "हिंदू दिनदर्शिका",
    subtitle: "सण, तिथी आणि शुभ दिवस — तुमच्या भाषेत.",
    chooseLanguage: "तुमची भाषा निवडा",
    today: "आज",
    festivalsThisMonth: "या महिन्यातील सण",
    noFestivals: "या महिन्यात कोणतेही प्रमुख सण नाहीत.",
    bookThisPooja: "ही पूजा बुक करा →",
    fullPanchang: "संपूर्ण पंचांग →",
    prevMonth: "मागील महिना",
    nextMonth: "पुढील महिना",
    jumpToToday: "आज",
  },
};
