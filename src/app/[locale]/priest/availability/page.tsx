import { getPriestPandit } from "@/lib/priest";
import { updateMyAvailability } from "@/app/[locale]/priest/actions";

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-3 py-2 text-sm outline-none focus:border-saffron-400";

export default async function PriestAvailabilityPage() {
  const pandit = (await getPriestPandit())!;

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">My availability</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Set your daily working window and any dates you&apos;re unavailable. The
        scheduler uses these to offer (or block) slots to customers.
      </p>

      <form
        action={updateMyAvailability}
        className="mt-4 max-w-xl space-y-4 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-2 gap-4">
          <label className="text-xs text-foreground/65">
            Work starts
            <input
              name="work_start"
              type="time"
              defaultValue={(pandit.work_start ?? "06:00").slice(0, 5)}
              className={inputClass}
            />
          </label>
          <label className="text-xs text-foreground/65">
            Work ends
            <input
              name="work_end"
              type="time"
              defaultValue={(pandit.work_end ?? "21:00").slice(0, 5)}
              className={inputClass}
            />
          </label>
        </div>
        <label className="block text-xs text-foreground/65">
          Blackout dates (unavailable)
          <textarea
            name="blackout_dates"
            rows={3}
            defaultValue={(pandit.blackout_dates ?? []).join(", ")}
            placeholder="2026-11-01, 2026-11-12"
            className={inputClass}
          />
          <span className="mt-1 block text-[11px] text-foreground/65">
            Comma-separated YYYY-MM-DD dates.
          </span>
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-saffron-700 px-6 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            Save availability
          </button>
        </div>
      </form>

      <div className="mt-4 max-w-xl rounded-2xl border border-saffron-100 bg-white p-5 text-sm text-foreground/65 shadow-sm">
        <p className="font-medium text-maroon-700">Service area</p>
        <p className="mt-1">
          Home pincode {pandit.home_pincode ?? "—"} · serves{" "}
          {(pandit.service_pincodes ?? []).length} pincodes. Contact the admin to
          update your coverage or specializations.
        </p>
      </div>
    </div>
  );
}
