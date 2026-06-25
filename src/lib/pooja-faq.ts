// Per-pooja FAQ generation — pure, derived from the catalog entry so every pooja
// page gets relevant Q&A (also emitted as FAQPage schema.org for SEO). The copy
// is localized via the i18n dictionary (faq.* keys); pass a bound translator.

import { type Pooja, formatINR, getSamagriKitPrice, languages } from "@/lib/poojas";
import { type Translator } from "@/lib/i18n";

export type Faq = { question: string; answer: string };

export function poojaFaqs(pooja: Pooja, t: Translator): Faq[] {
  const name = pooja.name;
  const vars = {
    name,
    price: formatINR(pooja.startingPrice),
    kit: formatINR(getSamagriKitPrice(pooja)),
    h: pooja.durationHours,
    langs: languages.slice(0, 6).join(", "),
  };
  return [
    { question: t("faq.costQ", vars), answer: t("faq.costA", vars) },
    { question: t("faq.durQ", vars), answer: t("faq.durA", vars) },
    {
      question: t("faq.muhuratQ", vars),
      answer: pooja.requiresMuhurat
        ? t("faq.muhuratYesA", vars)
        : t("faq.muhuratNoA", vars),
    },
    { question: t("faq.langQ", vars), answer: t("faq.langA", vars) },
    { question: t("faq.samagriQ", vars), answer: t("faq.samagriA", vars) },
    { question: t("faq.verifiedQ", vars), answer: t("faq.verifiedA", vars) },
  ];
}
