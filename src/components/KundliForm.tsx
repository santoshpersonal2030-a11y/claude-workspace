"use client";

import { useState } from "react";
import Link from "next/link";

import { computeKundli, type Kundli } from "@/lib/kundli";
import { useT } from "@/components/LanguageProvider";

const inputClass =
  "w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100";

export default function KundliForm() {
  const t = useT();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [result, setResult] = useState<Kundli | null>(null);

  const today = new Date().toISOString().split("T")[0];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(computeKundli(dob, time || undefined));
  }

  if (result) {
    const rows = [
      { label: t("kundli.sunSign"), value: result.sunRashi },
      { label: t("kundli.moonSign"), value: result.moonRashi },
      { label: t("kundli.nakshatra"), value: result.nakshatra },
      { label: t("kundli.birthTithi"), value: result.tithi },
      { label: t("kundli.birthDay"), value: result.weekday },
    ];
    return (
      <div className="rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm">
        <div className="text-center">
          <div className="text-4xl">📜</div>
          <h2 className="mt-2 font-heading text-xl text-maroon-800">
            {t("kundli.resultTitle")}
            {name ? ` — ${name}` : ""}
          </h2>
        </div>
        <dl className="mt-5 divide-y divide-saffron-50 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-3 py-2.5">
              <dt className="text-foreground/65">{r.label}</dt>
              <dd className="font-medium text-foreground">{r.value || "—"}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 rounded-xl bg-saffron-50 px-3 py-2 text-sm text-maroon-800">
          <span className="font-medium">{t("kundli.moonNote")}: </span>
          {result.moonTrait}
        </p>
        <p className="mt-3 text-xs text-foreground/65">{t("kundli.disclaimer")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/consultations/kundli-reading"
            className="rounded-full bg-saffron-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            {t("kundli.ctaButton")}
          </Link>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="rounded-full border border-saffron-300 px-5 py-2.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
          >
            {t("kundli.edit")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="k-name" className="mb-1 block text-sm font-medium text-foreground/80">
            {t("kundli.name")}
          </label>
          <input
            id="k-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="k-dob" className="mb-1 block text-sm font-medium text-foreground/80">
              {t("kundli.dob")}
            </label>
            <input
              id="k-dob"
              type="date"
              required
              max={today}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="k-time" className="mb-1 block text-sm font-medium text-foreground/80">
              {t("kundli.time")}
            </label>
            <input
              id="k-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <p className="text-xs text-foreground/65">{t("kundli.timeHint")}</p>
        <div>
          <label htmlFor="k-place" className="mb-1 block text-sm font-medium text-foreground/80">
            {t("kundli.place")}
          </label>
          <input
            id="k-place"
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder={t("kundli.placePh")}
            className={inputClass}
          />
        </div>
      </div>
      <button
        type="submit"
        className="mt-5 w-full rounded-full bg-saffron-700 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800"
      >
        {t("kundli.generate")}
      </button>
    </form>
  );
}
