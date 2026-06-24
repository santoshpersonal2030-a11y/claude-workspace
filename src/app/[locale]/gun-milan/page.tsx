import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { moonSign, NAKSHATRAS } from "@/lib/muhurat-engine";
import { ashtakootMilan, type Person } from "@/lib/gun-milan";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.gunMilan.title"), description: t("meta.gunMilan.desc") };
}

const RASHIS = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function toPerson(date?: string, time?: string): Person | null {
  if (!date || !DATE_RE.test(date)) return null;
  const t = time && TIME_RE.test(time) ? time : "12:00";
  const [h, m] = t.split(":").map(Number);
  const ms = moonSign(date, h + m / 60);
  return ms;
}

const inputClass =
  "block w-full rounded-lg border border-saffron-200 bg-white px-3 py-2 text-sm outline-none focus:border-saffron-400";

export default async function GunMilanPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ bd?: string; bt?: string; gd?: string; gt?: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const sp = await searchParams;
  const boy = toPerson(sp.bd, sp.bt);
  const girl = toPerson(sp.gd, sp.gt);
  const result = boy && girl ? ashtakootMilan(boy, girl) : null;
  const pct = result ? Math.round((result.total / result.max) * 100) : 0;

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/" className="hover:text-saffron-700">
                {t("common.home")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{t("gm.crumb")}</span>
            </nav>
            <h1 className="mt-3 font-heading text-4xl text-maroon-800">
              {t("gm.h1")}
            </h1>
            <p className="mt-2 max-w-2xl text-lg text-foreground/70">
              {t("gm.subtitle")}
            </p>

            <form method="get" className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-saffron-100 bg-white/70 p-4">
                <h2 className="font-heading text-maroon-700">{t("gm.bride")}</h2>
                <label className="mt-2 block text-xs text-foreground/65">
                  {t("gm.dob")}
                  <input type="date" name="gd" defaultValue={sp.gd} required className={inputClass} />
                </label>
                <label className="mt-2 block text-xs text-foreground/65">
                  {t("gm.tob")}
                  <input type="time" name="gt" defaultValue={sp.gt ?? "12:00"} className={inputClass} />
                </label>
              </div>
              <div className="rounded-2xl border border-saffron-100 bg-white/70 p-4">
                <h2 className="font-heading text-maroon-700">{t("gm.groom")}</h2>
                <label className="mt-2 block text-xs text-foreground/65">
                  {t("gm.dob")}
                  <input type="date" name="bd" defaultValue={sp.bd} required className={inputClass} />
                </label>
                <label className="mt-2 block text-xs text-foreground/65">
                  {t("gm.tob")}
                  <input type="time" name="bt" defaultValue={sp.bt ?? "12:00"} className={inputClass} />
                </label>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
                >
                  {t("gm.match")}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          {!result ? (
            <p className="text-foreground/65">{t("gm.enterDetails")}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm">
                <div>
                  <div className="text-sm text-foreground/65">{t("gm.total")}</div>
                  <div className="font-heading text-4xl text-maroon-800">
                    {result.total} / {result.max}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-saffron-700">
                    {result.verdict}
                  </div>
                </div>
                <div className="text-right text-sm text-foreground/65">
                  <div>
                    {t("gm.bride")}: {NAKSHATRAS[girl!.nakshatra - 1]} · {RASHIS[girl!.rashi]}
                  </div>
                  <div>
                    {t("gm.groom")}: {NAKSHATRAS[boy!.nakshatra - 1]} · {RASHIS[boy!.rashi]}
                  </div>
                  <div className="mt-1 font-heading text-2xl text-maroon-700">
                    {pct}%
                  </div>
                </div>
              </div>

              {(result.nadiDosha || result.bhakootDosha) && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {result.nadiDosha && t("gm.nadiDosha")}
                  {result.bhakootDosha && t("gm.bhakootDosha")}
                  {t("gm.doshaNote")}
                </div>
              )}

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-saffron-200 text-left text-xs text-foreground/65">
                      <th className="py-2 pr-3">{t("gm.koota")}</th>
                      <th className="py-2 pr-3">{t("gm.meaning")}</th>
                      <th className="py-2 pr-3 text-right">{t("gm.score")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.koots.map((k) => (
                      <tr key={k.name} className="border-b border-saffron-50">
                        <td className="py-2 pr-3 font-medium text-maroon-700">
                          {k.name}
                        </td>
                        <td className="py-2 pr-3 text-foreground/65">{k.note}</td>
                        <td className="py-2 pr-3 text-right font-semibold">
                          {k.score} / {k.max}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-6 text-xs text-foreground/65">
                {t("gm.computedNote")}
              </p>
              <div className="mt-4">
                <Link
                  href="/poojas/mangal-dosh-shanti"
                  className="rounded-full border border-saffron-300 px-5 py-2 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
                >
                  {t("gm.doshaPooja")}
                </Link>
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
