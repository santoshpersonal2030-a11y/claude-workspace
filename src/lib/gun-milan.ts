// Ashtakoot (Gun-Milan) marriage compatibility — the eight kootas totalling 36
// gunas, computed from each person's Moon nakshatra (1–27) and rashi (0–11).
// Pure & dependency-free (so it's unit-tested and import-free). Indicative: the
// detailed milan, including dosha cancellation, is for an astrologer to confirm.

export type Person = { nakshatra: number; rashi: number }; // nakshatra 1-27, rashi 0-11

export type Koot = { name: string; max: number; score: number; note: string };
export type MilanResult = {
  koots: Koot[];
  total: number;
  max: number;
  nadiDosha: boolean;
  bhakootDosha: boolean;
  verdict: string;
};

const ni = (n: number) => Math.min(26, Math.max(0, n - 1)); // nakshatra → 0-based index

// ── Per-nakshatra attributes (0-based) ──────────────────────────────────────
// Yoni animal (14 yonis): 0 Horse,1 Elephant,2 Sheep,3 Serpent,4 Dog,5 Cat,
// 6 Rat,7 Cow,8 Buffalo,9 Tiger,10 Deer,11 Monkey,12 Mongoose,13 Lion.
const NAK_YONI = [0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,10,10,4,11,12,11,13,0,13,7,1];
// Enemy yoni pairs (mutual 0 score).
const YONI_ENEMY: Record<number, number> = {
  7: 9, 9: 7, // Cow–Tiger
  1: 13, 13: 1, // Elephant–Lion
  0: 8, 8: 0, // Horse–Buffalo
  2: 11, 11: 2, // Sheep–Monkey
  3: 12, 12: 3, // Serpent–Mongoose
  4: 10, 10: 4, // Dog–Deer
  5: 6, 6: 5, // Cat–Rat
};
// Gana: 0 Deva, 1 Manushya, 2 Rakshasa.
const NAK_GANA = [0,1,2,1,0,1,0,0,2,2,1,1,0,2,0,2,0,2,2,1,1,0,2,2,1,1,0];
// Nadi: 0 Aadi, 1 Madhya, 2 Antya.
const NAK_NADI = [0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2];

// ── Per-rashi attributes (0-based: Mesha..Meena) ─────────────────────────────
// Varna rank: 4 Brahmin, 3 Kshatriya, 2 Vaishya, 1 Shudra.
const RASHI_VARNA = [3,2,1,4,3,2,1,4,3,2,1,4];
// Vashya group: 0 Chatushpada, 1 Manava, 2 Jalachara, 3 Vanchara, 4 Keeta.
const RASHI_VASHYA = [0,0,1,2,3,1,1,4,1,2,1,2];
// Rashi lord planet: 0 Sun,1 Moon,2 Mars,3 Mercury,4 Jupiter,5 Venus,6 Saturn.
const RASHI_LORD = [2,5,3,1,0,3,5,2,4,6,6,4];

// Natural planetary relation: 2 friend, 1 neutral, 0 enemy (index by planet).
const PLANET_REL: number[][] = [
  // Sun  Moon Mars Merc Jup  Ven  Sat
  [2, 2, 2, 1, 2, 0, 0], // Sun
  [2, 2, 1, 2, 1, 1, 1], // Moon
  [2, 2, 2, 0, 2, 1, 1], // Mars
  [2, 0, 1, 2, 1, 2, 1], // Mercury
  [2, 2, 2, 0, 2, 0, 1], // Jupiter
  [0, 0, 1, 2, 1, 2, 2], // Venus
  [0, 0, 0, 2, 1, 2, 2], // Saturn
];

function varnaKoot(boy: Person, girl: Person): Koot {
  const ok = RASHI_VARNA[boy.rashi] >= RASHI_VARNA[girl.rashi];
  return { name: "Varna", max: 1, score: ok ? 1 : 0, note: "Spiritual/ego compatibility" };
}

function vashyaKoot(boy: Person, girl: Person): Koot {
  const a = RASHI_VASHYA[boy.rashi];
  const b = RASHI_VASHYA[girl.rashi];
  // Indicative: full points for the same group, partial otherwise (Vanchara is
  // the least controllable).
  const score = a === b ? 2 : a === 3 || b === 3 ? 0.5 : 1;
  return { name: "Vashya", max: 2, score, note: "Mutual control & magnetism" };
}

function taraKoot(boy: Person, girl: Person): Koot {
  const dir = (from: number, to: number) => {
    const c = ((to - from + 27) % 27) + 1;
    const r = c % 9;
    return !(r === 3 || r === 5 || r === 7); // inauspicious remainders
  };
  const good =
    (dir(girl.nakshatra, boy.nakshatra) ? 1.5 : 0) +
    (dir(boy.nakshatra, girl.nakshatra) ? 1.5 : 0);
  return { name: "Tara", max: 3, score: good, note: "Health & destiny" };
}

function yoniKoot(boy: Person, girl: Person): Koot {
  const a = NAK_YONI[ni(boy.nakshatra)];
  const b = NAK_YONI[ni(girl.nakshatra)];
  const score = a === b ? 4 : YONI_ENEMY[a] === b ? 0 : 2;
  return { name: "Yoni", max: 4, score, note: "Intimacy & temperament" };
}

function grahaMaitriKoot(boy: Person, girl: Person): Koot {
  const p = RASHI_LORD[boy.rashi];
  const q = RASHI_LORD[girl.rashi];
  let score: number;
  if (p === q) score = 5;
  else {
    const r1 = PLANET_REL[p][q];
    const r2 = PLANET_REL[q][p];
    const sum = r1 + r2;
    if (sum === 4) score = 5; // both friends
    else if (sum === 3) score = 4; // friend + neutral
    else if (sum === 2 && r1 === 1) score = 3; // both neutral
    else if (sum === 2) score = 0.5; // friend + enemy
    else if (sum === 1) score = 1; // neutral + enemy
    else score = 0; // both enemies
  }
  return { name: "Graha Maitri", max: 5, score, note: "Mental affinity & friendship" };
}

const GANA_MATRIX = [
  // bride: Deva Manushya Rakshasa   (rows = groom)
  [6, 6, 1], // Deva
  [5, 6, 0], // Manushya
  [1, 0, 6], // Rakshasa
];
function ganaKoot(boy: Person, girl: Person): Koot {
  const score = GANA_MATRIX[NAK_GANA[ni(boy.nakshatra)]][NAK_GANA[ni(girl.nakshatra)]];
  return { name: "Gana", max: 6, score, note: "Temperament & conduct" };
}

function bhakootKoot(boy: Person, girl: Person): { koot: Koot; dosha: boolean } {
  const a = ((girl.rashi - boy.rashi + 12) % 12) + 1;
  const b = ((boy.rashi - girl.rashi + 12) % 12) + 1;
  const pair = [a, b].sort((x, y) => x - y).join("-");
  const dosha = pair === "6-8" || pair === "2-12" || pair === "5-9";
  return {
    koot: { name: "Bhakoot", max: 7, score: dosha ? 0 : 7, note: "Family & prosperity" },
    dosha,
  };
}

function nadiKoot(boy: Person, girl: Person): { koot: Koot; dosha: boolean } {
  const dosha = NAK_NADI[ni(boy.nakshatra)] === NAK_NADI[ni(girl.nakshatra)];
  return {
    koot: { name: "Nadi", max: 8, score: dosha ? 0 : 8, note: "Health & progeny" },
    dosha,
  };
}

export function ashtakootMilan(boy: Person, girl: Person): MilanResult {
  const bhakoot = bhakootKoot(boy, girl);
  const nadi = nadiKoot(boy, girl);
  const koots = [
    varnaKoot(boy, girl),
    vashyaKoot(boy, girl),
    taraKoot(boy, girl),
    yoniKoot(boy, girl),
    grahaMaitriKoot(boy, girl),
    ganaKoot(boy, girl),
    bhakoot.koot,
    nadi.koot,
  ];
  const total = koots.reduce((s, k) => s + k.score, 0);
  const verdict =
    nadi.dosha
      ? "Nadi dosha present — an astrologer should review remedies before proceeding."
      : total >= 28
        ? "Excellent match"
        : total >= 24
          ? "Very good match"
          : total >= 18
            ? "Acceptable match"
            : "Low score — best reviewed by an astrologer";
  return {
    koots,
    total,
    max: 36,
    nadiDosha: nadi.dosha,
    bhakootDosha: bhakoot.dosha,
    verdict,
  };
}
