// Daily horoscope — a free, SEO-friendly lead magnet. Predictions are generated
// deterministically from the date + sign (stable for the whole day, identical
// for every visitor, no external API), drawn from curated fragment pools.

export type Sign = {
  slug: string;
  name: string;
  symbol: string;
  dates: string;
  element: "Fire" | "Earth" | "Air" | "Water";
  ruler: string;
};

export const SIGNS: Sign[] = [
  { slug: "aries", name: "Aries", symbol: "♈", dates: "Mar 21 – Apr 19", element: "Fire", ruler: "Mars" },
  { slug: "taurus", name: "Taurus", symbol: "♉", dates: "Apr 20 – May 20", element: "Earth", ruler: "Venus" },
  { slug: "gemini", name: "Gemini", symbol: "♊", dates: "May 21 – Jun 20", element: "Air", ruler: "Mercury" },
  { slug: "cancer", name: "Cancer", symbol: "♋", dates: "Jun 21 – Jul 22", element: "Water", ruler: "Moon" },
  { slug: "leo", name: "Leo", symbol: "♌", dates: "Jul 23 – Aug 22", element: "Fire", ruler: "Sun" },
  { slug: "virgo", name: "Virgo", symbol: "♍", dates: "Aug 23 – Sep 22", element: "Earth", ruler: "Mercury" },
  { slug: "libra", name: "Libra", symbol: "♎", dates: "Sep 23 – Oct 22", element: "Air", ruler: "Venus" },
  { slug: "scorpio", name: "Scorpio", symbol: "♏", dates: "Oct 23 – Nov 21", element: "Water", ruler: "Mars/Pluto" },
  { slug: "sagittarius", name: "Sagittarius", symbol: "♐", dates: "Nov 22 – Dec 21", element: "Fire", ruler: "Jupiter" },
  { slug: "capricorn", name: "Capricorn", symbol: "♑", dates: "Dec 22 – Jan 19", element: "Earth", ruler: "Saturn" },
  { slug: "aquarius", name: "Aquarius", symbol: "♒", dates: "Jan 20 – Feb 18", element: "Air", ruler: "Saturn" },
  { slug: "pisces", name: "Pisces", symbol: "♓", dates: "Feb 19 – Mar 20", element: "Water", ruler: "Jupiter" },
];

export function getSign(slug: string): Sign | undefined {
  return SIGNS.find((s) => s.slug === slug);
}

const OVERALL = [
  "A favourable day — momentum builds in something you've been nurturing quietly.",
  "Slow down and observe; clarity arrives once you stop forcing the outcome.",
  "Your energy is magnetic today — people are drawn to your confidence.",
  "An unexpected message reshapes your plans for the better.",
  "Patience is your ally; a delay today saves trouble tomorrow.",
  "A small act of generosity returns to you multiplied.",
  "Trust your instincts over others' opinions on a key decision.",
  "Finances and focus align — a good day to plan, not splurge.",
  "Old worries loosen their grip; you feel lighter by evening.",
  "Communication flows easily — speak the thing you've been holding back.",
  "A spiritual pause — a diya, a prayer, a deep breath — steadies the whole day.",
  "Hard work quietly pays off; recognition is closer than it looks.",
];

const LOVE = [
  "Warmth returns to a close relationship — a kind word goes far.",
  "Single? A familiar face may surprise you. Coupled? Plan something simple together.",
  "Listen more than you speak today; your partner needs to feel heard.",
  "An honest conversation clears the air and deepens trust.",
  "Give space where there's tension — it returns as closeness.",
  "Family bonds feel especially nourishing today.",
  "A gesture of affection, however small, lands perfectly.",
  "Don't read too much into silence — ask, don't assume.",
];

const CAREER = [
  "A task you've avoided turns out easier than feared — start it.",
  "Collaboration beats going solo today; share the load.",
  "Keep records and double-check details — precision protects you.",
  "A senior notices your effort; stay consistent.",
  "Avoid big commitments before noon; clarity improves later.",
  "A creative idea deserves to be written down and pitched.",
  "Network gently — a casual chat opens a real door.",
  "Finish, don't start — closing a loop frees your mind.",
];

const HEALTH = [
  "Hydrate and rest your eyes — small habits, big difference.",
  "A short walk clears both body and mind.",
  "Mind your posture and breathe deeply through stress.",
  "Light, warm food suits you better than heavy meals today.",
  "Sleep is your best medicine tonight — wind down early.",
  "Stretch in the morning; your energy will thank you by evening.",
];

const MOODS = ["Optimistic", "Reflective", "Energetic", "Calm", "Focused", "Tender", "Resilient", "Playful"];
const COLORS = ["Saffron", "Marigold Gold", "Deep Maroon", "Emerald", "Sky Blue", "Ivory", "Rose", "Turmeric Yellow"];

export type DailyHoroscope = {
  overall: string;
  love: string;
  career: string;
  health: string;
  mood: string;
  luckyColor: string;
  luckyNumber: number;
};

function pick<T>(arr: T[], date: string, signIdx: number, salt: number): T {
  let h = signIdx * 131 + salt * 977 + 7;
  for (let i = 0; i < date.length; i++) {
    h = (h * 33 + date.charCodeAt(i)) % 1_000_003;
  }
  return arr[Math.abs(h) % arr.length];
}

export function dailyHoroscope(signIdx: number, date: string): DailyHoroscope {
  return {
    overall: pick(OVERALL, date, signIdx, 1),
    love: pick(LOVE, date, signIdx, 2),
    career: pick(CAREER, date, signIdx, 3),
    health: pick(HEALTH, date, signIdx, 4),
    mood: pick(MOODS, date, signIdx, 5),
    luckyColor: pick(COLORS, date, signIdx, 6),
    luckyNumber: (Math.abs(signIdx * 17 + date.charCodeAt(date.length - 1) * 3) % 9) + 1,
  };
}
