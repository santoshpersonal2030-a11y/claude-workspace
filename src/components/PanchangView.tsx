import Link from "next/link";

import type { Choghadiya, FullPanchanga } from "@/lib/muhurat-engine";
import type { Translator } from "@/lib/i18n";

// A titled 8-slot choghadiya grid (day or night).
function ChoghGrid({ title, slots }: { title: string; slots: Choghadiya[] }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-foreground/60">{title}</h3>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {slots.map((c, i) => (
          <div
            key={i}
            className={`rounded-xl border p-3 ${CHOGH_STYLE[c.quality]}`}
          >
            <div className="font-heading text-base">{c.name}</div>
            <div className="text-xs opacity-80">
              {to12h(c.start)} – {to12h(c.end)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Choghadiya card colours by auspiciousness.
const CHOGH_STYLE: Record<string, string> = {
  good: "border-emerald-200 bg-emerald-50/60 text-emerald-900",
  neutral: "border-saffron-200 bg-white text-foreground/80",
  bad: "border-red-200 bg-red-50/50 text-red-900",
};

// 12-hour time from minutes-since-midnight (IST).
function to12h(mins: number): string {
  const t = Math.round(mins);
  let h = Math.floor(t / 60) % 24;
  const m = t % 60;
  const ap = h < 12 ? "AM" : "PM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

// Renders the panchang body (five limbs + sun + auspicious/inauspicious + CTAs)
// for an already-computed FullPanchanga. Shared by /panchang and /panchang/[date].
export default function PanchangView({
  pan,
  city,
  t,
}: {
  pan: FullPanchanga;
  city: string;
  t: Translator;
}) {
  const limbs = [
    { label: t("pv.limbTithi"), value: pan.tithi.name },
    { label: t("pv.limbNakshatra"), value: pan.nakshatra.name },
    { label: t("pv.limbYoga"), value: pan.yoga.name },
    { label: t("pv.limbKarana"), value: pan.karana.name },
    { label: t("pv.limbVaara"), value: pan.weekday },
    { label: t("pv.limbSunSign"), value: pan.sunRashi },
  ];
  const avoid = [
    { label: t("pv.rahu"), p: pan.rahu },
    { label: t("pv.yamaganda"), p: pan.yamaganda },
    { label: t("pv.gulika"), p: pan.gulika },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl text-maroon-800">
          {t("pv.fiveLimbs")}
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {limbs.map((l) => (
            <div
              key={l.label}
              className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
            >
              <div className="text-xs text-foreground/50">{l.label}</div>
              <div className="mt-1 font-heading text-lg text-maroon-700">
                {l.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
          <h3 className="font-heading text-lg text-maroon-700">{t("pv.sun")}</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-foreground/60">{t("pv.sunrise")}</dt>
              <dd className="font-medium">{to12h(pan.sunrise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground/60">{t("pv.sunset")}</dt>
              <dd className="font-medium">{to12h(pan.sunset)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
          <h3 className="font-heading text-lg text-emerald-800">
            {t("pv.auspicious")}
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-foreground/60">{t("pv.abhijit")}</dt>
              <dd className="font-medium text-emerald-800">
                {to12h(pan.abhijit.start)} – {to12h(pan.abhijit.end)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5 shadow-sm">
          <h3 className="font-heading text-lg text-red-800">
            {t("pv.inauspicious")}
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            {avoid.map((a) => (
              <div key={a.label} className="flex justify-between">
                <dt className="text-foreground/60">{a.label}</dt>
                <dd className="font-medium text-red-800">
                  {to12h(a.p.start)} – {to12h(a.p.end)}
                </dd>
              </div>
            ))}
            {pan.karana.isVishti && (
              <p className="pt-1 text-xs text-red-700">{t("pv.vishti")}</p>
            )}
            {pan.retrogrades.length > 0 && (
              <p className="pt-1 text-xs text-red-700">
                {t("pv.retro", { list: pan.retrogrades.join(", ") })}
              </p>
            )}
          </dl>
        </div>
      </div>

      {pan.choghadiya.day.length > 0 && (
        <div>
          <h2 className="font-heading text-2xl text-maroon-800">
            {t("pv.chogh")}
          </h2>
          <p className="mt-1 text-sm text-foreground/55">{t("pv.choghNote")}</p>
          <ChoghGrid title={t("pv.day")} slots={pan.choghadiya.day} />
          {pan.choghadiya.night.length > 0 && (
            <ChoghGrid title={t("pv.night")} slots={pan.choghadiya.night} />
          )}
          <p className="mt-3 text-xs text-foreground/45">
            <Link href="/choghadiya" className="text-saffron-700 hover:underline">
              {t("pv.openChogh")}
            </Link>
          </p>
        </div>
      )}

      <p className="text-xs text-foreground/45">
        {t("pv.computedNote", { city })}
      </p>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm">
        <Link
          href="/muhurat"
          className="rounded-full bg-saffron-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-700"
        >
          {t("pv.seeDates")}
        </Link>
        <Link
          href="/poojas"
          className="rounded-full border border-saffron-300 px-6 py-2.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
        >
          {t("pv.bookPandit")}
        </Link>
      </div>
    </div>
  );
}
