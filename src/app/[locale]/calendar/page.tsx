import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { panchangaAt } from "@/lib/muhurat-engine";
import { festivalsOn, FESTIVAL_INFO } from "@/lib/festivals";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import {
  CAL_LANGS,
  CAL_MONTHS,
  CAL_WEEKDAYS,
  CAL_UI,
  DEFAULT_CAL_LANG,
  isCalLang,
  calTithiLabel,
  calFestivalName,
  type CalLang,
} from "@/lib/calendar-i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.calendar.title"), description: t("meta.calendar.desc") };
}

function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

const YM_RE = /^\d{4}-\d{2}$/;
const pad = (n: number) => String(n).padStart(2, "0");

// Adjacent month in YYYY-MM, wrapping the year.
function shiftMonth(y: number, m: number, delta: number): string {
  const idx = (y * 12 + (m - 1)) + delta;
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`;
}

type DayCell = {
  day: number;
  date: string;
  tithi: string;
  festivals: { name: string; emoji: string; slug: string }[];
  isToday: boolean;
};

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ lang?: string; ym?: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const sp = await searchParams;

  const lang: CalLang = isCalLang(sp.lang) ? sp.lang : DEFAULT_CAL_LANG;
  const ui = CAL_UI[lang];

  const today = todayIST();
  const ym = sp.ym && YM_RE.test(sp.ym) ? sp.ym : today.slice(0, 7);
  const [y, m] = ym.split("-").map(Number);

  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstWeekday = new Date(`${ym}-01T00:00:00Z`).getUTCDay(); // 0=Sun

  const cells: DayCell[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${ym}-${pad(d)}`;
    const pan = panchangaAt(date);
    cells.push({
      day: d,
      date,
      tithi: pan ? calTithiLabel(lang, pan.tithi) : "",
      festivals: festivalsOn(date).map((f) => ({
        name: calFestivalName(lang, f.name),
        emoji: FESTIVAL_INFO[f.name]?.emoji ?? "🎉",
        slug: f.slug,
      })),
      isToday: date === today,
    });
  }

  const monthFestivals = cells.flatMap((c) =>
    c.festivals.map((f) => ({ ...f, day: c.day })),
  );

  const prevYm = shiftMonth(y, m, -1);
  const nextYm = shiftMonth(y, m, 1);
  const monthLabel = `${CAL_MONTHS[lang][m - 1]} ${y}`;

  const langHref = (code: string) => `/calendar?lang=${code}&ym=${ym}`;
  const monthHref = (target: string) => `/calendar?lang=${lang}&ym=${target}`;

  // Leading blank cells so day 1 lands under the right weekday.
  const blanks = Array.from({ length: firstWeekday });

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{ui.title}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {ui.title}
            </h1>
            <p className="mt-2 max-w-2xl text-lg text-foreground/70">
              {ui.subtitle}
            </p>

            {/* Language picker */}
            <div className="mt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/55">
                {ui.chooseLanguage}
              </div>
              <div className="flex flex-wrap gap-2">
                {CAL_LANGS.map((l) => (
                  <Link
                    key={l.code}
                    href={langHref(l.code)}
                    aria-current={l.code === lang ? "true" : undefined}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      l.code === lang
                        ? "bg-saffron-700 text-white"
                        : "bg-white text-maroon-700 ring-1 ring-saffron-200 hover:bg-saffron-50"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href={monthHref(prevYm)}
              aria-label={ui.prevMonth}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-maroon-700 ring-1 ring-saffron-200 hover:bg-saffron-50"
            >
              ‹
            </Link>
            <div className="text-center">
              <h2 className="font-heading text-2xl text-maroon-800">
                {monthLabel}
              </h2>
              {ym !== today.slice(0, 7) && (
                <Link
                  href={monthHref(today.slice(0, 7))}
                  className="text-xs text-saffron-700 hover:underline"
                >
                  {ui.jumpToToday}
                </Link>
              )}
            </div>
            <Link
              href={monthHref(nextYm)}
              aria-label={ui.nextMonth}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-maroon-700 ring-1 ring-saffron-200 hover:bg-saffron-50"
            >
              ›
            </Link>
          </div>

          {/* Weekday headers */}
          <div className="mt-4 grid grid-cols-7 gap-1 sm:gap-2">
            {CAL_WEEKDAYS[lang].map((w, i) => (
              <div
                key={i}
                className={`pb-1 text-center text-xs font-semibold ${
                  i === 0 ? "text-red-700/70" : "text-foreground/55"
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-2">
            {blanks.map((_, i) => (
              <div key={`b${i}`} className="min-h-20 rounded-xl sm:min-h-24" />
            ))}
            {cells.map((c) => (
              <div
                key={c.date}
                className={`min-h-20 rounded-xl border p-1.5 sm:min-h-24 sm:p-2 ${
                  c.isToday
                    ? "border-saffron-500 bg-saffron-50 ring-1 ring-saffron-400"
                    : c.festivals.length
                      ? "border-saffron-200 bg-white"
                      : "border-saffron-100 bg-white/60"
                }`}
              >
                <div
                  className={`text-sm font-semibold ${
                    c.isToday ? "text-saffron-800" : "text-maroon-700"
                  }`}
                >
                  {c.day}
                </div>
                {c.tithi && (
                  <div className="mt-0.5 hidden text-[10px] leading-tight text-foreground/55 sm:block">
                    {c.tithi}
                  </div>
                )}
                {c.festivals.map((f) => (
                  <Link
                    key={f.slug + f.name}
                    href={`/poojas/${f.slug}`}
                    title={f.name}
                    className="mt-1 block truncate rounded bg-saffron-100 px-1 py-0.5 text-[10px] font-medium leading-tight text-saffron-900 hover:bg-saffron-200"
                  >
                    {f.emoji} {f.name}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Festivals this month */}
          <div className="mt-5">
            <h3 className="font-heading text-xl text-maroon-800">
              {ui.festivalsThisMonth}
            </h3>
            {monthFestivals.length === 0 ? (
              <p className="mt-3 text-sm text-foreground/65">{ui.noFestivals}</p>
            ) : (
              <div className="mt-4 space-y-3">
                {monthFestivals.map((f) => (
                  <div
                    key={f.slug + f.name + f.day}
                    className="flex flex-wrap items-center gap-4 rounded-2xl border border-saffron-200 bg-white p-4 shadow-sm"
                  >
                    <span className="text-3xl">{f.emoji}</span>
                    <div className="min-w-40 flex-1">
                      <div className="font-heading text-lg text-maroon-700">
                        {f.name}
                      </div>
                      <div className="text-sm text-foreground/65">
                        {f.day} {CAL_MONTHS[lang][m - 1]} {y}
                      </div>
                    </div>
                    <Link
                      href={`/poojas/${f.slug}`}
                      className="whitespace-nowrap rounded-full bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
                    >
                      {ui.bookThisPooja}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-foreground/65">
            <Link href="/panchang" className="text-saffron-700 hover:underline">
              {ui.fullPanchang}
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
