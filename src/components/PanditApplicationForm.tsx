"use client";

import { useState } from "react";

import { languages } from "@/lib/poojas";

const inputClass =
  "w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100";

const ID_TYPES = ["Aadhaar", "PAN", "Voter ID", "Driving Licence", "Passport"];

export default function PanditApplicationForm() {
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
      if (!res.ok) throw new Error(data.error ?? "Could not submit.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-saffron-100 bg-white p-8 text-center shadow-sm">
        <div className="text-4xl">🙏</div>
        <h2 className="mt-3 font-heading text-2xl text-maroon-700">
          Application received
        </h2>
        <p className="mt-2 text-sm text-foreground/65">
          Thank you for applying to join BookMyPoojari. Our team will verify
          your details and reach out on the phone number you provided.
        </p>
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
          Full name *
          <input name="full_name" required className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs text-foreground/65">
          Phone *
          <input
            name="phone"
            type="tel"
            required
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="text-xs text-foreground/65">
          Email
          <input name="email" type="email" className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs text-foreground/65">
          City
          <input name="city" className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs text-foreground/65">
          Years of experience
          <input
            name="experience_years"
            type="number"
            min={0}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="text-xs text-foreground/65">
          Home pincode
          <input
            name="home_pincode"
            inputMode="numeric"
            className={`mt-1 ${inputClass}`}
          />
        </label>
      </div>

      <label className="block text-xs text-foreground/65">
        Languages you perform in (comma-separated)
        <input
          name="languages"
          placeholder={languages.slice(0, 3).join(", ")}
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <label className="block text-xs text-foreground/65">
        Specialisations / ceremonies (comma-separated)
        <input
          name="specializations"
          placeholder="Satyanarayan Katha, Griha Pravesh, Vivah"
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <label className="block text-xs text-foreground/65">
        Qualifications / lineage (one per line)
        <textarea name="qualifications" rows={2} className={`mt-1 ${inputClass}`} />
      </label>
      <label className="block text-xs text-foreground/65">
        About you
        <textarea name="bio" rows={3} className={`mt-1 ${inputClass}`} />
      </label>

      <div className="rounded-xl border border-saffron-100 bg-saffron-50/50 p-4">
        <h3 className="text-sm font-semibold text-maroon-700">
          Identity verification (KYC)
        </h3>
        <p className="mt-1 text-xs text-foreground/65">
          Your ID is used only for verification and is never shown publicly.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="text-xs text-foreground/65">
            ID type *
            <select name="id_type" required className={`mt-1 ${inputClass}`}>
              <option value="">Select…</option>
              {ID_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-foreground/65">
            ID number *
            <input name="id_number" required className={`mt-1 ${inputClass}`} />
          </label>
          <label className="text-xs text-foreground/65">
            Upload ID document
            <input
              name="id_doc"
              type="file"
              accept="image/*,application/pdf"
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="text-xs text-foreground/65">
            Profile photo
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
        className="w-full rounded-full bg-saffron-600 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700 disabled:opacity-60"
      >
        {busy ? "Submitting…" : "Submit application"}
      </button>
      <p className="text-center text-xs text-foreground/65">
        By applying you agree to our verification process and terms.
      </p>
    </form>
  );
}
