import { createAdminClient } from "@/lib/supabase/admin";
import {
  saveMuhuratWindow,
  deleteMuhuratWindow,
  importMuhuratWindows,
  generateMuhuratWindows,
} from "@/app/[locale]/admin/actions";
import Link from "next/link";

import { Constants } from "@/lib/database.types";
import { CITY_COORDS, tierFromScore } from "@/lib/muhurat-engine";

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

const TIER_BADGE: Record<string, string> = {
  Excellent: "bg-emerald-100 text-emerald-800",
  Good: "bg-amber-100 text-amber-800",
  Fair: "bg-stone-100 text-stone-600",
};

function hhmm(t: string) {
  return t.slice(0, 5);
}

export default async function AdminMuhuratPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const byScore = sort === "score";
  const admin = createAdminClient();

  let windowsQuery = admin.from("muhurat_windows").select("*");
  windowsQuery = byScore
    ? windowsQuery
        .order("quality_score", { ascending: false, nullsFirst: false })
        .order("date", { ascending: true })
    : windowsQuery
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

  const [windowsRes, poojasRes] = await Promise.all([
    windowsQuery,
    admin
      .from("poojas")
      .select("slug, name, requires_muhurat")
      .eq("requires_muhurat", true)
      .order("name", { ascending: true }),
  ]);

  const windows = windowsRes.data ?? [];
  const muhuratPoojas = poojasRes.data ?? [];
  const categories = Constants.public.Enums.pooja_category;
  const cities = Object.keys(CITY_COORDS);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Muhurat calendar</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Auspicious windows for ceremonies that need a muhurat. Approved windows
        are offered to customers; leave a window pending until an astrologer
        verifies it. Set a specific pooja, or a category to cover all its
        poojas.
      </p>

      {/* Add window */}
      <form
        action={saveMuhuratWindow}
        className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
      >
        <h2 className="font-heading text-lg text-maroon-700">Add a window</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-foreground/65">
            Date
            <input name="date" type="date" required className={inputClass} />
          </label>
          <label className="text-xs text-foreground/65">
            Start
            <input name="start_time" type="time" required className={inputClass} />
          </label>
          <label className="text-xs text-foreground/65">
            End
            <input name="end_time" type="time" required className={inputClass} />
          </label>
          <label className="text-xs text-foreground/65">
            Label
            <input
              name="label"
              placeholder="e.g. Abhijit Muhurat"
              className={inputClass}
            />
          </label>
          <label className="text-xs text-foreground/65">
            Specific pooja (optional)
            <select name="pooja_slug" className={inputClass} defaultValue="">
              <option value="">— Any in category —</option>
              {muhuratPoojas.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-foreground/65">
            Category (if no pooja)
            <select name="category" className={inputClass} defaultValue="">
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-foreground/65 sm:col-span-2">
            Note
            <input
              name="note"
              placeholder="Tithi / nakshatra reference"
              className={inputClass}
            />
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-foreground/70">
            <input type="checkbox" name="approved" /> Approved (show to customers)
          </label>
          <button
            type="submit"
            className="rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            Add window
          </button>
        </div>
      </form>

      {/* Computed generation */}
      <form
        action={generateMuhuratWindows}
        className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
      >
        <h2 className="font-heading text-lg text-maroon-700">
          Generate (computed engine)
        </h2>
        <p className="mt-1 text-xs text-foreground/65">
          Computes muhurats from astronomy — no external API. <strong>Abhijit</strong>
          {" "}gives the daily auspicious midday window (with Rahu/Yamaganda/Gulika
          to avoid). <strong>Ceremony</strong> filters to dates whose
          nakshatra/tithi favour the chosen pooja (Vivah, Griha Pravesh,
          Namkaran, Mundan, …) using its classical rules. <strong>Choghadiya</strong>
          {" "}emits each day&apos;s auspicious daytime slots (Amrit/Shubh/Labh,
          scored). All rows land <strong>pending</strong> for astrologer approval.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="text-xs text-foreground/65">
            Mode
            <select name="mode" className={inputClass} defaultValue="ceremony">
              <option value="ceremony">Ceremony (by pooja rules)</option>
              <option value="abhijit">Abhijit (daily)</option>
              <option value="choghadiya">Choghadiya (auspicious slots)</option>
            </select>
          </label>
          <label className="text-xs text-foreground/65">
            From
            <input
              name="from"
              type="date"
              required
              defaultValue={today}
              className={inputClass}
            />
          </label>
          <label className="text-xs text-foreground/65">
            To
            <input name="to" type="date" required className={inputClass} />
          </label>
          <label className="text-xs text-foreground/65">
            City
            <select name="city" className={inputClass} defaultValue="New Delhi">
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-foreground/65">
            Pooja (optional)
            <select name="scope" className={inputClass} defaultValue="">
              <option value="">— All / any —</option>
              {muhuratPoojas.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-full bg-maroon-700 px-5 py-2 text-sm font-semibold text-white hover:bg-maroon-800"
            >
              Generate
            </button>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-foreground/70">
          <input type="checkbox" name="strict" defaultChecked />
          Strict rules (Ceremony mode: apply masa &amp; planetary exclusions —
          Kharmas/Chaturmas, Guru/Shukra asta, Vishti) · also includes the Char
          slot in Choghadiya mode
        </label>
      </form>

      {/* Bulk import */}
      <form
        action={importMuhuratWindows}
        className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
      >
        <h2 className="font-heading text-lg text-maroon-700">
          Bulk import (CSV)
        </h2>
        <p className="mt-1 text-xs text-foreground/65">
          One window per line:{" "}
          <code className="rounded bg-cream px-1">
            date, start, end, scope, label, note
          </code>
          . <strong>scope</strong> is a pooja slug (e.g. <code>griha-pravesh</code>),
          a category (e.g. <code>Life Event</code>), or blank for all ceremonies.
          Source-agnostic — paste candidates from any panchang source; all rows
          import as <strong>pending</strong> until an astrologer approves them.
        </p>
        <textarea
          name="csv"
          rows={5}
          placeholder={`2026-11-12, 06:24, 08:10, griha-pravesh, Abhijit Muhurat, Tithi Dwitiya\n2026-11-19, 10:30, 12:15, Life Event, , Rohini Nakshatra`}
          className="mt-3 w-full rounded-lg border border-saffron-200 bg-cream px-3 py-2 font-mono text-xs outline-none focus:border-saffron-400"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-maroon-700 px-5 py-2 text-sm font-semibold text-white hover:bg-maroon-800"
          >
            Import windows
          </button>
        </div>
      </form>

      {/* Existing */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-heading text-lg text-maroon-700">
          Windows ({windows.length})
        </h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-foreground/65">Sort:</span>
          <Link
            href="/admin/muhurat"
            className={`rounded-full px-3 py-1 font-semibold ${
              !byScore
                ? "bg-saffron-700 text-white"
                : "border border-saffron-200 text-saffron-700"
            }`}
          >
            Date
          </Link>
          <Link
            href="/admin/muhurat?sort=score"
            className={`rounded-full px-3 py-1 font-semibold ${
              byScore
                ? "bg-saffron-700 text-white"
                : "border border-saffron-200 text-saffron-700"
            }`}
          >
            Score
          </Link>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {windows.length === 0 ? (
          <p className="text-sm text-foreground/65">
            No muhurat windows yet. Add the auspicious dates and times above.
          </p>
        ) : (
          windows.map((w) => (
            <div
              key={w.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-saffron-100 bg-white p-3 text-sm shadow-sm"
            >
              <span className="font-medium text-maroon-700">{w.date}</span>
              <span className="text-foreground/70">
                {hhmm(w.start_time)}–{hhmm(w.end_time)}
              </span>
              <span className="text-foreground/65">
                {w.pooja_slug ?? w.category ?? "All ceremonies"}
                {w.label ? ` · ${w.label}` : ""}
              </span>
              {w.quality_score != null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    TIER_BADGE[tierFromScore(w.quality_score)]
                  }`}
                  title={`Computed quality score ${w.quality_score}/100`}
                >
                  {tierFromScore(w.quality_score)} {w.quality_score}
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  w.approved
                    ? "bg-green-50 text-green-700"
                    : "bg-gold-400 text-maroon-800"
                }`}
              >
                {w.approved ? "Approved" : "Pending"}
              </span>

              <div className="ml-auto flex items-center gap-2">
                {/* Toggle approval */}
                <form action={saveMuhuratWindow}>
                  <input type="hidden" name="id" value={w.id} />
                  <input type="hidden" name="date" value={w.date} />
                  <input type="hidden" name="start_time" value={w.start_time} />
                  <input type="hidden" name="end_time" value={w.end_time} />
                  <input type="hidden" name="category" value={w.category ?? ""} />
                  <input
                    type="hidden"
                    name="pooja_slug"
                    value={w.pooja_slug ?? ""}
                  />
                  <input type="hidden" name="label" value={w.label ?? ""} />
                  <input type="hidden" name="note" value={w.note ?? ""} />
                  <input type="hidden" name="source" value={w.source} />
                  {!w.approved && (
                    <input type="hidden" name="approved" value="on" />
                  )}
                  <button
                    type="submit"
                    className="rounded-full border border-saffron-300 px-3 py-1 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
                  >
                    {w.approved ? "Unapprove" : "Approve"}
                  </button>
                </form>
                {/* Delete */}
                <form action={deleteMuhuratWindow}>
                  <input type="hidden" name="id" value={w.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-maroon-200 px-3 py-1 text-xs font-semibold text-maroon-600 hover:bg-maroon-50"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
