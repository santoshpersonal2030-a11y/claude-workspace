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

  // Homepage — trust stats
  "home.trust.pandits": "Verified Pandits",
  "home.trust.poojas": "Poojas Performed",
  "home.trust.rating": "Average Rating",
  "home.trust.languages": "Languages",
  // Homepage — popular poojas
  "home.popular.title": "Popular Poojas",
  "home.popular.subtitle": "Our most-booked ceremonies, performed by verified Pandits.",
  "home.popular.viewAll": "View all poojas →",
  "home.popular.startsAt": "Starts at",
  "home.popular.book": "Book →",
  // Homepage — muhurat teaser
  "home.muhurat.title": "Upcoming Shubh Muhurat",
  "home.muhurat.subtitle": "Astrologer-verified auspicious dates for your ceremony.",
  "home.muhurat.viewAll": "View all dates →",
  "home.muhurat.auspicious": "Auspicious muhurat",
  // Homepage — store teaser
  "home.store.title": "Shop bestselling samagri",
  "home.store.subtitle": "Top-rated kits and essentials, delivered to your door.",
  "home.store.visit": "Visit the store →",
  "home.store.off": "{pct}% off",
  // Homepage — featured pandits
  "home.pandits.title": "Meet our verified Pandits",
  "home.pandits.subtitle": "Experienced, background-checked priests trusted by thousands of families.",
  "home.pandits.viewAll": "View all Pandits →",
  "home.pandits.verified": "✓ Verified",
  "home.pandits.years": "{years}+ years",
  // Homepage — how it works
  "home.how.title": "How it works",
  "home.how.subtitle": "A peaceful, hassle-free experience from booking to blessings.",
  "home.how.step": "Step {n}",
  "home.how.step1.title": "Choose your pooja",
  "home.how.step1.text": "Pick the ceremony you need and tell us your date, time and location.",
  "home.how.step2.title": "We match a Pandit",
  "home.how.step2.text": "A verified, experienced Pandit who speaks your language is assigned to you.",
  "home.how.step3.title": "Samagri delivered",
  "home.how.step3.text": "Order an authentic samagri kit and we deliver everything needed to your door.",
  "home.how.step4.title": "Pooja, done right",
  "home.how.step4.text": "Relax while the rituals are performed traditionally and on time.",
  // Homepage — why choose us
  "home.why.title": "Why families trust BookMyPoojari",
  "home.why.1.title": "Verified & experienced",
  "home.why.1.text": "Every Pandit is background-checked, knowledgeable and rated by real families.",
  "home.why.2.title": "Transparent pricing",
  "home.why.2.text": "Clear, upfront dakshina and samagri prices. No haggling, no surprises.",
  "home.why.3.title": "Your language, your tradition",
  "home.why.3.text": "Pandits across regions and languages who respect your family's customs.",
  "home.why.4.title": "Everything in one place",
  "home.why.4.text": "Book the priest and order the samagri kit together — fully arranged for you.",
  // Homepage — testimonials
  "home.testimonials.title": "Loved by families across India",
  "home.testimonials.subtitle": "Real words from devotees who booked with BookMyPoojari.",
  "home.testimonials.1.quote": "The Pandit ji arrived on time and performed our Griha Pravesh beautifully. He explained every step in Marathi — our elders were so happy.",
  "home.testimonials.1.detail": "Griha Pravesh · Pune",
  "home.testimonials.2.quote": "Booking the Satyanarayan Katha and the samagri kit together saved me so much running around. Everything was authentic and fresh.",
  "home.testimonials.2.detail": "Satyanarayan Katha · Delhi",
  "home.testimonials.3.quote": "Very professional and devotional. The Navagraha Shanti was done exactly as per the shastras, and the pricing was completely transparent.",
  "home.testimonials.3.detail": "Navagraha Shanti · Bengaluru",
  // Homepage — samagri CTA band
  "home.samagri.title": "Authentic Pooja Samagri, delivered",
  "home.samagri.text": "Ready-made kits with everything you need — diyas, agarbatti, roli, kalava, idols and more — sourced fresh and delivered to your home.",
  "home.samagri.cta": "Visit the Samagri Store",
  // Homepage — FAQ
  "home.faq.title": "Frequently asked questions",
  "home.faq.1.q": "How do I book a Pandit?",
  "home.faq.1.a": "Choose your ceremony, pick a date, time and language, optionally add a samagri kit, then sign in and pay securely. We assign a verified Pandit for your location and confirm your booking instantly.",
  "home.faq.2.q": "Are the Pandits verified?",
  "home.faq.2.a": "Yes. Every Pandit on BookMyPoojari is background-checked for authenticity and experience, and is rated by real families who have booked them.",
  "home.faq.3.q": "What is included in the price?",
  "home.faq.3.a": "The price covers the dakshina/service for the ceremony. You can optionally add a samagri kit that includes all the items required for the pooja, delivered to your door.",
  "home.faq.4.q": "Can I choose my language or a preferred Pandit?",
  "home.faq.4.a": "Absolutely. You select your preferred language at booking and can choose a specific Pandit from those who speak it. We honour your choice subject to availability.",
  "home.faq.5.q": "What is your cancellation policy?",
  "home.faq.5.a": "You can cancel up to 24 hours before the scheduled time for a full refund. See our Refund & Cancellation policy for full details.",
  "home.faq.6.q": "Do you deliver samagri across India?",
  "home.faq.6.a": "Yes. Ready-made samagri kits and individual items are delivered to your door, with free delivery on orders over ₹999.",
  // Homepage — final CTA
  "home.cta.title": "Ready to book your pooja?",
  "home.cta.text": "Tell us the occasion and we'll take care of the rest — the Pandit, the rituals and the samagri.",
  "home.cta.button": "Book a Pooja Now",

  // Shared
  "common.home": "Home",

  // Poojas list
  "poojas.subtitle": "Choose a ceremony and we'll arrange a verified, experienced Pandit — in your language, at your home, with authentic samagri.",
  "browse.searchPoojas": "Search poojas (e.g. Lakshmi, Griha Pravesh)…",
  "browse.type": "Type:",
  "browse.all": "All",
  "browse.startsAt": "Starts at",
  "browse.book": "Book →",
  "browse.noMatch": "No poojas match “{q}”.",
  "browse.noneInCategory": "No poojas in this category yet.",

  // Pandits list
  "pandits.h1": "Our Verified Pandits",
  "pandits.subtitle": "Every priest on BookMyPoojari is personally verified for authenticity, scriptural knowledge and experience — so you can book with complete peace of mind.",
  "pandits.acrossIndia": "Pandits across India",
  "pandits.inCity": "Pandit in {city}",
  "dir.pincode": "Your pincode",
  "dir.tier": "Tier",
  "dir.allTiers": "All tiers",
  "dir.performs": "Performs",
  "dir.allPoojas": "All poojas",
  "dir.pandit": "{n} pandit",
  "dir.pandits": "{n} pandits",
  "dir.invalidPin": "Enter a valid 6-digit pincode to see who serves your area.",
  "dir.nearbyNote": "Showing priests who serve {pin} directly, plus {n} who cover nearby areas — their travel fee is confirmed when you book.",
  "dir.serveNoFee": "✓ Serves {pin} — no travel fee",
  "dir.serveFee": "✓ Serves {pin} — +{fee} travel ({label})",
  "dir.nearby": "📍 Serves areas near {pin} — travel fee confirmed at booking",
  "dir.experience": "Experience",
  "dir.languages": "Languages",
  "dir.serves": "Serves",
  "dir.noMatch": "No pandits match these filters yet. Try widening your selection.",

  // Store list
  "store.subtitle": "Authentic pooja items and ready-made kits — sourced fresh and delivered to your door. Free delivery on orders over ₹999.",
  "store.empty": "Our store is being stocked — please check back shortly. 🙏",
  "shop.searchProducts": "Search products…",
  "shop.sort": "Sort",
  "shop.sortFeatured": "Featured",
  "shop.sortPriceAsc": "Price: Low to High",
  "shop.sortPriceDesc": "Price: High to Low",
  "shop.sortRating": "Top rated",
  "shop.sortDiscount": "Biggest discount",
  "shop.product": "{n} product",
  "shop.products": "{n} products",
  "shop.noMatch": "No products match your search. 🙏",
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

  // Homepage — trust stats
  "home.trust.pandits": "सत्यापित पंडित",
  "home.trust.poojas": "पूजाएँ संपन्न",
  "home.trust.rating": "औसत रेटिंग",
  "home.trust.languages": "भाषाएँ",
  // Homepage — popular poojas
  "home.popular.title": "लोकप्रिय पूजाएँ",
  "home.popular.subtitle": "हमारी सबसे अधिक बुक की जाने वाली पूजाएँ, सत्यापित पंडितों द्वारा संपन्न।",
  "home.popular.viewAll": "सभी पूजाएँ देखें →",
  "home.popular.startsAt": "शुरू",
  "home.popular.book": "बुक करें →",
  // Homepage — muhurat teaser
  "home.muhurat.title": "आगामी शुभ मुहूर्त",
  "home.muhurat.subtitle": "आपके समारोह के लिए ज्योतिषी-सत्यापित शुभ तिथियाँ।",
  "home.muhurat.viewAll": "सभी तिथियाँ देखें →",
  "home.muhurat.auspicious": "शुभ मुहूर्त",
  // Homepage — store teaser
  "home.store.title": "बेस्टसेलर सामग्री खरीदें",
  "home.store.subtitle": "टॉप-रेटेड किट और ज़रूरी सामान, आपके द्वार तक।",
  "home.store.visit": "स्टोर देखें →",
  "home.store.off": "{pct}% छूट",
  // Homepage — featured pandits
  "home.pandits.title": "हमारे सत्यापित पंडितों से मिलें",
  "home.pandits.subtitle": "अनुभवी, पृष्ठभूमि-जाँचे गए पंडित, हज़ारों परिवारों के विश्वासपात्र।",
  "home.pandits.viewAll": "सभी पंडित देखें →",
  "home.pandits.verified": "✓ सत्यापित",
  "home.pandits.years": "{years}+ वर्ष",
  // Homepage — how it works
  "home.how.title": "यह कैसे काम करता है",
  "home.how.subtitle": "बुकिंग से लेकर आशीर्वाद तक, एक शांत और सहज अनुभव।",
  "home.how.step": "चरण {n}",
  "home.how.step1.title": "अपनी पूजा चुनें",
  "home.how.step1.text": "जो समारोह आपको चाहिए उसे चुनें और हमें अपनी तिथि, समय और स्थान बताएँ।",
  "home.how.step2.title": "हम पंडित तय करते हैं",
  "home.how.step2.text": "आपकी भाषा बोलने वाले एक सत्यापित, अनुभवी पंडित आपके लिए नियुक्त किए जाते हैं।",
  "home.how.step3.title": "सामग्री पहुँचाई जाती है",
  "home.how.step3.text": "एक प्रामाणिक सामग्री किट मँगाएँ और पूजा के लिए ज़रूरी सब कुछ आपके द्वार तक पहुँचाया जाता है।",
  "home.how.step4.title": "पूजा, सही तरीके से",
  "home.how.step4.text": "निश्चिंत रहें — अनुष्ठान परंपरागत रूप से और समय पर संपन्न किए जाते हैं।",
  // Homepage — why choose us
  "home.why.title": "परिवार बुकमायपुजारी पर क्यों भरोसा करते हैं",
  "home.why.1.title": "सत्यापित और अनुभवी",
  "home.why.1.text": "हर पंडित की पृष्ठभूमि जाँची जाती है, वे जानकार हैं और असली परिवारों द्वारा रेटेड हैं।",
  "home.why.2.title": "पारदर्शी मूल्य",
  "home.why.2.text": "स्पष्ट, अग्रिम दक्षिणा और सामग्री मूल्य। न मोलभाव, न कोई आश्चर्य।",
  "home.why.3.title": "आपकी भाषा, आपकी परंपरा",
  "home.why.3.text": "विभिन्न क्षेत्रों और भाषाओं के पंडित, जो आपके परिवार की रीति-रिवाजों का सम्मान करते हैं।",
  "home.why.4.title": "सब कुछ एक ही जगह",
  "home.why.4.text": "पंडित बुक करें और सामग्री किट एक साथ मँगाएँ — सब आपके लिए व्यवस्थित।",
  // Homepage — testimonials
  "home.testimonials.title": "पूरे भारत के परिवारों का स्नेह",
  "home.testimonials.subtitle": "बुकमायपुजारी से बुक करने वाले भक्तों के सच्चे शब्द।",
  "home.testimonials.1.quote": "पंडित जी समय पर पहुँचे और हमारा गृह प्रवेश बहुत सुंदर ढंग से संपन्न किया। उन्होंने हर चरण मराठी में समझाया — हमारे बुज़ुर्ग बहुत प्रसन्न हुए।",
  "home.testimonials.1.detail": "गृह प्रवेश · पुणे",
  "home.testimonials.2.quote": "सत्यनारायण कथा और सामग्री किट एक साथ बुक करने से मुझे बहुत भाग-दौड़ से बचत हुई। सब कुछ प्रामाणिक और ताज़ा था।",
  "home.testimonials.2.detail": "सत्यनारायण कथा · दिल्ली",
  "home.testimonials.3.quote": "बहुत पेशेवर और भक्तिमय। नवग्रह शांति ठीक शास्त्रों के अनुसार की गई, और मूल्य पूरी तरह पारदर्शी था।",
  "home.testimonials.3.detail": "नवग्रह शांति · बेंगलुरु",
  // Homepage — samagri CTA band
  "home.samagri.title": "प्रामाणिक पूजा सामग्री, आपके द्वार तक",
  "home.samagri.text": "ज़रूरत की हर चीज़ के साथ तैयार किट — दीये, अगरबत्ती, रोली, कलावा, मूर्तियाँ और बहुत कुछ — ताज़ा स्रोत से और आपके घर तक पहुँचाया गया।",
  "home.samagri.cta": "सामग्री स्टोर देखें",
  // Homepage — FAQ
  "home.faq.title": "अक्सर पूछे जाने वाले प्रश्न",
  "home.faq.1.q": "मैं पंडित कैसे बुक करूँ?",
  "home.faq.1.a": "अपना समारोह चुनें, तिथि, समय और भाषा चुनें, चाहें तो सामग्री किट जोड़ें, फिर साइन इन करके सुरक्षित रूप से भुगतान करें। हम आपके स्थान के लिए एक सत्यापित पंडित नियुक्त करते हैं और आपकी बुकिंग तुरंत पुष्ट कर देते हैं।",
  "home.faq.2.q": "क्या पंडित सत्यापित होते हैं?",
  "home.faq.2.a": "हाँ। बुकमायपुजारी पर हर पंडित की प्रामाणिकता और अनुभव के लिए पृष्ठभूमि जाँची जाती है, और उन्हें बुक करने वाले असली परिवारों द्वारा रेटेड किया जाता है।",
  "home.faq.3.q": "मूल्य में क्या शामिल है?",
  "home.faq.3.a": "मूल्य में समारोह की दक्षिणा/सेवा शामिल है। आप चाहें तो एक सामग्री किट जोड़ सकते हैं जिसमें पूजा के लिए ज़रूरी सभी सामान शामिल होते हैं, आपके द्वार तक पहुँचाए जाते हैं।",
  "home.faq.4.q": "क्या मैं अपनी भाषा या पसंदीदा पंडित चुन सकता हूँ?",
  "home.faq.4.a": "बिल्कुल। बुकिंग के समय आप अपनी पसंदीदा भाषा चुनते हैं और उसे बोलने वाले पंडितों में से किसी विशेष पंडित को चुन सकते हैं। उपलब्धता के अधीन हम आपकी पसंद का सम्मान करते हैं।",
  "home.faq.5.q": "आपकी रद्दीकरण नीति क्या है?",
  "home.faq.5.a": "आप पूरी वापसी के लिए निर्धारित समय से 24 घंटे पहले तक रद्द कर सकते हैं। पूरी जानकारी के लिए हमारी रिफंड और रद्दीकरण नीति देखें।",
  "home.faq.6.q": "क्या आप पूरे भारत में सामग्री पहुँचाते हैं?",
  "home.faq.6.a": "हाँ। तैयार सामग्री किट और अलग-अलग सामान आपके द्वार तक पहुँचाए जाते हैं, ₹999 से अधिक के ऑर्डर पर मुफ़्त डिलीवरी के साथ।",
  // Homepage — final CTA
  "home.cta.title": "अपनी पूजा बुक करने के लिए तैयार हैं?",
  "home.cta.text": "हमें अवसर बताएँ और बाक़ी सब हम सँभाल लेंगे — पंडित, अनुष्ठान और सामग्री।",
  "home.cta.button": "अभी पूजा बुक करें",

  // Shared
  "common.home": "होम",

  // Poojas list
  "poojas.subtitle": "एक समारोह चुनें और हम एक सत्यापित, अनुभवी पंडित की व्यवस्था करेंगे — आपकी भाषा में, आपके घर पर, प्रामाणिक सामग्री के साथ।",
  "browse.searchPoojas": "पूजाएँ खोजें (जैसे लक्ष्मी, गृह प्रवेश)…",
  "browse.type": "प्रकार:",
  "browse.all": "सभी",
  "browse.startsAt": "शुरू",
  "browse.book": "बुक करें →",
  "browse.noMatch": "“{q}” से मेल खाती कोई पूजा नहीं मिली।",
  "browse.noneInCategory": "इस श्रेणी में अभी कोई पूजा नहीं है।",

  // Pandits list
  "pandits.h1": "हमारे सत्यापित पंडित",
  "pandits.subtitle": "बुकमायपुजारी पर हर पंडित प्रामाणिकता, शास्त्रीय ज्ञान और अनुभव के लिए व्यक्तिगत रूप से सत्यापित है — ताकि आप पूरी निश्चिंतता के साथ बुक कर सकें।",
  "pandits.acrossIndia": "पूरे भारत में पंडित",
  "pandits.inCity": "{city} में पंडित",
  "dir.pincode": "आपका पिनकोड",
  "dir.tier": "श्रेणी",
  "dir.allTiers": "सभी श्रेणियाँ",
  "dir.performs": "करते हैं",
  "dir.allPoojas": "सभी पूजाएँ",
  "dir.pandit": "{n} पंडित",
  "dir.pandits": "{n} पंडित",
  "dir.invalidPin": "अपने क्षेत्र में सेवा देने वालों को देखने के लिए एक मान्य 6-अंकीय पिनकोड दर्ज करें।",
  "dir.nearbyNote": "वे पंडित दिखाए जा रहे हैं जो {pin} में सीधे सेवा देते हैं, और {n} जो आस-पास के क्षेत्रों में सेवा देते हैं — उनका यात्रा शुल्क बुकिंग के समय पुष्ट होता है।",
  "dir.serveNoFee": "✓ {pin} में सेवा — कोई यात्रा शुल्क नहीं",
  "dir.serveFee": "✓ {pin} में सेवा — +{fee} यात्रा ({label})",
  "dir.nearby": "📍 {pin} के पास के क्षेत्रों में सेवा — यात्रा शुल्क बुकिंग पर पुष्ट",
  "dir.experience": "अनुभव",
  "dir.languages": "भाषाएँ",
  "dir.serves": "सेवा क्षेत्र",
  "dir.noMatch": "इन फ़िल्टरों से मेल खाते अभी कोई पंडित नहीं हैं। अपना चयन व्यापक करके देखें।",

  // Store list
  "store.subtitle": "प्रामाणिक पूजा सामान और तैयार किट — ताज़ा स्रोत से और आपके द्वार तक पहुँचाए गए। ₹999 से अधिक के ऑर्डर पर मुफ़्त डिलीवरी।",
  "store.empty": "हमारा स्टोर तैयार किया जा रहा है — कृपया जल्द ही फिर देखें। 🙏",
  "shop.searchProducts": "उत्पाद खोजें…",
  "shop.sort": "क्रमबद्ध करें",
  "shop.sortFeatured": "विशेष",
  "shop.sortPriceAsc": "मूल्य: कम से अधिक",
  "shop.sortPriceDesc": "मूल्य: अधिक से कम",
  "shop.sortRating": "सर्वोच्च रेटेड",
  "shop.sortDiscount": "सबसे बड़ी छूट",
  "shop.product": "{n} उत्पाद",
  "shop.products": "{n} उत्पाद",
  "shop.noMatch": "आपकी खोज से मेल खाता कोई उत्पाद नहीं मिला। 🙏",
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

// Server-side translator: returns a `t` bound to a locale, for use in Server
// Components and metadata where there is no React context. The dictionary lives
// in-module (small, dependency-free) so this needs no async import.
export type Translator = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export function getDictionary(locale: Locale): { locale: Locale; t: Translator } {
  return {
    locale,
    t: (key, vars) => t(locale, key, vars),
  };
}
