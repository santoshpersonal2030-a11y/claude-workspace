import { createAdminClient } from "@/lib/supabase/admin";
import { savePeakDay, deletePeakDay } from "@/app/[locale]/admin/actions";

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

export default async function AdminPeakDaysPage() {
  const admin = createAdminClient();
  const { data: peakDays } = await admin
    .from("peak_days")
    .select("*")
    .order("date", { ascending: true });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Peak-day pricing</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Festival and high-demand dates that add a percentage premium to the
        dakshina. The surcharge is applied server-side at booking and shown to
        the customer; commission-based priests automatically earn more on these
        dates.
      </p>

      {/* Add a peak day */}
      <form
        action={savePeakDay}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
      >
        <label className="text-xs text-foreground/60">
          Date
          <input
            name="date"
            type="date"
            required
            defaultValue={today}
            className={`block ${inputClass}`}
          />
        </label>
        <label className="flex-1 text-xs text-foreground/60">
          Label
          <input
            name="label"
            required
            placeholder="e.g. Diwali · Akshaya Tritiya"
            className={`block ${inputClass}`}
          />
        </label>
        <label className="text-xs text-foreground/60">
          Surcharge %
          <input
            name="surcharge_pct"
            type="number"
            step="1"
            min="0"
            max="200"
            defaultValue={20}
            className={`block w-28 ${inputClass}`}
          />
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-foreground/70">
          <input type="checkbox" name="active" defaultChecked /> Active
        </label>
        <button
          type="submit"
          className="rounded-full bg-saffron-600 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-700"
        >
          Save peak day
        </button>
      </form>

      {/* Existing */}
      <div className="mt-8 space-y-2">
        {(peakDays ?? []).length === 0 && (
          <p className="text-sm text-foreground/55">
            No peak days yet. Add festival dates above.
          </p>
        )}
        {peakDays?.map((d) => (
          <div
            key={d.date}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-saffron-100 bg-white p-3 text-sm shadow-sm"
          >
            <span className="font-medium text-maroon-700">{d.date}</span>
            <span className="text-foreground/70">{d.label}</span>
            <span className="rounded-full bg-saffron-50 px-2 py-0.5 text-[11px] font-semibold text-saffron-700">
              +{Number(d.surcharge_pct)}%
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                d.active
                  ? "bg-green-50 text-green-700"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {d.active ? "Active" : "Off"}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {/* Toggle active (re-saves the same row). */}
              <form action={savePeakDay}>
                <input type="hidden" name="date" value={d.date} />
                <input type="hidden" name="label" value={d.label} />
                <input
                  type="hidden"
                  name="surcharge_pct"
                  value={Number(d.surcharge_pct)}
                />
                {!d.active && <input type="hidden" name="active" value="on" />}
                <button
                  type="submit"
                  className="rounded-full border border-saffron-300 px-3 py-1 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
                >
                  {d.active ? "Turn off" : "Turn on"}
                </button>
              </form>
              <form action={deletePeakDay}>
                <input type="hidden" name="date" value={d.date} />
                <button
                  type="submit"
                  className="rounded-full border border-maroon-200 px-3 py-1 text-xs font-semibold text-maroon-600 hover:bg-maroon-50"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
