import {
  moonSign,
  sunRashi,
  panchangaAt,
  NAKSHATRAS,
  WEEKDAY_NAMES,
  weekdayOf,
} from "@/lib/muhurat-engine";

// Free "Janma Kundli (lite)" — sun sign, moon sign, nakshatra and birth tithi
// derived from the existing astronomy engine. Pure, so it runs client-side for
// an instant, no-login result. A full charted kundli (lagna, houses, dashas) is
// the paid consultation; this is the lead magnet.

export const RASHI_NAMES = [
  "Mesha (Aries)",
  "Vrishabha (Taurus)",
  "Mithuna (Gemini)",
  "Karka (Cancer)",
  "Simha (Leo)",
  "Kanya (Virgo)",
  "Tula (Libra)",
  "Vrishchika (Scorpio)",
  "Dhanu (Sagittarius)",
  "Makara (Capricorn)",
  "Kumbha (Aquarius)",
  "Meena (Pisces)",
];

// A short moon-sign trait note (0-based: Mesha..Meena).
export const RASHI_TRAITS = [
  "Bold, energetic and pioneering — you lead from the front.",
  "Steady, patient and grounded — you value comfort and loyalty.",
  "Curious, expressive and quick-witted — you thrive on variety.",
  "Caring, intuitive and protective — home and family matter most.",
  "Confident, warm and generous — you're a natural centre of attention.",
  "Practical, analytical and helpful — you notice the details others miss.",
  "Balanced, charming and fair — you seek harmony in all things.",
  "Intense, determined and perceptive — you feel everything deeply.",
  "Optimistic, free-spirited and philosophical — you love to explore.",
  "Disciplined, ambitious and reliable — you build for the long term.",
  "Original, humane and independent — you think ahead of your time.",
  "Compassionate, imaginative and gentle — you live from the heart.",
];

export type Kundli = {
  sunRashi: string;
  moonRashi: string;
  moonRashiIndex: number; // 0-11
  moonTrait: string;
  nakshatra: string;
  nakshatraIndex: number; // 1-27
  tithi: string;
  weekday: string;
};

// `birthTime` is "HH:MM" (IST). Defaults to midday when unknown — the moon can
// shift ~13°/day, so an accurate time sharpens the moon sign/nakshatra.
export function computeKundli(date: string, birthTime?: string): Kundli | null {
  let hour = 12;
  if (birthTime && /^\d{1,2}:\d{2}$/.test(birthTime)) {
    const [h, m] = birthTime.split(":").map(Number);
    hour = h + m / 60;
  }
  const moon = moonSign(date, hour);
  if (!moon) return null;
  const p = panchangaAt(date, hour);
  return {
    sunRashi: sunRashi(date, hour),
    moonRashi: RASHI_NAMES[moon.rashi],
    moonRashiIndex: moon.rashi,
    moonTrait: RASHI_TRAITS[moon.rashi],
    nakshatra: NAKSHATRAS[moon.nakshatra - 1],
    nakshatraIndex: moon.nakshatra,
    tithi: p?.tithiName ?? "",
    weekday: WEEKDAY_NAMES[weekdayOf(date)],
  };
}
