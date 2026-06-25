// Flexible, N-language translations for the store PRODUCT catalog. Products
// live in Supabase; this layer keys translations by product slug. English is
// canonical (no entry needed); any missing locale / slug / field falls back to
// English. To add a language, add a block to the data object below.
// GENERATED — see scratchpad (products.json from the live products table).

import type { Locale } from "@/lib/i18n";
import type { StoreProduct } from "@/lib/queries";

export type StoreProductText = Partial<Pick<StoreProduct, "name" | "description">>;

const DATA: Partial<Record<Locale, Record<string, StoreProductText>>> = {
    "hi": {
      "agarbatti-dhoop-combo": {
        "name": "अगरबत्ती और धूप कॉम्बो",
        "description": "प्राकृतिक चंदन और मोगरा अगरबत्ती के साथ कप धूप — रोज़ाना की पूजा के लिए एक सुगंधित कॉम्बो।"
      },
      "akhand-jyoti-wicks": {
        "name": "अखंड ज्योति कॉटन बाती (बत्ती)",
        "description": "अखंड ज्योति और दीयों के लिए लंबी कपास की बातियाँ — 100 का पैक, स्थिर लौ के लिए समान रूप से बनाई गई।"
      },
      "brass-pooja-thali": {
        "name": "पीतल पूजा थाली सेट",
        "description": "रोज़ाना और त्योहारी पूजा के लिए कटोरी, घंटी, अगरबत्ती स्टैंड और चम्मच के साथ हस्तनिर्मित पीतल की थाली।"
      },
      "cow-ghee-diya-set-12": {
        "name": "शुद्ध गाय घी दीया सेट (12 pcs)",
        "description": "कपास की बातियों के साथ जलाने के लिए तैयार 12 शुद्ध गाय घी के दीयों का सेट — धुआँरहित और देर तक जलने वाले।"
      },
      "griha-pravesh-kit": {
        "name": "गृह प्रवेश सामग्री किट",
        "description": "पारंपरिक गृह प्रवेश पूजा के लिए आवश्यक हर चीज़, सुव्यवस्थित रूप से पैक और ताज़ा डिलीवर की गई।"
      },
      "havan-samagri-500g": {
        "name": "हवन सामग्री (500g)",
        "description": "गुग्गल, जौ और सुगंधित जड़ी-बूटियों के साथ प्रीमियम हर्बल हवन सामग्री मिश्रण — एक सुगंधित, शुद्ध हवन के लिए।"
      },
      "kapur-camphor-pack": {
        "name": "कपूर (कपूर) पैक — 100g",
        "description": "आरती और हवन के लिए शुद्ध रिफाइंड कपूर की टिकिया, ताज़गी के लिए अलग-अलग सील की गई।"
      },
      "lakshmi-ganesh-diwali-kit": {
        "name": "लक्ष्मी-गणेश दिवाली पूजा किट",
        "description": "दीयों, बातियों, रोली, अक्षत और सूखे मेवे प्रसाद के साथ लक्ष्मी-गणेश पूजा के लिए त्योहारी दिवाली पूजा किट।"
      },
      "navagraha-shanti-kit": {
        "name": "नवग्रह शांति सामग्री किट",
        "description": "नवग्रह शांति और हवन के लिए नौ अनाज और जड़ी-बूटी किट, वैदिक आवश्यकताओं के अनुसार प्राप्त की गई।"
      },
      "panchamrit-kit": {
        "name": "पंचामृत किट",
        "description": "अभिषेक के लिए पंचामृत तैयार करने हेतु दूध पाउडर, दही, शहद, घी और चीनी की तैयार मात्राएँ।"
      },
      "roli-chawal-kalava-set": {
        "name": "रोली, चावल और कलावा सेट",
        "description": "किसी भी समारोह के लिए आवश्यक तिलक सेट — रोली, अक्षत (चावल) और पवित्र कलावा धागा।"
      },
      "satyanarayan-puja-kit": {
        "name": "सत्यनारायण पूजा सामग्री किट",
        "description": "सत्यनारायण कथा के लिए आवश्यक सभी वस्तुओं के साथ संपूर्ण किट — रोली, कलावा, सुपारी, पंचामृत सामग्री, धूप, बत्ती और बहुत कुछ।"
      }
    },
    "te": {
      "agarbatti-dhoop-combo": {
        "name": "అగరబత్తి & ధూప్ కాంబో",
        "description": "సహజమైన చందనం మరియు మొగ్గ అగరబత్తి కప్ ధూప్‌తో — రోజువారీ పూజకు సుగంధభరితమైన కాంబో."
      },
      "akhand-jyoti-wicks": {
        "name": "అఖండ జ్యోతి కాటన్ వత్తులు (బత్తి)",
        "description": "అఖండ జ్యోతి మరియు దీపాల కోసం పొడవైన పత్తి వత్తులు — 100 ప్యాక్, నిలకడైన మంట కోసం సమంగా చుట్టబడినవి."
      },
      "brass-pooja-thali": {
        "name": "ఇత్తడి పూజ థాలీ సెట్",
        "description": "రోజువారీ మరియు పండుగ పూజల కోసం కటోరి, గంట, అగరబత్తి స్టాండ్ మరియు చెంచాతో చేతితో తయారు చేసిన ఇత్తడి థాలీ."
      },
      "cow-ghee-diya-set-12": {
        "name": "స్వచ్ఛమైన ఆవు నెయ్యి దీపం సెట్ (12 pcs)",
        "description": "పత్తి వత్తులతో వెలిగించడానికి సిద్ధంగా ఉన్న 12 స్వచ్ఛమైన ఆవు నెయ్యి దీపాల సెట్ — పొగ లేనివి మరియు ఎక్కువసేపు వెలిగేవి."
      },
      "griha-pravesh-kit": {
        "name": "గృహ ప్రవేశ సామగ్రి కిట్",
        "description": "సంప్రదాయ గృహ ప్రవేశ పూజకు అవసరమైన ప్రతిదీ, చక్కగా ప్యాక్ చేసి తాజాగా అందించబడుతుంది."
      },
      "havan-samagri-500g": {
        "name": "హోమం సామగ్రి (500g)",
        "description": "గుగ్గిలం, యవలు మరియు సుగంధ మూలికలతో కూడిన ప్రీమియం మూలికా హోమం సామగ్రి మిశ్రమం — సుగంధభరితమైన, స్వచ్ఛమైన హోమం కోసం."
      },
      "kapur-camphor-pack": {
        "name": "కర్పూరం (కపూర్) ప్యాక్ — 100g",
        "description": "ఆరతి మరియు హోమం కోసం స్వచ్ఛమైన శుద్ధి చేసిన కర్పూరం బిళ్లలు, తాజాదనం కోసం విడిగా సీల్ చేయబడ్డాయి."
      },
      "lakshmi-ganesh-diwali-kit": {
        "name": "లక్ష్మీ-గణేశ్ దీపావళి పూజ కిట్",
        "description": "దీపాలు, వత్తులు, రోలి, అక్షింతలు మరియు ఎండు ఫలాల ప్రసాదంతో లక్ష్మీ-గణేశ్ పూజ కోసం పండుగ దీపావళి పూజ కిట్."
      },
      "navagraha-shanti-kit": {
        "name": "నవగ్రహ శాంతి సామగ్రి కిట్",
        "description": "నవగ్రహ శాంతి మరియు హోమం కోసం తొమ్మిది ధాన్యాలు మరియు మూలికల కిట్, వేద విధానం ప్రకారం సేకరించబడింది."
      },
      "panchamrit-kit": {
        "name": "పంచామృత కిట్",
        "description": "అభిషేకం కోసం పంచామృతం తయారు చేయడానికి పాల పొడి, పెరుగు, తేనె, నెయ్యి మరియు చక్కెర సిద్ధమైన కొలతలు."
      },
      "roli-chawal-kalava-set": {
        "name": "రోలి, చావల్ & కలావ సెట్",
        "description": "ఏ వేడుకకైనా అవసరమైన తిలక సెట్ — రోలి, అక్షింతలు (చావల్) మరియు పవిత్ర కలావ దారం."
      },
      "satyanarayan-puja-kit": {
        "name": "సత్యనారాయణ పూజ సామగ్రి కిట్",
        "description": "సత్యనారాయణ కథకు అవసరమైన అన్ని వస్తువులతో కూడిన పూర్తి కిట్ — రోలి, కలావ, వక్క, పంచామృత పదార్థాలు, ధూప్, బత్తి మరియు మరిన్ని."
      }
    }
  };

// Returns the product with translations for `locale` merged over the canonical
// English fields. A no-op for English or untranslated entries.
export function localizeProduct(product: StoreProduct, locale: Locale): StoreProduct {
  const tr = DATA[locale]?.[product.slug];
  if (!tr) return product;
  const merged: StoreProduct = { ...product };
  (Object.keys(tr) as (keyof StoreProductText)[]).forEach((k) => {
    const v = tr[k];
    if (v !== undefined) {
      (merged[k] as StoreProductText[typeof k]) = v;
    }
  });
  return merged;
}
