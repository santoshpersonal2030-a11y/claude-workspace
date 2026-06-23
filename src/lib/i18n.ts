// Lightweight, dependency-free i18n. A flat dictionary per locale and a pure
// t() lookup with {var} interpolation and English fallback. Locale is persisted
// client-side (cookie) so static/ISR pages keep rendering without forcing
// dynamic server rendering.

export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "hi";
}

type Dict = Record<string, string>;

const en: Dict = {
  "nav.bookPooja": "Book a Pooja",
  "nav.ceremonies": "Ceremonies",
  "nav.muhurat": "Shubh Muhurat",
  "nav.panchang": "Panchang",
  "nav.store": "Samagri Store",
  "nav.pandits": "Our Pandits",
  "nav.howItWorks": "How It Works",
  "brand.tagline": "Devotion, delivered.",
  "common.signIn": "Sign in",
  "common.account": "My account",
  "common.cart": "Cart",
  "common.wishlist": "Wishlist",
  "common.menu": "Menu",
  "common.language": "Language",
  "common.shopSamagri": "Shop Samagri",
  "home.heroBadge": "🪔 Verified Pandits • Authentic Samagri",
  "home.heroTitle": "Book a trusted Pandit for every sacred occasion",
  "home.heroSubtitle":
    "From Griha Pravesh to Satyanarayan Katha — experienced, verified Poojaris at your home, with authentic samagri kits delivered to your door.",
  "home.heroRating": "⭐ Rated 4.9/5 by thousands of families across India",
  "footer.tagline":
    "Book verified, experienced Pandits for any ceremony and order authentic pooja samagri — delivered to your door.",
  "footer.explore": "Explore",
  "footer.company": "Company",
  "footer.policies": "Policies",
  "footer.rights": "© {year} BookMyPoojari. All rights reserved.",
};

const hi: Dict = {
  "nav.bookPooja": "पूजा बुक करें",
  "nav.ceremonies": "संस्कार",
  "nav.muhurat": "शुभ मुहूर्त",
  "nav.panchang": "पंचांग",
  "nav.store": "सामग्री स्टोर",
  "nav.pandits": "हमारे पंडित",
  "nav.howItWorks": "यह कैसे काम करता है",
  "brand.tagline": "भक्ति, आपके द्वार।",
  "common.signIn": "साइन इन करें",
  "common.account": "मेरा खाता",
  "common.cart": "कार्ट",
  "common.wishlist": "पसंदीदा",
  "common.menu": "मेन्यू",
  "common.language": "भाषा",
  "common.shopSamagri": "सामग्री खरीदें",
  "home.heroBadge": "🪔 सत्यापित पंडित • प्रामाणिक सामग्री",
  "home.heroTitle": "हर शुभ अवसर के लिए एक विश्वसनीय पंडित बुक करें",
  "home.heroSubtitle":
    "गृह प्रवेश से सत्यनारायण कथा तक — अनुभवी, सत्यापित पुजारी आपके घर पर, और प्रामाणिक सामग्री किट आपके द्वार तक।",
  "home.heroRating": "⭐ पूरे भारत में हज़ारों परिवारों द्वारा 4.9/5 रेटेड",
  "footer.tagline":
    "किसी भी समारोह के लिए सत्यापित, अनुभवी पंडित बुक करें और प्रामाणिक पूजा सामग्री मंगाएँ — आपके द्वार तक।",
  "footer.explore": "खोजें",
  "footer.company": "कंपनी",
  "footer.policies": "नीतियाँ",
  "footer.rights": "© {year} बुकमायपुजारी। सर्वाधिकार सुरक्षित।",
};

const DICTS: Record<Locale, Dict> = { en, hi };

// Translates a key for a locale, falling back to English then the key itself.
// Supports {name} placeholders via the optional vars map.
export function t(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const template = DICTS[locale]?.[key] ?? en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  );
}
