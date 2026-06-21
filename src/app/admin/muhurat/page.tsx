import { createAdminClient } from "@/lib/supabase/admin";
import {
  saveMuhuratWindow,
  deleteMuhuratWindow,
} from "@/app/admin/actions";
import { Constants } from "@/lib/database.types";

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

function hhmm(t: string) {
  return t.slice(0, 5);
}

export default async function AdminMuhuratPage() {
  const admin = createAdminClient();
  const [windowsRes, poojasRes] = await Promise.all([
    admin
      .from("muhurat_windows")
      .select("*")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true }),
    admin
      .from("poojas")
      .select("slug, name, requires_muhurat")
      .eq("requires_muhurat", true)
      .order("name", { ascending: true }),
  ]);

  const windows = windowsRes.data ?? [];
  const muhuratPoojas = poojasRes.data ?? [];
  const categories = Constants.public.Enums.pooja_category;

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Muhurat calendar</h1>
      <p className="mt-1 text-sm text-foreground/60">
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
          <label className="text-xs text-foreground/60">
            Date
            <input name="date" type="date" required className={inputClass} />
          </label>
          <label className="text-xs text-foreground/60">
            Start
            <input name="start_time" type="time" required className={inputClass} />
          </label>
          <label className="text-xs text-foreground/60">
            End
            <input name="end_time" type="time" required className={inputClass} />
          </label>
          <label className="text-xs text-foreground/60">
            Label
            <input
              name="label"
              placeholder="e.g. Abhijit Muhurat"
              className={inputClass}
            />
          </label>
          <label className="text-xs text-foreground/60">
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
          <label className="text-xs text-foreground/60">
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
          <label className="text-xs text-foreground/60 sm:col-span-2">
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
            className="rounded-full bg-saffron-600 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-700"
          >
            Add window
          </button>
        </div>
      </form>

      {/* Existing */}
      <div className="mt-8 space-y-2">
        {windows.length === 0 ? (
          <p className="text-sm text-foreground/55">
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
              <span className="text-foreground/55">
                {w.pooja_slug ?? w.category ?? "All ceremonies"}
                {w.label ? ` · ${w.label}` : ""}
              </span>
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
