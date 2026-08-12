"use client";

import { useState } from "react";

import { languages } from "@/lib/poojas";
import { useT } from "@/components/LanguageProvider";

const inputClass =
  "w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100";

/* ⚠️ `value` is what /api/pandit-application writes to pandit_applications.id_type and what the
   admin console reads back, so it MUST stay English. Only `key` (the visible label) is
   translated. Translating the value would put Hindi in a column every later KYC step treats as
   English, and nothing would notice until a real priest applied. */
const ID_TYPES = [
  { value: "Aadhaar", key: "paf.idAadhaar" },
  { value: "PAN", key: "paf.idPan" },
  { value: "Voter ID", key: "paf.idVoter" },
  { value: "Driving Licence", key: "paf.idLicence" },
  { value: "Passport", key: "paf.idPassport" },
];

export default function PanditApplicationForm() {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/pandit-application", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("paf.errSubmit"));
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("paf.errGeneric"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-saffron-100 bg-white p-8 text-center shadow-sm">
        <div className="text-4xl">🙏</div>
        <h2 className="mt-3 font-heading text-2xl text-maroon-700">
          {t("paf.doneTitle")}
        </h2>
        <p className="mt-2 text-sm text-foreground/65">{t("paf.doneBody")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-foreground/65">
          {t("paf.fullName")}
          <input name="full_name" required className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs text-foreground/65">
          {t("paf.phone")}
          <input
            name="phone"
            type="tel"
            required
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="text-xs text-foreground/65">
          {t("paf.email")}
          <input name="email" type="email" className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs text-foreground/65">
          {t("paf.city")}
          <input name="city" className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs text-foreground/65">
          {t("paf.experience")}
          <input
            name="experience_years"
            type="number"
            min={0}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="text-xs text-foreground/65">
          {t("paf.homePincode")}
          <input
            name="home_pincode"
            inputMode="numeric"
            className={`mt-1 ${inputClass}`}
          />
        </label>
      </div>

      <label className="block text-xs text-foreground/65">
        {t("paf.languages")}
        <input
          name="languages"
          placeholder={languages.slice(0, 3).join(", ")}
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <label className="block text-xs text-foreground/65">
        {t("paf.specialisations")}
        <input
          name="specializations"
          placeholder={t("paf.specialisationsPlaceholder")}
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <label className="block text-xs text-foreground/65">
        {t("paf.qualifications")}
        <textarea name="qualifications" rows={2} className={`mt-1 ${inputClass}`} />
      </label>
      <label className="block text-xs text-foreground/65">
        {t("paf.about")}
        <textarea name="bio" rows={3} className={`mt-1 ${inputClass}`} />
      </label>

      <div className="rounded-xl border border-saffron-100 bg-saffron-50/50 p-4">
        <h3 className="text-sm font-semibold text-maroon-700">
          {t("paf.kycTitle")}
        </h3>
        <p className="mt-1 text-xs text-foreground/65">{t("paf.kycNote")}</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="text-xs text-foreground/65">
            {t("paf.idType")}
            <select name="id_type" required className={`mt-1 ${inputClass}`}>
              <option value="">{t("paf.select")}</option>
              {ID_TYPES.map((it) => (
                <option key={it.value} value={it.value}>
                  {t(it.key)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-foreground/65">
            {t("paf.idNumber")}
            <input name="id_number" required className={`mt-1 ${inputClass}`} />
          </label>
          <label className="text-xs text-foreground/65">
            {t("paf.uploadId")}
            <input
              name="id_doc"
              type="file"
              accept="image/*,application/pdf"
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="text-xs text-foreground/65">
            {t("paf.photo")}
            <input
              name="photo"
              type="file"
              accept="image/*"
              className={`mt-1 ${inputClass}`}
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-maroon-50 px-3 py-2 text-sm text-maroon-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-saffron-700 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800 disabled:opacity-60"
      >
        {busy ? t("paf.submitting") : t("paf.submit")}
      </button>
      <p className="text-center text-xs text-foreground/65">
        {t("paf.terms")}
      </p>
    </form>
  );
}
