import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { upcomingVrats } from "@/lib/muhurat-engine";
import { upcomingFestivals, FESTIVAL_INFO } from "@/lib/festivals";
import { poojas } from "@/lib/poojas";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.festivals.title"), description: t("meta.festivals.desc") };
}

// Re-compute daily.
export const revalidate = 86400;

function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// What to do on each monthly observance — the pooja we'd suggest booking. The
// blurb is a dictionary key, translated at render time.
const VRAT_POOJA: Record<string, { emoji: string; blurbKey: string; slug: string; cta: string }> = {
  Ekadashi: { emoji: "🪔", blurbKey: "fes.blurb.ekadashi", slug: "satyanarayan-katha", cta: "Satyanarayan Katha" },
  Purnima: { emoji: "🌕", blurbKey: "fes.blurb.purnima", slug: "satyanarayan-katha", cta: "Satyanarayan Katha" },
  Amavasya: { emoji: "🌑", blurbKey: "fes.blurb.amavasya", slug: "tarpan", cta: "Tarpan" },
  "Sankashti Chaturthi": { emoji: "🐘", blurbKey: "fes.blurb.sankashti", slug: "ganesh-puja", cta: "Ganesh Puja" },
  "Vinayaka Chaturthi": { emoji: "🐘", blurbKey: "fes.blurb.vinayaka", slug: "ganesh-puja", cta: "Ganesh Puja" },
  "Pradosh Vrat": { emoji: "🕉️", blurbKey: "fes.blurb.pradosh", slug: "rudrabhishek", cta: "Rudrabhishek" },
};

const POOJA_NAME: Record<string, string> = Object.fromEntries(
  poojas.map((p) => [p.slug, p.name]),
);

function fmt(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const wd = new Date(`${date}T00:00:00Z`).getUTCDay();
  const W = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][wd];
  return `${W}, ${d} ${MONTHS[m - 1]} ${y}`;
}

// A unified calendar row — either a named festival or a recurring monthly vrat.
type Row = {
  date: string;
  name: string;
  emoji: string;
  blurb: string;
  slug?: string;
  cta?: string;
  festival?: boolean;
};

export default async function FestivalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const from = todayIST();
  const WINDOW = 120;

  const festivals: Row[] = upcomingFestivals(from, WINDOW).map((f) => ({
    date: f.date,
    name: f.name,
    emoji: FESTIVAL_INFO[f.name]?.emoji ?? "🎉",
    blurb: FESTIVAL_INFO[f.name]?.push ?? "",
    slug: f.slug,
    cta: POOJA_NAME[f.slug],
    festival: true,
  }));

  // Named festivals take precedence over the generic monthly observance on the
  // same day (e.g. Diwali over a plain Amavasya).
  const festDates = new Set(festivals.map((f) => f.date));
  const vrats: Row[] = upcomingVrats(from, WINDOW)
    .filter((v) => !festDates.has(v.date))
    .map((v) => {
      const info = VRAT_POOJA[v.name];
      return {
        date: v.date,
        name: v.name,
        emoji: info?.emoji ?? "🗓️",
        blurb: info ? t(info.blurbKey) : "",
        slug: info?.slug,
        cta: info?.cta,
      };
    });

  const rows = [...festivals, ...vrats].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{t("fes.crumb")}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("fes.h1")}
            </h1>
            <p className="mt-2 max-w-2xl text-lg text-foreground/70">
              {t("fes.subtitle")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="space-y-3">
            {rows.map((r) => (
              <div
                key={`${r.date}-${r.name}`}
                className={`flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm ${
                  r.festival ? "border-saffron-300" : "border-saffron-100"
                }`}
              >
                <span className="text-3xl">{r.emoji}</span>
                <div className="min-w-48 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-lg text-maroon-700">
                      {r.name}
                    </span>
                    {r.festival && (
                      <span className="rounded-full bg-saffron-100 px-2 py-0.5 text-[11px] font-semibold text-saffron-800">
                        {t("fes.badge")}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-foreground/65">{fmt(r.date)}</div>
                  {r.blurb && (
                    <p className="mt-1 text-sm text-foreground/65">{r.blurb}</p>
                  )}
                </div>
                {r.slug && r.cta && (
                  <Link
                    href={`/poojas/${r.slug}`}
                    className="whitespace-nowrap rounded-full bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
                  >
                    {t("fes.book", { cta: r.cta })}
                  </Link>
                )}
              </div>
            ))}
          </div>

          <p className="mt-8 text-xs text-foreground/65">
            {t("fes.note1")}{" "}
            <Link href="/panchang" className="text-saffron-700 hover:underline">
              {t("fes.noteLink")}
            </Link>{" "}
            {t("fes.note2")}
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
