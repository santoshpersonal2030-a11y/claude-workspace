// Curated calendar of major Hindu festivals → the pooja we'd suggest booking.
//
// WHY A TABLE (and not the pure muhurat engine): the monthly tithi observances
// in `upcomingVrats` are computed live, but festival *observance* dates depend
// on drik-panchang rules (nishita/pradosh kaal, adhika masa, regional variation)
// that the lightweight engine doesn't model — it lands ±1 day off and can skip
// a pratipada-based festival (e.g. Navratri) entirely. For a user-facing
// reminder that's not good enough, so these dates are curated.
//
// The dates below were generated from the engine and corrected for its known
// late-bias; they are accurate to about a day. VERIFY against a published
// panchang when extending past the last year here, and add the next years so
// the reminder cron keeps firing (it logs a warning once the table runs dry).
//
// `slug` must reference a real pooja in `src/lib/poojas.ts`; the festivals test
// asserts this.

export type Festival = {
  date: string; // YYYY-MM-DD, IST observance date
  slug: string; // bookable pooja to deep-link to
  name: string;
};

export const FESTIVALS: Festival[] = [
  { date: "2026-01-23", slug: "saraswati-puja", name: "Vasant Panchami" },
  { date: "2026-02-15", slug: "mahashivratri-puja", name: "Mahashivratri" },
  { date: "2026-03-03", slug: "holika-dahan", name: "Holika Dahan" },
  { date: "2026-03-27", slug: "ram-navami-puja", name: "Ram Navami" },
  { date: "2026-04-01", slug: "hanuman-chalisa-path", name: "Hanuman Jayanti" },
  { date: "2026-04-19", slug: "lakshmi-puja", name: "Akshaya Tritiya" },
  { date: "2026-07-28", slug: "satyanarayan-katha", name: "Guru Purnima" },
  { date: "2026-09-04", slug: "janmashtami-puja", name: "Krishna Janmashtami" },
  { date: "2026-09-14", slug: "ganesh-puja", name: "Ganesh Chaturthi" },
  { date: "2026-10-11", slug: "durga-puja", name: "Navratri" },
  { date: "2026-10-20", slug: "durga-puja", name: "Dussehra" },
  { date: "2026-10-29", slug: "karwa-chauth-puja", name: "Karwa Chauth" },
  { date: "2026-11-06", slug: "lakshmi-puja", name: "Dhanteras" },
  { date: "2026-11-08", slug: "lakshmi-puja", name: "Diwali" },
  { date: "2026-11-09", slug: "govardhan-puja", name: "Govardhan Puja" },
  { date: "2026-11-15", slug: "chhath-puja", name: "Chhath Puja" },
  { date: "2026-11-21", slug: "satyanarayan-katha", name: "Tulsi Vivah" },
  { date: "2027-02-11", slug: "saraswati-puja", name: "Vasant Panchami" },
  { date: "2027-03-06", slug: "mahashivratri-puja", name: "Mahashivratri" },
  { date: "2027-03-22", slug: "holika-dahan", name: "Holika Dahan" },
  { date: "2027-04-15", slug: "ram-navami-puja", name: "Ram Navami" },
  { date: "2027-04-19", slug: "hanuman-chalisa-path", name: "Hanuman Jayanti" },
  { date: "2027-05-08", slug: "lakshmi-puja", name: "Akshaya Tritiya" },
  { date: "2027-07-17", slug: "satyanarayan-katha", name: "Guru Purnima" },
  { date: "2027-08-25", slug: "janmashtami-puja", name: "Krishna Janmashtami" },
  { date: "2027-09-03", slug: "ganesh-puja", name: "Ganesh Chaturthi" },
  { date: "2027-09-30", slug: "durga-puja", name: "Navratri" },
  { date: "2027-10-09", slug: "durga-puja", name: "Dussehra" },
  { date: "2027-10-19", slug: "karwa-chauth-puja", name: "Karwa Chauth" },
  { date: "2027-10-26", slug: "lakshmi-puja", name: "Dhanteras" },
  { date: "2027-10-28", slug: "lakshmi-puja", name: "Diwali" },
  { date: "2027-10-29", slug: "govardhan-puja", name: "Govardhan Puja" },
  { date: "2027-11-04", slug: "chhath-puja", name: "Chhath Puja" },
  { date: "2027-11-10", slug: "satyanarayan-katha", name: "Tulsi Vivah" },
  { date: "2028-02-01", slug: "saraswati-puja", name: "Vasant Panchami" },
  { date: "2028-02-23", slug: "mahashivratri-puja", name: "Mahashivratri" },
  { date: "2028-03-11", slug: "holika-dahan", name: "Holika Dahan" },
  { date: "2028-04-04", slug: "ram-navami-puja", name: "Ram Navami" },
  { date: "2028-04-08", slug: "hanuman-chalisa-path", name: "Hanuman Jayanti" },
  { date: "2028-04-26", slug: "lakshmi-puja", name: "Akshaya Tritiya" },
  { date: "2028-07-05", slug: "satyanarayan-katha", name: "Guru Purnima" },
  { date: "2028-08-13", slug: "janmashtami-puja", name: "Krishna Janmashtami" },
  { date: "2028-08-22", slug: "ganesh-puja", name: "Ganesh Chaturthi" },
  { date: "2028-09-19", slug: "durga-puja", name: "Navratri" },
  { date: "2028-09-27", slug: "durga-puja", name: "Dussehra" },
  { date: "2028-10-07", slug: "karwa-chauth-puja", name: "Karwa Chauth" },
  { date: "2028-10-15", slug: "lakshmi-puja", name: "Dhanteras" },
  { date: "2028-10-17", slug: "lakshmi-puja", name: "Diwali" },
  { date: "2028-10-18", slug: "govardhan-puja", name: "Govardhan Puja" },
  { date: "2028-10-23", slug: "chhath-puja", name: "Chhath Puja" },
  { date: "2028-10-29", slug: "satyanarayan-katha", name: "Tulsi Vivah" },
  { date: "2029-01-19", slug: "saraswati-puja", name: "Vasant Panchami" },
  { date: "2029-02-11", slug: "mahashivratri-puja", name: "Mahashivratri" },
  { date: "2029-02-28", slug: "holika-dahan", name: "Holika Dahan" },
  { date: "2029-03-24", slug: "ram-navami-puja", name: "Ram Navami" },
  { date: "2029-03-29", slug: "hanuman-chalisa-path", name: "Hanuman Jayanti" },
  { date: "2029-04-16", slug: "lakshmi-puja", name: "Akshaya Tritiya" },
  { date: "2029-07-24", slug: "satyanarayan-katha", name: "Guru Purnima" },
  { date: "2029-09-01", slug: "janmashtami-puja", name: "Krishna Janmashtami" },
  { date: "2029-09-11", slug: "ganesh-puja", name: "Ganesh Chaturthi" },
  { date: "2029-10-08", slug: "durga-puja", name: "Navratri" },
  { date: "2029-10-15", slug: "durga-puja", name: "Dussehra" },
  { date: "2029-10-26", slug: "karwa-chauth-puja", name: "Karwa Chauth" },
  { date: "2029-11-03", slug: "lakshmi-puja", name: "Dhanteras" },
  { date: "2029-11-05", slug: "lakshmi-puja", name: "Diwali" },
  { date: "2029-11-06", slug: "govardhan-puja", name: "Govardhan Puja" },
  { date: "2029-11-11", slug: "chhath-puja", name: "Chhath Puja" },
  { date: "2029-11-16", slug: "satyanarayan-katha", name: "Tulsi Vivah" },
  { date: "2030-02-07", slug: "saraswati-puja", name: "Vasant Panchami" },
  { date: "2030-03-02", slug: "mahashivratri-puja", name: "Mahashivratri" },
  { date: "2030-03-19", slug: "holika-dahan", name: "Holika Dahan" },
  { date: "2030-04-12", slug: "ram-navami-puja", name: "Ram Navami" },
  { date: "2030-04-17", slug: "hanuman-chalisa-path", name: "Hanuman Jayanti" },
  { date: "2030-05-04", slug: "lakshmi-puja", name: "Akshaya Tritiya" },
  { date: "2030-07-14", slug: "satyanarayan-katha", name: "Guru Purnima" },
  { date: "2030-08-21", slug: "janmashtami-puja", name: "Krishna Janmashtami" },
  { date: "2030-08-31", slug: "ganesh-puja", name: "Ganesh Chaturthi" },
  { date: "2030-09-28", slug: "durga-puja", name: "Navratri" },
  { date: "2030-10-05", slug: "durga-puja", name: "Dussehra" },
  { date: "2030-10-15", slug: "karwa-chauth-puja", name: "Karwa Chauth" },
  { date: "2030-10-24", slug: "lakshmi-puja", name: "Dhanteras" },
  { date: "2030-10-25", slug: "lakshmi-puja", name: "Diwali" },
  { date: "2030-10-26", slug: "govardhan-puja", name: "Govardhan Puja" },
  { date: "2030-11-01", slug: "chhath-puja", name: "Chhath Puja" },
  { date: "2030-11-05", slug: "satyanarayan-katha", name: "Tulsi Vivah" },
];

// Per-festival emoji + the one-line nudge used in the reminder push. Keyed by
// the festival name so it's shared across years.
export const FESTIVAL_INFO: Record<string, { emoji: string; push: string }> = {
  "Vasant Panchami": { emoji: "📖", push: "Worship Goddess Saraswati for wisdom and learning." },
  Mahashivratri: { emoji: "🕉️", push: "The great night of Shiva — book a Mahashivratri Puja." },
  "Holika Dahan": { emoji: "🔥", push: "Light the Holika bonfire — book a Holika Dahan Puja." },
  "Ram Navami": { emoji: "🏹", push: "Celebrate Lord Rama's birth with a Ram Navami Puja." },
  "Hanuman Jayanti": { emoji: "🚩", push: "Honour Hanuman ji with a Sundarkand / Hanuman Chalisa path." },
  "Akshaya Tritiya": { emoji: "✨", push: "An auspicious day for new beginnings and Lakshmi Puja." },
  "Guru Purnima": { emoji: "🙏", push: "Honour your guru with a Satyanarayan Katha." },
  "Krishna Janmashtami": { emoji: "🦚", push: "Celebrate Krishna's birth with a Janmashtami Puja." },
  "Ganesh Chaturthi": { emoji: "🐘", push: "Welcome Ganpati Bappa — book a Ganesh Puja." },
  Navratri: { emoji: "🌺", push: "Nine nights of Devi — begin with Ghatasthapana & Durga Puja." },
  Dussehra: { emoji: "🏹", push: "Vijayadashami — celebrate good over evil with a Durga Puja." },
  "Karwa Chauth": { emoji: "🌙", push: "Book a pandit for your Karwa Chauth vrat and katha." },
  Dhanteras: { emoji: "🪙", push: "Invite wealth home — book a Lakshmi-Dhanteras Puja." },
  Diwali: { emoji: "🪔", push: "Festival of lights — book your Lakshmi Puja pandit early." },
  "Govardhan Puja": { emoji: "🐄", push: "Offer Annakut with a Govardhan Puja." },
  "Chhath Puja": { emoji: "🌅", push: "Offer arghya to Surya — book a pandit for Chhath." },
  "Tulsi Vivah": { emoji: "🌿", push: "Marry Tulsi with Shaligram — book a Tulsi Vivah ceremony." },
};

// Festivals on [fromISO, fromISO + days), in date order. Pure string compare on
// YYYY-MM-DD, so it's timezone-agnostic — pass an IST date string.
export function upcomingFestivals(fromISO: string, days: number): Festival[] {
  const start = new Date(`${fromISO}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) return [];
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + days);
  const endISO = end.toISOString().slice(0, 10);
  return FESTIVALS.filter((f) => f.date >= fromISO && f.date < endISO);
}

// The festival(s) falling exactly on an IST date, or [].
export function festivalsOn(dateISO: string): Festival[] {
  return FESTIVALS.filter((f) => f.date === dateISO);
}

// The last date the curated table covers — used to warn when it needs a refresh.
export const FESTIVALS_THROUGH =
  FESTIVALS.length > 0 ? FESTIVALS[FESTIVALS.length - 1].date : "";
