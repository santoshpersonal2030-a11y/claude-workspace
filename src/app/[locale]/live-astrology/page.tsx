import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { astrologers } from "@/lib/astrologers";
import { getPresenceMap, type PresenceStatus } from "@/lib/live-status";
import { formatINR } from "@/lib/poojas";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { formatNumber } from "@/lib/dates";

// Presence is live, so refresh the page often rather than caching it forever.
export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return {
    title: t("meta.liveAstrology.title"),
    description: t("meta.liveAstrology.desc"),
  };
}

/* Colours only. The LABELS used to live here too, as a module-level constant — evaluated once
   on first load, so it would have frozen in whichever language rendered first. They are read
   from the dictionary inside the component instead. */
const STATUS_STYLE: Record<PresenceStatus, { dot: string; text: string }> = {
  online: { dot: "bg-emerald-500", text: "text-emerald-700" },
  busy: { dot: "bg-amber-500", text: "text-amber-700" },
  offline: { dot: "bg-gray-400", text: "text-foreground/45" },
};

const STATUS_KEY: Record<PresenceStatus, string> = {
  online: "la.statusOnline",
  busy: "la.statusBusy",
  offline: "la.statusOffline",
};

const SORT: Record<PresenceStatus, number> = { online: 0, busy: 1, offline: 2 };

export default async function LiveAstrologyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { t } = getDictionary(loc);
  const presence = await getPresenceMap();
  const statusOf = (slug: string): PresenceStatus =>
    presence[slug]?.status ?? "offline";

  const list = [...astrologers].sort(
    (a, b) => SORT[statusOf(a.slug)] - SORT[statusOf(b.slug)],
  );
  const onlineCount = astrologers.filter(
    (a) => statusOf(a.slug) === "online",
  ).length;

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{t("nav.liveAstrology")}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("la.h1")}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              {t("la.intro")}{" "}
              <span className="font-semibold text-emerald-700">
                {t("la.onlineNow", { n: onlineCount })}
              </span>{" "}
              {t("la.rightNow")}
            </p>
            <p className="mt-2 text-sm text-foreground/60">
              {t("la.preferScheduled")}{" "}
              <Link
                href="/consultations"
                className="font-medium text-saffron-700 hover:underline"
              >
                {t("la.bookConsultation")}
              </Link>
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a) => {
              const status = statusOf(a.slug);
              const s = STATUS_STYLE[status];
              return (
                <Link
                  key={a.slug}
                  href={`/live-astrology/${a.slug}`}
                  className="group flex flex-col rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-saffron-50 text-2xl"
                      aria-hidden
                    >
                      {a.avatar}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${s.text}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                      {t(STATUS_KEY[status])}
                    </span>
                  </div>
                  <h2 className="mt-3 font-heading text-lg text-maroon-700 group-hover:text-saffron-700">
                    {a.name}
                  </h2>
                  <p className="text-xs text-foreground/55">
                    ⭐ {a.rating.toFixed(1)} ({formatNumber(a.reviews, loc)}) ·{" "}
                    {t("la.yrs", { n: a.experienceYears })}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.specialities.map((sp) => (
                      <span
                        key={sp}
                        className="rounded-full bg-saffron-50 px-2.5 py-0.5 text-xs text-saffron-800"
                      >
                        {sp}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-foreground/55">
                    {a.languages.join(" · ")}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-saffron-50 pt-3 text-sm">
                    <span className="text-foreground/65">
                      💬 {formatINR(a.perMinuteChat)}/min
                    </span>
                    <span className="text-foreground/65">
                      📞 {formatINR(a.perMinuteCall)}/min
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
