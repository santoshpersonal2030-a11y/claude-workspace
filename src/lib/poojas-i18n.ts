// Flexible, N-language translations for the pooja CATALOG content (names and
// descriptions), kept separate from the UI-chrome dictionary in i18n.ts.
//
// English is the canonical source — it lives in poojas.ts (or the Supabase
// `poojas` table) and needs NO entry here. For every other locale, add a block
// keyed by slug; within it, translate only the fields you have. Anything you
// omit — a whole locale, a slug, or a single field — falls back to English.
//
// To add a language: add a `<locale>: { ... }` block below. That's it — the
// page calls localizePooja() for whatever the active locale is.
// When the catalog moves fully to Supabase, this same shape can be backed by
// translation columns/rows without changing the call sites.

import type { Locale } from "@/lib/i18n";
import type { Pooja } from "@/lib/poojas";

// The translatable text fields of a pooja. All optional so a locale can be
// filled in incrementally.
export type PoojaText = Partial<
  Pick<
    Pooja,
    "name" | "sanskritName" | "shortDescription" | "longDescription" | "includes"
  >
>;

type CatalogDict = Record<string, PoojaText>; // slug -> overrides

const POOJA_I18N: Partial<Record<Locale, CatalogDict>> = {
  hi: {
    "satyanarayan-katha": {
      name: "सत्यनारायण कथा",
      shortDescription:
        "समृद्धि और कल्याण के लिए भगवान विष्णु का आशीर्वाद पाने हेतु शुभ पूजा।",
      longDescription:
        "भगवान सत्यनारायण (विष्णु) की कथा और पूजा — गृह प्रवेश, विवाह, संतान-जन्म या किसी भी शुभ अवसर पर परिवार की समृद्धि और कल्याण के लिए की जाती है। हमारे सत्यापित पंडित कथा-वाचन, पूजन और प्रसाद वितरण विधिपूर्वक सम्पन्न कराते हैं।",
      includes: [
        "कलश स्थापना और गणेश-विष्णु पूजन",
        "सत्यनारायण कथा के पाँचों अध्यायों का वाचन",
        "पूजन सामग्री व विधि का मार्गदर्शन",
        "आरती और प्रसाद वितरण",
        "आपकी पसंदीदा भाषा बोलने वाले पंडित",
      ],
    },
    "griha-pravesh": {
      name: "गृह प्रवेश",
      shortDescription:
        "नए घर में प्रवेश से पहले उसे पवित्र और मंगलमय बनाने की गृह-प्रवेश पूजा।",
      longDescription:
        "नए घर में रहने आने से पहले उसे शुद्ध और मंगलमय बनाने के लिए गृह प्रवेश पूजा की जाती है। हमारे सत्यापित पंडित वास्तु शांति, हवन और गृह प्रवेश की समस्त विधियाँ वैदिक परंपरा के अनुसार सम्पन्न कराते हैं, और शुभ मुहूर्त की पुष्टि करते हैं। समारोह में लगभग 3 घंटे लगते हैं।",
      includes: [
        "वास्तु शांति और कलश पूजन",
        "नवग्रह व गणेश पूजन",
        "हवन और पूर्णाहुति",
        "दूध उबालने व प्रवेश की विधि का मार्गदर्शन",
        "आरती और प्रसाद वितरण",
      ],
    },
    "ganesh-puja": {
      name: "गणेश पूजा",
      shortDescription:
        "किसी भी नई शुरुआत या त्योहार से पहले विघ्नहर्ता गणेश का आवाहन।",
      longDescription:
        "किसी भी शुभ कार्य, नई शुरुआत या त्योहार से पहले विघ्नहर्ता भगवान गणेश का पूजन किया जाता है ताकि सभी बाधाएँ दूर हों और कार्य निर्विघ्न सम्पन्न हो। हमारे सत्यापित पंडित गणेश आवाहन, पूजन और आरती विधिपूर्वक कराते हैं।",
      includes: [
        "कलश स्थापना और गणेश आवाहन",
        "षोडशोपचार गणेश पूजन",
        "गणपति अथर्वशीर्ष का पाठ",
        "आरती और मोदक/प्रसाद अर्पण",
        "पूजन विधि का मार्गदर्शन",
      ],
    },
    "lakshmi-puja": {
      name: "लक्ष्मी पूजा (दिवाली)",
      shortDescription:
        "धन, समृद्धि और माँ लक्ष्मी के आशीर्वाद के लिए दिवाली पूजा।",
      longDescription:
        "दीपावली की संध्या पर धन और समृद्धि की देवी माँ लक्ष्मी का पूजन किया जाता है, प्रायः भगवान गणेश और कुबेर के साथ। हमारे सत्यापित पंडित कलश स्थापना, लक्ष्मी-गणेश पूजन और आरती विधिपूर्वक सम्पन्न कराते हैं।",
      includes: [
        "कलश स्थापना और दीप प्रज्वलन",
        "लक्ष्मी, गणेश व कुबेर पूजन",
        "श्री सूक्त / लक्ष्मी स्तोत्र का पाठ",
        "आरती और प्रसाद वितरण",
        "पूजन सामग्री व विधि का मार्गदर्शन",
      ],
    },
  },
  te: {
    "satyanarayan-katha": {
      name: "సత్యనారాయణ వ్రతం",
      sanskritName: "సత్యనారాయణ కథ",
      shortDescription:
        "శ్రేయస్సు మరియు సంక్షేమం కోసం విష్ణు భగవానుని ఆశీర్వాదం కోరే శుభ పూజ.",
      longDescription:
        "సత్యనారాయణ స్వామి (విష్ణువు) కథ మరియు పూజ — గృహ ప్రవేశం, వివాహం, సంతాన జననం లేదా ఏ శుభ సందర్భంలోనైనా కుటుంబ శ్రేయస్సు, సంక్షేమం కోసం నిర్వహిస్తారు. మా ధృవీకరించిన పండితులు కథా పఠనం, పూజ మరియు ప్రసాద వితరణను శాస్త్రోక్తంగా నిర్వహిస్తారు.",
      includes: [
        "కలశ స్థాపన మరియు గణేశ-విష్ణు పూజ",
        "సత్యనారాయణ కథలోని ఐదు అధ్యాయాల పఠనం",
        "పూజ సామగ్రి మరియు విధానంపై మార్గదర్శనం",
        "హారతి మరియు ప్రసాద వితరణ",
        "మీ ఇష్టమైన భాష మాట్లాడే పండితుడు",
      ],
    },
    "griha-pravesh": {
      name: "గృహ ప్రవేశం",
      sanskritName: "గృహ ప్రవేశం",
      shortDescription:
        "కొత్త ఇంట్లో అడుగుపెట్టే ముందు దాన్ని పవిత్రం చేసి ఆశీర్వదించే గృహప్రవేశ పూజ.",
      longDescription:
        "కొత్త ఇంట్లో నివాసం ప్రారంభించే ముందు దాన్ని శుద్ధి చేసి శుభప్రదం చేయడానికి గృహ ప్రవేశ పూజ నిర్వహిస్తారు. మా ధృవీకరించిన పండితులు వాస్తు శాంతి, హోమం మరియు గృహ ప్రవేశ విధులన్నింటినీ వేద సంప్రదాయం ప్రకారం నిర్వహించి, శుభ ముహూర్తాన్ని ధృవీకరిస్తారు. ఈ కార్యక్రమం సుమారు 3 గంటలు పడుతుంది.",
      includes: [
        "వాస్తు శాంతి మరియు కలశ పూజ",
        "నవగ్రహ మరియు గణేశ పూజ",
        "హోమం మరియు పూర్ణాహుతి",
        "పాలు పొంగించడం మరియు ప్రవేశ విధానంపై మార్గదర్శనం",
        "హారతి మరియు ప్రసాద వితరణ",
      ],
    },
    "ganesh-puja": {
      name: "గణేశ పూజ",
      sanskritName: "గణేశ పూజ",
      shortDescription:
        "ఏదైనా కొత్త ప్రారంభం లేదా పండుగకు ముందు విఘ్నాలను తొలగించే గణేశుని ఆవాహన.",
      longDescription:
        "ఏదైనా శుభ కార్యం, కొత్త ప్రారంభం లేదా పండుగకు ముందు విఘ్నేశ్వరుడైన గణేశుని పూజిస్తారు, తద్వారా అన్ని అడ్డంకులు తొలగి కార్యం నిర్విఘ్నంగా జరుగుతుంది. మా ధృవీకరించిన పండితులు గణేశ ఆవాహన, పూజ మరియు హారతిని శాస్త్రోక్తంగా నిర్వహిస్తారు.",
      includes: [
        "కలశ స్థాపన మరియు గణేశ ఆవాహన",
        "షోడశోపచార గణేశ పూజ",
        "గణపతి అథర్వశీర్ష పఠనం",
        "హారతి మరియు మోదక/ప్రసాద సమర్పణ",
        "పూజ విధానంపై మార్గదర్శనం",
      ],
    },
    "lakshmi-puja": {
      name: "లక్ష్మి పూజ (దీపావళి)",
      sanskritName: "లక్ష్మి పూజ",
      shortDescription:
        "ధనం, సమృద్ధి మరియు లక్ష్మీ దేవి ఆశీర్వాదం కోసం దీపావళి పూజ.",
      longDescription:
        "దీపావళి సాయంత్రం ధన, సమృద్ధికి అధిదేవత అయిన లక్ష్మీ దేవిని, తరచుగా గణేశుడు మరియు కుబేరునితో కలిపి పూజిస్తారు. మా ధృవీకరించిన పండితులు కలశ స్థాపన, లక్ష్మీ-గణేశ పూజ మరియు హారతిని శాస్త్రోక్తంగా నిర్వహిస్తారు.",
      includes: [
        "కలశ స్థాపన మరియు దీప ప్రజ్వలన",
        "లక్ష్మి, గణేశ మరియు కుబేర పూజ",
        "శ్రీ సూక్తం / లక్ష్మీ స్తోత్ర పఠనం",
        "హారతి మరియు ప్రసాద వితరణ",
        "పూజ సామగ్రి మరియు విధానంపై మార్గదర్శనం",
      ],
    },
  },
};

// Returns the pooja with any available translations for `locale` merged over
// the English fields. A no-op for English or untranslated entries, so it's safe
// to call for every locale and every pooja.
export function localizePooja(pooja: Pooja, locale: Locale): Pooja {
  const tr = POOJA_I18N[locale]?.[pooja.slug];
  if (!tr) return pooja;
  const merged: Pooja = { ...pooja };
  (Object.keys(tr) as (keyof PoojaText)[]).forEach((k) => {
    const v = tr[k];
    if (v !== undefined) {
      // Each key of PoojaText is assignable to the same key of Pooja.
      (merged[k] as PoojaText[typeof k]) = v;
    }
  });
  return merged;
}
