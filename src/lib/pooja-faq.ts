// Per-pooja FAQ generation — pure, derived from the catalog entry so every pooja
// page gets relevant Q&A (also emitted as FAQPage schema.org for SEO).

import { type Pooja, formatINR, getSamagriKitPrice, languages } from "@/lib/poojas";

export type Faq = { question: string; answer: string };

export function poojaFaqs(pooja: Pooja): Faq[] {
  const hrs = pooja.durationHours;
  const dur = `${hrs} hour${hrs > 1 ? "s" : ""}`;
  const faqs: Faq[] = [
    {
      question: `How much does ${pooja.name} cost?`,
      answer:
        `The ${pooja.name} starts at ${formatINR(pooja.startingPrice)} as the Pandit's ` +
        `dakshina/service. You can optionally add an authentic samagri kit ` +
        `(from ${formatINR(getSamagriKitPrice(pooja))}), delivered to your door. ` +
        `Final pricing depends on your city, the Pandit's experience and any travel.`,
    },
    {
      question: `How long does the ${pooja.name} take?`,
      answer:
        `The ${pooja.name} usually takes about ${dur}, though the exact duration ` +
        `varies with family customs and the rituals you choose to include.`,
    },
    {
      question: `Does ${pooja.name} need an auspicious muhurat?`,
      answer: pooja.requiresMuhurat
        ? `Yes — ${pooja.name} is best performed at an auspicious muhurat. After you ` +
          `book, our Pandit confirms the exact date and time with you based on the ` +
          `panchang. You can also browse computed muhurats on our Shubh Muhurat page.`
        : `No — ${pooja.name} has flexible timing, so you can pick any available slot ` +
          `that suits your family.`,
    },
    {
      question: "Will the Pandit perform it in my language?",
      answer:
        `Yes. Our verified Pandits perform ceremonies in ${languages.slice(0, 6).join(", ")} ` +
        `and more — just choose your preferred language when booking.`,
    },
    {
      question: "Do I need to arrange the samagri?",
      answer:
        "You don't have to. Add our authentic samagri kit at checkout and we'll " +
        "deliver everything needed for the ceremony, or arrange it yourself if you prefer.",
    },
    {
      question: "Are the Pandits verified?",
      answer:
        "Every Pandit on BookMyPoojari is verified and experienced, and performs the " +
        "rituals strictly as per Vedic tradition.",
    },
  ];
  return faqs;
}
