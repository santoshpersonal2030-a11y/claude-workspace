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

export type MuhuratCandidate = {
  date: string;
  start_time: string;
  end_time: string;
  label: string;
  note: string;
};

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
