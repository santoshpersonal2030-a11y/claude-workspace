import { createAdminClient } from "@/lib/supabase/admin";
import { savePooja } from "@/app/[locale]/admin/actions";
import { Constants } from "@/lib/database.types";

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

export default async function AdminPoojasPage() {
  const admin = createAdminClient();
  const { data: poojas } = await admin
    .from("poojas")
    .select("*")
    .order("name", { ascending: true });

  const categories = Constants.public.Enums.pooja_category;
  const ritualTypeOpts = Constants.public.Enums.ritual_type;

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Pooja catalog</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Adjust pricing and visibility. Changes appear on the site within a few
        minutes.
      </p>

      <div className="mt-6 space-y-3">
        {poojas?.map((p) => (
          <form
            key={p.id}
            action={savePooja}
            className="grid items-center gap-2 rounded-xl border border-saffron-100 bg-white p-3 shadow-sm sm:grid-cols-[1.4fr_1fr_0.9fr_0.9fr_0.9fr_0.6fr_auto]"
          >
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="duration_hours" value={p.duration_hours} />
            <input name="name" defaultValue={p.name} className={inputClass} />
            <select
              name="category"
              defaultValue={p.category}
              className={inputClass}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              name="ritual_type"
              defaultValue={p.ritual_type}
              className={inputClass}
            >
              {ritualTypeOpts.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              name="starting_price"
              type="number"
              defaultValue={p.starting_price}
              placeholder="Price ₹"
              className={inputClass}
            />
            <input
              name="samagri_kit_price"
              type="number"
              defaultValue={p.samagri_kit_price ?? ""}
              placeholder="Kit ₹"
              className={inputClass}
            />
            <div className="flex flex-col gap-1 text-xs text-foreground/70">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={p.active}
                />
                Active
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  name="popular"
                  defaultChecked={p.popular}
                />
                Popular
              </label>
              <label
                className="flex items-center gap-1"
                title="Needs an auspicious muhurat (propose-then-confirm). Off = flexible timing."
              >
                <input
                  type="checkbox"
                  name="requires_muhurat"
                  defaultChecked={p.requires_muhurat}
                />
                Muhurat
              </label>
            </div>
            <button
              type="submit"
              className="rounded-full bg-saffron-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-saffron-800"
            >
              Save
            </button>

            <details className="sm:col-span-full">
              <summary className="cursor-pointer text-xs font-medium text-saffron-700">
                Long description &amp; what&apos;s included
              </summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-foreground/65">
                  Long description
                  <textarea
                    name="long_description"
                    defaultValue={p.long_description ?? ""}
                    rows={4}
                    placeholder="A fuller description shown on the pooja page…"
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="text-xs text-foreground/65">
                  What&apos;s included (one per line)
                  <textarea
                    name="includes"
                    defaultValue={(p.includes ?? []).join("\n")}
                    rows={4}
                    placeholder={
                      "Leave blank to use the standard inclusions.\nOtherwise one bullet per line."
                    }
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
              </div>
            </details>
          </form>
        ))}
      </div>
    </div>
  );
}
