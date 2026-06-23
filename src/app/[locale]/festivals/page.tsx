import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { upcomingVrats } from "@/lib/muhurat-engine";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Hindu Festival & Vrat Calendar — Ekadashi, Purnima, Amavasya",
  description:
    "Upcoming Hindu vrat and festival days — Ekadashi, Purnima, Amavasya, Sankashti & Vinayaka Chaturthi, Pradosh — computed from the panchang, with the pooja for each occasion.",
};

// Re-compute daily.
export const revalidate = 86400;

function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// What to do on each observance — the pooja we'd suggest booking. The blurb is
// a dictionary key, translated at render time.
const VRAT_POOJA: Record<string, { emoji: string; blurbKey: string; slug: string; cta: string }> = {
  Ekadashi: { emoji: "🪔", blurbKey: "fes.blurb.ekadashi", slug: "satyanarayan-katha", cta: "Satyanarayan Katha" },
  Purnima: { emoji: "🌕", blurbKey: "fes.blurb.purnima", slug: "satyanarayan-katha", cta: "Satyanarayan Katha" },
  Amavasya: { emoji: "🌑", blurbKey: "fes.blurb.amavasya", slug: "tarpan", cta: "Tarpan" },
  "Sankashti Chaturthi": { emoji: "🐘", blurbKey: "fes.blurb.sankashti", slug: "ganesh-puja", cta: "Ganesh Puja" },
  "Vinayaka Chaturthi": { emoji: "🐘", blurbKey: "fes.blurb.vinayaka", slug: "ganesh-puja", cta: "Ganesh Puja" },
  "Pradosh Vrat": { emoji: "🕉️", blurbKey: "fes.blurb.pradosh", slug: "rudrabhishek", cta: "Rudrabhishek" },
};

function fmt(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const wd = new Date(`${date}T00:00:00Z`).getUTCDay();
  const W = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][wd];
  return `${W}, ${d} ${MONTHS[m - 1]} ${y}`;
}

export default async function FestivalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const vrats = upcomingVrats(todayIST(), 120);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <nav className="text-sm text-foreground/60">
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

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="space-y-3">
            {vrats.map((v) => {
              const info = VRAT_POOJA[v.name];
              return (
                <div
                  key={`${v.date}-${v.name}`}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
                >
                  <span className="text-3xl">{info?.emoji ?? "🗓️"}</span>
                  <div className="min-w-48 flex-1">
                    <div className="font-heading text-lg text-maroon-700">
                      {v.name}
                    </div>
                    <div className="text-sm text-foreground/55">{fmt(v.date)}</div>
                    {info && (
                      <p className="mt-1 text-sm text-foreground/65">
                        {t(info.blurbKey)}
                      </p>
                    )}
                  </div>
                  {info && (
                    <Link
                      href={`/poojas/${info.slug}`}
                      className="whitespace-nowrap rounded-full bg-saffron-600 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-700"
                    >
                      {t("fes.book", { cta: info.cta })}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-xs text-foreground/45">
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
