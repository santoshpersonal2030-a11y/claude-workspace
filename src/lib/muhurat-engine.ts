// Pure, dependency-free muhurat computation — NO external API.
//
// From a date + location it computes sunrise/sunset (sunrise-equation /
// Almanac algorithm, accurate to ~1 min for Indian latitudes) and derives the
// classical day-based periods used in panchang:
//   • Abhijit Muhurat — the auspicious 8th of 15 muhurtas around solar noon.
//   • Rahu Kalam / Yamaganda / Gulika Kalam — inauspicious eighths of the day,
//     selected by weekday, that ceremonies should AVOID.
//
// These are deterministic solar calculations (not fabricated dates), so they
// can seed muhurat_windows as candidates. Full tithi/nakshatra-based muhurats
// (e.g. specific wedding dates) still need a lunar ephemeris source.

const RAD = Math.PI / 180;
const IST_OFFSET_HOURS = 5.5;
const ZENITH = 90.833; // official sunrise/sunset (with refraction)

// Major Indian cities → [latitude, longitude(+E)]. Used to anchor the solar
// calculation; the list covers the regions our priests currently serve.
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "New Delhi": { lat: 28.6139, lng: 77.209 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Surat: { lat: 21.1702, lng: 72.8311 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
  Kanpur: { lat: 26.4499, lng: 80.3319 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Varanasi: { lat: 25.3176, lng: 82.9739 },
  Nashik: { lat: 19.9975, lng: 73.7898 },
};

function dayOfYear(year: number, month: number, day: number): number {
  const n1 = Math.floor((275 * month) / 9);
  const n2 = Math.floor((month + 9) / 12);
  const n3 = 1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3);
  return n1 - n2 * n3 + day - 30;
}

// Weekday (0=Sun … 6=Sat) for a calendar date, TZ-independent.
export function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

// Minutes-from-local-midnight (IST) of sunrise or sunset, or null on polar
// edge cases (never for India). Sunrise/Sunset Algorithm (Almanac / Ed Williams).
function sunEventMinutes(
  year: number,
  month: number,
  day: number,
  lat: number,
  lng: number,
  rising: boolean,
): number | null {
  const N = dayOfYear(year, month, day);
  const lngHour = lng / 15;
  const t = N + ((rising ? 6 : 18) - lngHour) / 24;

  // Sun's mean anomaly → true longitude.
  const M = 0.9856 * t - 3.289;
  let L =
    M +
    1.916 * Math.sin(M * RAD) +
    0.02 * Math.sin(2 * M * RAD) +
    282.634;
  L = ((L % 360) + 360) % 360;

  // Right ascension, put in the same quadrant as L.
  let RA = Math.atan(0.91764 * Math.tan(L * RAD)) / RAD;
  RA = ((RA % 360) + 360) % 360;
  const Lquad = Math.floor(L / 90) * 90;
  const RAquad = Math.floor(RA / 90) * 90;
  RA = (RA + (Lquad - RAquad)) / 15;

  // Declination.
  const sinDec = 0.39782 * Math.sin(L * RAD);
  const cosDec = Math.cos(Math.asin(sinDec));

  const cosH =
    (Math.cos(ZENITH * RAD) - sinDec * Math.sin(lat * RAD)) /
    (cosDec * Math.cos(lat * RAD));
  if (cosH > 1 || cosH < -1) return null; // sun never rises/sets

  let H = Math.acos(cosH) / RAD;
  if (rising) H = 360 - H;
  H = H / 15;

  const T = H + RA - 0.06571 * t - 6.622;
  let UT = T - lngHour;
  UT = ((UT % 24) + 24) % 24;

  const local = UT + IST_OFFSET_HOURS;
  return (((local % 24) + 24) % 24) * 60;
}

export type Period = { start: number; end: number }; // minutes from midnight (IST)

export type DayPeriods = {
  sunrise: number;
  sunset: number;
  abhijit: Period;
  rahu: Period;
  yamaganda: Period;
  gulika: Period;
};

// Which eighth (0-based, from sunrise) is inauspicious, indexed by weekday.
const RAHU = [7, 1, 6, 4, 5, 3, 2];
const YAMAGANDA = [4, 3, 2, 1, 0, 6, 5];
const GULIKA = [6, 5, 4, 3, 2, 1, 0];

export function computeDayPeriods(
  dateStr: string,
  lat: number,
  lng: number,
): DayPeriods | null {
  const [y, m, d] = dateStr.split("-").map(Number);
  const sunrise = sunEventMinutes(y, m, d, lat, lng, true);
  const sunset = sunEventMinutes(y, m, d, lat, lng, false);
  if (sunrise == null || sunset == null || sunset <= sunrise) return null;

  const dayLen = sunset - sunrise;
  const muhurta = dayLen / 15;
  const eighth = dayLen / 8;
  const wd = weekdayOf(dateStr);
  const part = (i: number): Period => ({
    start: sunrise + i * eighth,
    end: sunrise + (i + 1) * eighth,
  });

  return {
    sunrise,
    sunset,
    // Abhijit = 8th muhurta of 15 (0-based index 7), straddling solar noon.
    abhijit: { start: sunrise + 7 * muhurta, end: sunrise + 8 * muhurta },
    rahu: part(RAHU[wd]),
    yamaganda: part(YAMAGANDA[wd]),
    gulika: part(GULIKA[wd]),
  };
}

// Minutes-from-midnight → "HH:MM" (24h).
export function minutesToHHMM(mins: number): string {
  const total = Math.round(mins);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ── Lunar engine: tithi & nakshatra ─────────────────────────────────────────
// Geocentric ecliptic longitudes of the Sun and Moon via a compact perturbation
// series (Schlyter), validated to ~1 arcmin against Meeus' reference — ample for
// tithi (12° wide) and nakshatra (13°20'). Pure math, no ephemeris file/API.

const rev = (x: number) => ((x % 360) + 360) % 360;
const sinD = (x: number) => Math.sin(x * RAD);
const cosD = (x: number) => Math.cos(x * RAD);

// Days since the J2000.0 epoch used by Schlyter's elements, for a UT instant.
function dayNumber(
  y: number,
  m: number,
  d: number,
  utHours: number,
): number {
  return (
    367 * y -
    Math.floor((7 * (y + Math.floor((m + 9) / 12))) / 4) +
    Math.floor((275 * m) / 9) +
    d -
    730530 +
    utHours / 24
  );
}

function sunData(dn: number): { lon: number; M: number } {
  const w = 282.9404 + 4.70935e-5 * dn;
  const e = 0.016709 - 1.151e-9 * dn;
  const M = rev(356.047 + 0.9856002585 * dn);
  const E = M + (180 / Math.PI) * e * sinD(M) * (1 + e * cosD(M));
  const xv = cosD(E) - e;
  const yv = Math.sqrt(1 - e * e) * sinD(E);
  const v = rev((Math.atan2(yv, xv) * 180) / Math.PI);
  return { lon: rev(v + w), M };
}

function moonLongitude(dn: number): number {
  const N = rev(125.1228 - 0.0529538083 * dn);
  const i = 5.1454;
  const w = rev(318.0634 + 0.1643573223 * dn);
  const a = 60.2666;
  const e = 0.0549;
  const M = rev(115.3654 + 13.0649929509 * dn);

  let E = M + (180 / Math.PI) * e * sinD(M) * (1 + e * cosD(M));
  for (let k = 0; k < 5; k++) {
    E = E - (E - (180 / Math.PI) * e * sinD(E) - M) / (1 - e * cosD(E));
  }
  const xv = a * (cosD(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * sinD(E));
  const v = rev((Math.atan2(yv, xv) * 180) / Math.PI);
  const r = Math.sqrt(xv * xv + yv * yv);
  const xh = r * (cosD(N) * cosD(v + w) - sinD(N) * sinD(v + w) * cosD(i));
  const yh = r * (sinD(N) * cosD(v + w) + cosD(N) * sinD(v + w) * cosD(i));
  let lon = rev((Math.atan2(yh, xh) * 180) / Math.PI);

  const sun = sunData(dn);
  const Ls = rev(sun.M + 282.9404 + 4.70935e-5 * dn);
  const Ms = sun.M;
  const Lm = rev(N + w + M);
  const Dm = rev(Lm - Ls);
  const Mm = M;
  const F = rev(Lm - N);

  lon +=
    -1.274 * sinD(Mm - 2 * Dm) +
    0.658 * sinD(2 * Dm) -
    0.186 * sinD(Ms) -
    0.059 * sinD(2 * Mm - 2 * Dm) -
    0.057 * sinD(Mm - 2 * Dm + Ms) +
    0.053 * sinD(Mm + 2 * Dm) +
    0.046 * sinD(2 * Dm - Ms) +
    0.041 * sinD(Mm - Ms) -
    0.035 * sinD(Dm) -
    0.031 * sinD(Mm + Ms) -
    0.015 * sinD(2 * F - 2 * Dm) +
    0.011 * sinD(Mm - 4 * Dm);
  return rev(lon);
}

// Approximate Lahiri ayanamsa (sidereal correction) for a year — linear fit,
// good to ~0.1°, which is well inside a nakshatra's width.
function lahiriAyanamsa(year: number): number {
  return 23.85 + (year - 2000) * 0.0139694;
}

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
  "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
  "Jyeshtha", "Moola", "Purva Ashadha", "Uttara Ashadha", "Shravana",
  "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

const TITHI_NAMES = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
  "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
  "Trayodashi", "Chaturdashi",
];

export function tithiName(tithi: number): string {
  if (tithi === 15) return "Purnima";
  if (tithi === 30) return "Amavasya";
  const paksha = tithi <= 15 ? "Shukla" : "Krishna";
  const idx = (tithi <= 15 ? tithi : tithi - 15) - 1;
  return `${paksha} ${TITHI_NAMES[idx]}`;
}

export type Panchanga = {
  tithi: number; // 1..30
  tithiName: string;
  nakshatra: number; // 1..27
  nakshatraName: string;
  sunLon: number;
  moonLon: number;
};

// Tithi & nakshatra prevailing at a given IST date + hour (default midday).
export function panchangaAt(
  dateStr: string,
  istHour = 12,
): Panchanga | null {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dn = dayNumber(y, m, d, istHour - IST_OFFSET_HOURS);
  const sunLon = sunData(dn).lon;
  const moonLon = moonLongitude(dn);

  const tithi = Math.floor(rev(moonLon - sunLon) / 12) + 1;
  const sidMoon = rev(moonLon - lahiriAyanamsa(y));
  const nakshatra = Math.floor(sidMoon / (360 / 27)) + 1;

  return {
    tithi,
    tithiName: tithiName(tithi),
    nakshatra,
    nakshatraName: NAKSHATRAS[nakshatra - 1],
    sunLon,
    moonLon,
  };
}

// Nakshatras traditionally favourable for Vivah (marriage).
const VIVAH_NAKSHATRAS = new Set([4, 5, 10, 12, 13, 15, 17, 19, 21, 26, 27]);
// Tithis avoided for marriage (Rikta tithis + Amavasya).
const FORBIDDEN_TITHIS = new Set([4, 9, 14, 19, 24, 29, 30]);

export function isAuspiciousForVivah(p: Panchanga): boolean {
  return VIVAH_NAKSHATRAS.has(p.nakshatra) && !FORBIDDEN_TITHIS.has(p.tithi);
}

// ── Masa & planetary exclusions (stricter Vivah filter) ─────────────────────

const RASHIS = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula",
  "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
];

// Generic Schlyter heliocentric→geocentric ecliptic longitude for a planet.
type OrbElements = {
  N: number; i: number; w: number; a: number; e: number; M: number;
};

function geocentricLon(dn: number, el: OrbElements): number {
  const { N, i, w, a, e, M } = el;
  let E = M + (180 / Math.PI) * e * sinD(M) * (1 + e * cosD(M));
  for (let k = 0; k < 6; k++) {
    E = E - (E - (180 / Math.PI) * e * sinD(E) - M) / (1 - e * cosD(E));
  }
  const xv = a * (cosD(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * sinD(E));
  const v = rev((Math.atan2(yv, xv) * 180) / Math.PI);
  const r = Math.sqrt(xv * xv + yv * yv);
  // Heliocentric ecliptic rectangular (only x,y are needed for longitude).
  const xh = r * (cosD(N) * cosD(v + w) - sinD(N) * sinD(v + w) * cosD(i));
  const yh = r * (sinD(N) * cosD(v + w) + cosD(N) * sinD(v + w) * cosD(i));
  // Sun's geocentric rectangular = -(Earth heliocentric); add to get geocentric.
  const s = sunData(dn);
  const e_s = 0.016709 - 1.151e-9 * dn;
  const Es = s.M + (180 / Math.PI) * e_s * sinD(s.M) * (1 + e_s * cosD(s.M));
  const xvs = cosD(Es) - e_s;
  const yvs = Math.sqrt(1 - e_s * e_s) * sinD(Es);
  const rs = Math.sqrt(xvs * xvs + yvs * yvs);
  const xs = rs * cosD(s.lon);
  const ys = rs * sinD(s.lon);
  return rev((Math.atan2(yh + ys, xh + xs) * 180) / Math.PI);
}

function jupiterLon(dn: number): number {
  return geocentricLon(dn, {
    N: 100.4542 + 2.7685e-5 * dn,
    i: 1.303 - 1.557e-7 * dn,
    w: 273.8777 + 1.64505e-5 * dn,
    a: 5.20256,
    e: 0.048498 + 4.469e-9 * dn,
    M: rev(19.895 + 0.0830853001 * dn),
  });
}

function venusLon(dn: number): number {
  return geocentricLon(dn, {
    N: 76.6799 + 2.4659e-5 * dn,
    i: 3.3946 + 2.75e-8 * dn,
    w: 54.891 + 1.38374e-5 * dn,
    a: 0.72333,
    e: 0.006773 - 1.302e-9 * dn,
    M: rev(48.0052 + 1.6021302244 * dn),
  });
}

// Smallest angular separation (deg) between two ecliptic longitudes.
function separation(a: number, b: number): number {
  const d = Math.abs(rev(a - b));
  return Math.min(d, 360 - d);
}

// Combustion (asta) thresholds in degrees from the Sun.
const GURU_ASTA = 11;
const SHUKRA_ASTA = 10;

// Returns a reason a date is INauspicious for Vivah under the strict rule set,
// or null if it passes. Layers masa (Kharmas / approx Chaturmas) and planetary
// (Guru/Shukra asta) exclusions on top of the nakshatra/tithi check.
export function vivahExclusionReason(
  dateStr: string,
  istHour = 12,
): string | null {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y) return "invalid date";
  const dn = dayNumber(y, m, d, istHour - IST_OFFSET_HOURS);

  const sunLon = sunData(dn).lon;
  const moonLon = moonLongitude(dn);
  const tithi = Math.floor(rev(moonLon - sunLon) / 12) + 1;
  const ayan = lahiriAyanamsa(y);
  const nakshatra = Math.floor(rev(moonLon - ayan) / (360 / 27)) + 1;

  if (!VIVAH_NAKSHATRAS.has(nakshatra)) return "nakshatra not favourable";
  if (FORBIDDEN_TITHIS.has(tithi)) return `${tithiName(tithi)} tithi avoided`;

  // Solar month (sidereal Sun sign).
  const sidSun = rev(sunLon - ayan);
  const sunSign = Math.floor(sidSun / 30); // 0=Mesha … 11=Meena
  if (sunSign === 8) return "Kharmas (Sun in Dhanu)";
  if (sunSign === 11) return "Kharmas (Sun in Meena)";
  // Approximate Chaturmas: Sun sidereal ~Gemini 20° → Libra 15° (Devshayani→
  // Prabodhini), the monsoon no-wedding window.
  if (sidSun >= 80 && sidSun < 195) return "Chaturmas (Devshayani period)";

  // Planetary combustion (asta) — Guru/Shukra too close to the Sun.
  if (separation(jupiterLon(dn), sunLon) < GURU_ASTA) return "Guru asta (Jupiter combust)";
  if (separation(venusLon(dn), sunLon) < SHUKRA_ASTA) return "Shukra asta (Venus combust)";

  // Vishti (Bhadra) karana is avoided for auspicious work.
  const elong = rev(moonLon - sunLon);
  const k = Math.floor(elong / 6);
  if (k >= 1 && k <= 56 && (k - 1) % 7 === 6) return "Vishti (Bhadra) karana";

  return null;
}

// Sidereal Sun rashi name for a date (for candidate notes).
export function sunRashi(dateStr: string, istHour = 12): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dn = dayNumber(y, m, d, istHour - IST_OFFSET_HOURS);
  const sid = rev(sunData(dn).lon - lahiriAyanamsa(y));
  return RASHIS[Math.floor(sid / 30)];
}

// ── Karana (Vishti/Bhadra) ──────────────────────────────────────────────────
const KARANAS_MOVABLE = [
  "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti",
];

// The karana (half-tithi) at an instant. Vishti = Bhadra, which is avoided.
export function karanaAt(dateStr: string, istHour = 12): {
  name: string;
  isVishti: boolean;
} {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dn = dayNumber(y, m, d, istHour - IST_OFFSET_HOURS);
  const elong = rev(moonLongitude(dn) - sunData(dn).lon);
  const k = Math.floor(elong / 6); // 0..59
  let name: string;
  if (k === 0) name = "Kimstughna";
  else if (k >= 57) name = ["Shakuni", "Chatushpada", "Naga"][k - 57];
  else name = KARANAS_MOVABLE[(k - 1) % 7];
  return { name, isVishti: name === "Vishti" };
}

// ── Guru / Shukra Bala (planetary sign strength) ────────────────────────────
// Sign-based dignity for the marriage karakas. +2 exalted, +1 own, 0 neutral,
// -2 debilitated. (Combustion is handled separately as a hard exclusion.)
function signStrength(
  sign: number,
  exalt: number,
  debil: number,
  own: number[],
): number {
  if (sign === exalt) return 2;
  if (sign === debil) return -2;
  if (own.includes(sign)) return 1;
  return 0;
}

function guruBala(dn: number, ayan: number): number {
  const sign = Math.floor(rev(jupiterLon(dn) - ayan) / 30);
  return signStrength(sign, 3 /*Karka*/, 9 /*Makara*/, [8 /*Dhanu*/, 11 /*Meena*/]);
}

function shukraBala(dn: number, ayan: number): number {
  const sign = Math.floor(rev(venusLon(dn) - ayan) / 30);
  return signStrength(sign, 11 /*Meena*/, 5 /*Kanya*/, [1 /*Vrishabha*/, 6 /*Tula*/]);
}

// Best-of-class vivah nakshatras (carry a little extra weight in scoring).
const PRIME_NAKSHATRAS = new Set([4, 12, 21, 26, 27]); // Rohini, U.Phalguni, U.Ashadha, U.Bhadrapada, Revati
const GOOD_TITHIS = new Set([2, 3, 5, 7, 10, 11, 13]);
const GOOD_WEEKDAYS = new Set([1, 3, 4, 5]); // Mon, Wed, Thu, Fri

export type VivahQuality = { score: number; tier: string; factors: string[] };

// A 0–100 triage score for an (already non-excluded) vivah date, blending
// nakshatra/tithi/weekday quality with Guru & Shukra bala.
export function vivahQuality(dateStr: string, istHour = 12): VivahQuality {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dn = dayNumber(y, m, d, istHour - IST_OFFSET_HOURS);
  const ayan = lahiriAyanamsa(y);
  const sunLon = sunData(dn).lon;
  const moonLon = moonLongitude(dn);
  const tithi = Math.floor(rev(moonLon - sunLon) / 12) + 1;
  const nak = Math.floor(rev(moonLon - ayan) / (360 / 27)) + 1;
  const wd = weekdayOf(dateStr);
  const gb = guruBala(dn, ayan);
  const sb = shukraBala(dn, ayan);

  const factors: string[] = [];
  let score = 50;

  if (PRIME_NAKSHATRAS.has(nak)) { score += 12; factors.push(`${NAKSHATRAS[nak - 1]} (prime)`); }
  else { score += 6; factors.push(NAKSHATRAS[nak - 1]); }

  if (GOOD_TITHIS.has(tithi)) { score += 8; factors.push(`${tithiName(tithi)} ✓`); }

  if (GOOD_WEEKDAYS.has(wd)) { score += 8; factors.push("favourable weekday"); }
  else if (wd === 2 || wd === 6) { score -= 6; factors.push("Tue/Sat weekday"); }

  score += gb * 5;
  factors.push(`Guru bala ${gb >= 0 ? "+" : ""}${gb}`);
  score += sb * 5;
  factors.push(`Shukra bala ${sb >= 0 ? "+" : ""}${sb}`);

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, tier: tierFromScore(score), factors };
}

export type MuhuratCandidate = {
  date: string;
  start_time: string;
  end_time: string;
  label: string;
  note: string;
  quality_score?: number;
};

// Tier label for a 0-100 score (shared by the engine and the admin UI).
export function tierFromScore(score: number): "Excellent" | "Good" | "Fair" {
  return score >= 80 ? "Excellent" : score >= 65 ? "Good" : "Fair";
}

// Generates one Abhijit-Muhurat candidate per date in [from, to], with the
// inauspicious periods to avoid recorded in the note. `maxDays` guards range.
export function generateAbhijitCandidates(
  from: string,
  to: string,
  lat: number,
  lng: number,
  maxDays = 400,
): MuhuratCandidate[] {
  const out: MuhuratCandidate[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return out;

  for (
    let d = new Date(start), n = 0;
    d <= end && n < maxDays;
    d.setUTCDate(d.getUTCDate() + 1), n++
  ) {
    const dateStr = d.toISOString().slice(0, 10);
    const p = computeDayPeriods(dateStr, lat, lng);
    if (!p) continue;
    out.push({
      date: dateStr,
      start_time: minutesToHHMM(p.abhijit.start),
      end_time: minutesToHHMM(p.abhijit.end),
      label: "Abhijit Muhurat",
      note:
        `Auspicious midday window. Avoid Rahu Kalam ` +
        `${minutesToHHMM(p.rahu.start)}-${minutesToHHMM(p.rahu.end)}, ` +
        `Yamaganda ${minutesToHHMM(p.yamaganda.start)}-${minutesToHHMM(p.yamaganda.end)}, ` +
        `Gulika ${minutesToHHMM(p.gulika.start)}-${minutesToHHMM(p.gulika.end)}.`,
    });
  }
  return out;
}

// Generates Vivah (wedding) muhurat candidates: only dates whose nakshatra is
// favourable and tithi is not forbidden, each timed to that day's Abhijit
// window. Computed (tithi/nakshatra via the lunar engine) — candidates only,
// still gated by astrologer approval.
// ── Per-ceremony muhurat rule registry ──────────────────────────────────────
// Each muhurat-requiring ceremony has its own favourable nakshatras and the
// subset of masa/planetary exclusions that traditionally apply. Vivah and
// Griha Pravesh are the most restrictive; child sanskars mainly avoid bad
// nakshatra/tithi and Vishti.

export type MuhuratRuleSet = {
  name: string;
  nakshatras: Set<number>;
  forbiddenTithis: Set<number>;
  kharmas: boolean;
  chaturmas: boolean;
  asta: boolean;
  vishti: boolean;
  shukraBala: boolean; // weigh Venus strength (marriage karaka) in the score
};

const RIKTA_AND_AMAVASYA = new Set([4, 9, 14, 19, 24, 29, 30]);

const DEFAULT_RULES: MuhuratRuleSet = {
  name: "Muhurat",
  nakshatras: new Set([1, 4, 5, 7, 8, 12, 13, 14, 15, 17, 21, 22, 23, 24, 26, 27]),
  forbiddenTithis: RIKTA_AND_AMAVASYA,
  kharmas: false,
  chaturmas: false,
  asta: false,
  vishti: true,
  shukraBala: false,
};

export const CEREMONY_RULES: Record<string, MuhuratRuleSet> = {
  "vivah-sanskar": {
    name: "Vivah",
    nakshatras: VIVAH_NAKSHATRAS,
    forbiddenTithis: FORBIDDEN_TITHIS,
    kharmas: true, chaturmas: true, asta: true, vishti: true, shukraBala: true,
  },
  "sagai-engagement": {
    name: "Engagement",
    nakshatras: new Set([4, 5, 10, 12, 13, 15, 17, 21, 26, 27]),
    forbiddenTithis: FORBIDDEN_TITHIS,
    kharmas: true, chaturmas: true, asta: true, vishti: true, shukraBala: true,
  },
  "griha-pravesh": {
    name: "Griha Pravesh",
    nakshatras: new Set([4, 5, 8, 12, 13, 14, 17, 21, 22, 24, 26, 27]),
    forbiddenTithis: FORBIDDEN_TITHIS,
    kharmas: true, chaturmas: true, asta: true, vishti: true, shukraBala: false,
  },
  "bhoomi-puja": {
    name: "Bhoomi Puja",
    nakshatras: new Set([4, 5, 8, 12, 13, 14, 17, 21, 22, 24, 26, 27]),
    forbiddenTithis: FORBIDDEN_TITHIS,
    kharmas: true, chaturmas: true, asta: false, vishti: true, shukraBala: false,
  },
  namkaran: {
    name: "Namkaran",
    nakshatras: new Set([1, 4, 5, 7, 8, 13, 14, 15, 17, 22, 23, 24, 26, 27]),
    forbiddenTithis: RIKTA_AND_AMAVASYA,
    kharmas: false, chaturmas: false, asta: false, vishti: true, shukraBala: false,
  },
  annaprashan: {
    name: "Annaprashan",
    nakshatras: new Set([4, 5, 7, 8, 13, 14, 15, 17, 21, 22, 23, 24, 26, 27]),
    forbiddenTithis: RIKTA_AND_AMAVASYA,
    kharmas: false, chaturmas: false, asta: false, vishti: true, shukraBala: false,
  },
  mundan: {
    name: "Mundan",
    nakshatras: new Set([1, 5, 7, 8, 13, 14, 15, 18, 22, 23, 24, 27]),
    forbiddenTithis: RIKTA_AND_AMAVASYA,
    kharmas: false, chaturmas: false, asta: false, vishti: true, shukraBala: false,
  },
};

export function rulesFor(slug: string): MuhuratRuleSet {
  return CEREMONY_RULES[slug] ?? DEFAULT_RULES;
}

// Generic exclusion: why a date fails a ceremony's strict rules, or null.
export function ceremonyExclusionReason(
  rules: MuhuratRuleSet,
  dateStr: string,
  istHour = 12,
): string | null {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y) return "invalid date";
  const dn = dayNumber(y, m, d, istHour - IST_OFFSET_HOURS);
  const sunLon = sunData(dn).lon;
  const moonLon = moonLongitude(dn);
  const tithi = Math.floor(rev(moonLon - sunLon) / 12) + 1;
  const ayan = lahiriAyanamsa(y);
  const nak = Math.floor(rev(moonLon - ayan) / (360 / 27)) + 1;

  if (!rules.nakshatras.has(nak)) return "nakshatra not favourable";
  if (rules.forbiddenTithis.has(tithi)) return `${tithiName(tithi)} tithi avoided`;

  const sid = rev(sunLon - ayan);
  const sign = Math.floor(sid / 30);
  if (rules.kharmas && (sign === 8 || sign === 11)) return `Kharmas (Sun in ${RASHIS[sign]})`;
  if (rules.chaturmas && sid >= 80 && sid < 195) return "Chaturmas (Devshayani period)";
  if (rules.asta) {
    if (separation(jupiterLon(dn), sunLon) < GURU_ASTA) return "Guru asta (Jupiter combust)";
    if (separation(venusLon(dn), sunLon) < SHUKRA_ASTA) return "Shukra asta (Venus combust)";
  }
  if (rules.vishti) {
    const k = Math.floor(rev(moonLon - sunLon) / 6);
    if (k >= 1 && k <= 56 && (k - 1) % 7 === 6) return "Vishti (Bhadra) karana";
  }
  return null;
}

// Generic 0-100 triage score for a ceremony date (Shukra bala only when the
// ceremony rules call for it — i.e. marriage/engagement).
export function muhuratQuality(
  rules: MuhuratRuleSet,
  dateStr: string,
  istHour = 12,
): VivahQuality {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dn = dayNumber(y, m, d, istHour - IST_OFFSET_HOURS);
  const ayan = lahiriAyanamsa(y);
  const sunLon = sunData(dn).lon;
  const moonLon = moonLongitude(dn);
  const tithi = Math.floor(rev(moonLon - sunLon) / 12) + 1;
  const nak = Math.floor(rev(moonLon - ayan) / (360 / 27)) + 1;
  const wd = weekdayOf(dateStr);
  const gb = guruBala(dn, ayan);

  const factors: string[] = [];
  let score = 50;
  if (PRIME_NAKSHATRAS.has(nak)) { score += 12; factors.push(`${NAKSHATRAS[nak - 1]} (prime)`); }
  else { score += 6; factors.push(NAKSHATRAS[nak - 1]); }
  if (GOOD_TITHIS.has(tithi)) { score += 8; factors.push(`${tithiName(tithi)} ✓`); }
  if (GOOD_WEEKDAYS.has(wd)) { score += 8; factors.push("favourable weekday"); }
  else if (wd === 2 || wd === 6) { score -= 6; factors.push("Tue/Sat weekday"); }
  score += gb * 5;
  factors.push(`Guru bala ${gb >= 0 ? "+" : ""}${gb}`);
  if (rules.shukraBala) {
    const sb = shukraBala(dn, ayan);
    score += sb * 5;
    factors.push(`Shukra bala ${sb >= 0 ? "+" : ""}${sb}`);
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, tier: tierFromScore(score), factors };
}

// Generates muhurat candidates for any ceremony by its rule-set, each timed to
// the day's Abhijit window and scored for triage.
export function generateCeremonyCandidates(
  slug: string,
  from: string,
  to: string,
  lat: number,
  lng: number,
  strict = true,
  maxDays = 800,
): MuhuratCandidate[] {
  const rules = rulesFor(slug);
  const out: MuhuratCandidate[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return out;

  for (
    let dt = new Date(start), n = 0;
    dt <= end && n < maxDays;
    dt.setUTCDate(dt.getUTCDate() + 1), n++
  ) {
    const dateStr = dt.toISOString().slice(0, 10);
    const periods = computeDayPeriods(dateStr, lat, lng);
    if (!periods) continue;
    const midHour = (periods.abhijit.start + periods.abhijit.end) / 2 / 60;
    const p = panchangaAt(dateStr, midHour);
    if (!p) continue;

    if (strict) {
      if (ceremonyExclusionReason(rules, dateStr, midHour) !== null) continue;
    } else if (!rules.nakshatras.has(p.nakshatra) || rules.forbiddenTithis.has(p.tithi)) {
      continue;
    }

    const q = muhuratQuality(rules, dateStr, midHour);
    out.push({
      date: dateStr,
      start_time: minutesToHHMM(periods.abhijit.start),
      end_time: minutesToHHMM(periods.abhijit.end),
      label: `${rules.name} Muhurat — ${p.nakshatraName}`,
      quality_score: q.score,
      note:
        `${p.nakshatraName} nakshatra, ${p.tithiName}, Sun in ${sunRashi(dateStr, midHour)}. ` +
        `Quality ${q.score}/100 (${q.tier}): ${q.factors.join(", ")}. ` +
        `Abhijit window. Avoid Rahu Kalam ${minutesToHHMM(periods.rahu.start)}-${minutesToHHMM(periods.rahu.end)}. ` +
        `Computed${strict ? " (strict rules)" : ""} — verify before publishing.`,
    });
  }
  return out;
}

// Back-compat wrapper — Vivah is just the wedding ceremony's rule-set.
export function generateVivahCandidates(
  from: string,
  to: string,
  lat: number,
  lng: number,
  strict = true,
  maxDays = 800,
): MuhuratCandidate[] {
  return generateCeremonyCandidates("vivah-sanskar", from, to, lat, lng, strict, maxDays);
}

// ── Full panchanga (for the public lookup) ──────────────────────────────────
export const YOGAS = [
  "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
  "Sukarma", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata",
  "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva",
  "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti",
];

export const WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

export type FullPanchanga = {
  date: string;
  weekday: string;
  tithi: { num: number; name: string };
  nakshatra: { num: number; name: string };
  yoga: { num: number; name: string };
  karana: { name: string; isVishti: boolean };
  sunRashi: string;
  sunrise: number;
  sunset: number;
  abhijit: Period;
  rahu: Period;
  yamaganda: Period;
  gulika: Period;
};

// Complete panchanga for a date + place, evaluated at sunrise (the traditional
// reference). All times are minutes-from-midnight IST; format with minutesToHHMM.
export function fullPanchanga(
  dateStr: string,
  lat: number,
  lng: number,
): FullPanchanga | null {
  const periods = computeDayPeriods(dateStr, lat, lng);
  if (!periods) return null;
  const sunriseHour = periods.sunrise / 60;
  const p = panchangaAt(dateStr, sunriseHour);
  if (!p) return null;

  const [y, m, d] = dateStr.split("-").map(Number);
  const dn = dayNumber(y, m, d, sunriseHour - IST_OFFSET_HOURS);
  const ayan = lahiriAyanamsa(y);
  const yn =
    Math.floor(rev(sunData(dn).lon + moonLongitude(dn) - 2 * ayan) / (360 / 27)) + 1;

  return {
    date: dateStr,
    weekday: WEEKDAY_NAMES[weekdayOf(dateStr)],
    tithi: { num: p.tithi, name: p.tithiName },
    nakshatra: { num: p.nakshatra, name: p.nakshatraName },
    yoga: { num: yn, name: YOGAS[yn - 1] },
    karana: karanaAt(dateStr, sunriseHour),
    sunRashi: sunRashi(dateStr, sunriseHour),
    sunrise: periods.sunrise,
    sunset: periods.sunset,
    abhijit: periods.abhijit,
    rahu: periods.rahu,
    yamaganda: periods.yamaganda,
    gulika: periods.gulika,
  };
}
