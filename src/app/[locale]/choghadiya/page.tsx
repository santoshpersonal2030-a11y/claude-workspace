import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  CITY_COORDS,
  computeChoghadiya,
  type Choghadiya,
} from "@/lib/muhurat-engine";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.choghadiya.title"), description: t("meta.choghadiya.desc") };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

// Minutes from IST midnight right now (for the "current slot" highlight).
function istNowMinutes(): number {
  const d = new Date(Date.now() + 5.5 * 3600 * 1000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function to12h(mins: number): string {
  const t = Math.round(mins);
  let h = Math.floor(t / 60) % 24;
  const m = t % 60;
  const ap = h < 12 ? "AM" : "PM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

const STYLE: Record<string, string> = {
  good: "border-emerald-200 bg-emerald-50/60 text-emerald-900",
  neutral: "border-saffron-200 bg-white text-foreground/80",
  bad: "border-red-200 bg-red-50/50 text-red-900",
};

export default async function ChoghadiyaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string; city?: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const sp = await searchParams;
  const date = sp.date && DATE_RE.test(sp.date) ? sp.date : todayIST();
  const cities = Object.keys(CITY_COORDS);
  const city = sp.city && cities.includes(sp.city) ? sp.city : "New Delhi";
  const coords = CITY_COORDS[city];

  const ch = computeChoghadiya(date, coords.lat, coords.lng);
  const [y, m, d] = date.split("-").map(Number);
  const prettyDate = `${d} ${MONTHS[m - 1]} ${y}`;

  // Highlight the running slot only when viewing today.
  const isToday = date === todayIST();
  const nowMin = isToday ? istNowMinutes() : -1;
  const isNow = (c: Choghadiya) =>
    isToday &&
    ((nowMin >= c.start && nowMin < c.end) ||
      (nowMin + 1440 >= c.start && nowMin + 1440 < c.end));

  const inputClass =
    "rounded-lg border border-saffron-200 bg-white px-3 py-2 text-sm outline-none focus:border-saffron-400";

  const renderGrid = (title: string, slots: Choghadiya[]) => (
    <div>
      <h2 className="font-heading text-xl text-maroon-800">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {slots.map((c, i) => (
          <div
            key={i}
            className={`rounded-xl border p-3 ${STYLE[c.quality]} ${
              isNow(c) ? "ring-2 ring-saffron-500" : ""
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-heading text-base">{c.name}</span>
              {isNow(c) && (
                <span className="text-[10px] font-semibold text-saffron-700">
                  {t("cho.now")}
                </span>
              )}
            </div>
            <div className="text-xs opacity-80">
              {to12h(c.start)} – {to12h(c.end)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{t("cho.crumb")}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("cho.h1")}
            </h1>
            <p className="mt-2 text-lg text-foreground/70">
              {prettyDate} · {city}
            </p>

            <form method="get" className="mt-5 flex flex-wrap items-end gap-3">
              <label className="text-xs text-foreground/65">
                {t("astro.date")}
                <input
                  type="date"
                  name="date"
                  defaultValue={date}
                  className={`block ${inputClass}`}
                />
              </label>
              <label className="text-xs text-foreground/65">
                {t("astro.city")}
                <select
                  name="city"
                  defaultValue={city}
                  className={`block ${inputClass}`}
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
              >
                {t("cho.show")}
              </button>
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6">
          {!ch ? (
            <p className="text-foreground/65">{t("cho.fail")}</p>
          ) : (
            <>
              <p className="text-sm text-foreground/65">{t("cho.legend")}</p>
              {renderGrid(t("cho.dayGrid"), ch.day)}
              {renderGrid(t("cho.nightGrid"), ch.night)}
              <p className="text-xs text-foreground/65">
                {t("cho.computed1", { city })}{" "}
                <Link href="/panchang" className="text-saffron-700 hover:underline">
                  {t("fes.noteLink")}
                </Link>{" "}
                {t("cho.or")}{" "}
                <Link href="/muhurat" className="text-saffron-700 hover:underline">
                  {t("cho.muhuratsLink")}
                </Link>{" "}
                {t("cho.computed2")}
              </p>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
