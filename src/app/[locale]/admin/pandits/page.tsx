import { createAdminClient } from "@/lib/supabase/admin";
import { savePandit } from "@/app/[locale]/admin/actions";
import { panditTierInfo } from "@/lib/pandit-tier";

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

export default async function AdminPanditsPage() {
  const admin = createAdminClient();
  const { data: pandits } = await admin
    .from("pandits")
    .select("*")
    .order("full_name", { ascending: true });

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Pandits</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Manage the verified roster. Languages, regions and specializations are
        comma-separated. The tier badge is derived automatically from years of
        experience (Pandit &lt;5 · Acharya 5–15 · Vidwan 16+).
      </p>

      {/* Add new */}
      <form
        action={savePandit}
        className="mt-4 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
      >
        <h2 className="font-heading text-lg text-maroon-700">Add a Pandit</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input name="full_name" aria-label="Full name" placeholder="Full name" required className={inputClass} />
          <input name="slug" aria-label="URL slug" placeholder="slug" required className={inputClass} />
          <input
            name="experience_years"
            type="number"
            aria-label="Experience in years"
            placeholder="Experience (years)"
            className={inputClass}
          />
          <input
            name="languages"
            aria-label="Languages"
            placeholder="Languages (Hindi, Sanskrit)"
            className={inputClass}
          />
          <input
            name="regions"
            aria-label="Regions"
            placeholder="Regions (Pune, Mumbai)"
            className={inputClass}
          />
          <input
            name="specializations"
            aria-label="Specializations"
            placeholder="Specializations (Home, Havan, Shanti)"
            title="Pooja categories (Home, Festival, Life Event, Remedial, Ancestral) and/or ritual types (Sanskar, Pooja, Havan, Shanti, Katha, Abhishek, Shraddh)"
            className={inputClass}
          />
          <input
            name="home_pincode"
            aria-label="Home pincode"
            placeholder="Home pincode (411004)"
            title="Local band — no travel fee"
            className={inputClass}
          />
          <input
            name="service_pincodes"
            aria-label="Service pincodes"
            placeholder="Service pincodes (411004, 411001)"
            title="All pincodes the priest will travel to"
            className={inputClass}
          />
          <input
            name="max_travel_mins"
            type="number"
            aria-label="Maximum travel minutes"
            placeholder="Max travel mins (30)"
            className={inputClass}
          />
          <input
            name="rating"
            type="number"
            step="0.1"
            aria-label="Rating (0 to 5)"
            placeholder="Rating (0–5)"
            className={inputClass}
          />
          <input
            name="review_count"
            type="number"
            aria-label="Review count"
            placeholder="Reviews"
            className={inputClass}
          />
          <input
            name="bio"
            aria-label="Short bio"
            placeholder="Short bio"
            className={`${inputClass} sm:col-span-2`}
          />
          <label className="text-xs text-foreground/65 sm:col-span-1">
            Photo
            <input
              name="photo"
              type="file"
              accept="image/*"
              className={`${inputClass} file:mr-2 file:rounded file:border-0 file:bg-saffron-100 file:px-2 file:py-1 file:text-xs file:text-saffron-700`}
            />
          </label>
          <textarea
            name="qualifications"
            aria-label="Qualifications, one per line"
            placeholder="Qualifications — one per line"
            rows={3}
            className={`${inputClass} sm:col-span-2 lg:col-span-1`}
          />
          <textarea
            name="achievements"
            aria-label="Achievements, one per line"
            placeholder="Achievements — one per line"
            rows={3}
            className={`${inputClass} sm:col-span-2`}
          />
          <input
            name="login_email"
            type="email"
            aria-label="Portal login email"
            placeholder="Portal login email (optional)"
            title="The email this priest signs in with — links their self-service portal"
            className={`${inputClass} sm:col-span-2 lg:col-span-1`}
          />
          <input
            name="phone"
            type="tel"
            aria-label="Mobile number for SMS"
            placeholder="Mobile for SMS (optional)"
            title="Priest's mobile for transactional SMS alerts (10-digit)"
            className={`${inputClass} sm:col-span-2 lg:col-span-1`}
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-4 text-sm text-foreground/70">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="verified" defaultChecked /> Verified
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="active" defaultChecked /> Active
            </label>
          </div>
          <button
            type="submit"
            className="rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            Add Pandit
          </button>
        </div>
      </form>

      {/* Existing */}
      <div className="mt-4 space-y-3">
        {pandits?.map((p) => (
          <form
            key={p.id}
            action={savePandit}
            className="grid items-center gap-2 rounded-xl border border-saffron-100 bg-white p-3 shadow-sm sm:grid-cols-[1.2fr_1fr_1fr_1fr_0.6fr_0.6fr_auto]"
          >
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="slug" value={p.slug ?? ""} />
            <input type="hidden" name="bio" defaultValue={p.bio ?? ""} />
            <input type="hidden" name="photo_url" defaultValue={p.photo_url ?? ""} />
            <input
              name="full_name"
              defaultValue={p.full_name}
              className={inputClass}
            />
            <input
              name="languages"
              defaultValue={p.languages.join(", ")}
              placeholder="Languages"
              className={inputClass}
            />
            <input
              name="regions"
              defaultValue={p.regions.join(", ")}
              placeholder="Regions"
              className={inputClass}
            />
            <input
              name="specializations"
              defaultValue={(p.specializations ?? []).join(", ")}
              placeholder="Specializations"
              title="Pooja categories (Home, Festival, Life Event, Remedial, Ancestral) and/or ritual types (Sanskar, Pooja, Havan, Shanti, Katha, Abhishek, Shraddh)"
              className={inputClass}
            />
            <input
              name="experience_years"
              type="number"
              defaultValue={p.experience_years ?? 0}
              title={`Experience (years) — tier: ${panditTierInfo(p.experience_years ?? 0).tier}`}
              className={inputClass}
            />
            <input
              name="rating"
              type="number"
              step="0.1"
              defaultValue={p.rating}
              title="Rating"
              className={inputClass}
            />
            <div className="grid gap-2 sm:col-span-full sm:grid-cols-3">
              <input
                name="home_pincode"
                defaultValue={p.home_pincode ?? ""}
                placeholder="Home pincode (local, no fee)"
                className={inputClass}
              />
              <input
                name="service_pincodes"
                defaultValue={(p.service_pincodes ?? []).join(", ")}
                placeholder="Service pincodes (comma-separated)"
                className={inputClass}
              />
              <input
                name="max_travel_mins"
                type="number"
                defaultValue={p.max_travel_mins ?? 30}
                title="Max travel minutes"
                placeholder="Max travel mins"
                className={inputClass}
              />
            </div>
            <div className="grid gap-2 sm:col-span-full sm:grid-cols-[auto_auto_1fr]">
              <label className="flex items-center gap-1 text-xs text-foreground/65">
                Works
                <input
                  name="work_start"
                  type="time"
                  defaultValue={(p.work_start ?? "06:00").slice(0, 5)}
                  title="Earliest a pooja can start"
                  className={inputClass}
                />
              </label>
              <label className="flex items-center gap-1 text-xs text-foreground/65">
                to
                <input
                  name="work_end"
                  type="time"
                  defaultValue={(p.work_end ?? "21:00").slice(0, 5)}
                  title="Latest a pooja must finish"
                  className={inputClass}
                />
              </label>
              <input
                name="blackout_dates"
                defaultValue={(p.blackout_dates ?? []).join(", ")}
                placeholder="Blackout dates (2026-11-01, 2026-11-12)"
                title="Dates the priest is unavailable (YYYY-MM-DD, comma-separated)"
                className={inputClass}
              />
            </div>
            <div className="grid gap-2 sm:col-span-full sm:grid-cols-[auto_1fr_1fr]">
              <label className="flex flex-col gap-1 text-xs text-foreground/65">
                Photo
                <input
                  name="photo"
                  type="file"
                  accept="image/*"
                  title={
                    p.photo_url ? "Replaces the current photo" : "Upload a photo"
                  }
                  className={`${inputClass} file:mr-2 file:rounded file:border-0 file:bg-saffron-100 file:px-2 file:py-1 file:text-xs file:text-saffron-700`}
                />
                {p.photo_url && (
                  <span className="text-[10px] text-green-700">
                    ✓ photo set
                  </span>
                )}
              </label>
              <textarea
                name="qualifications"
                defaultValue={(p.qualifications ?? []).join("\n")}
                placeholder="Qualifications — one per line"
                rows={3}
                className={inputClass}
              />
              <textarea
                name="achievements"
                defaultValue={(p.achievements ?? []).join("\n")}
                placeholder="Achievements — one per line"
                rows={3}
                className={inputClass}
              />
              <input
                name="login_email"
                type="email"
                defaultValue={p.login_email ?? ""}
                placeholder="Portal login email (grants priest self-service)"
                title="The email this priest signs in with — links their portal access"
                className={inputClass}
              />
              <input
                name="phone"
                type="tel"
                defaultValue={p.phone ?? ""}
                placeholder="Mobile for SMS (10-digit)"
                title="Priest's mobile for transactional SMS alerts"
                className={inputClass}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="hidden"
                name="review_count"
                defaultValue={p.review_count}
              />
              <span
                className="rounded-full bg-saffron-50 px-2 py-0.5 text-[11px] font-semibold text-saffron-700"
                title="Derived from years of experience"
              >
                {panditTierInfo(p.experience_years ?? 0).tier}
              </span>
              <label className="flex items-center gap-1 text-xs text-foreground/70">
                <input type="checkbox" name="verified" defaultChecked={p.verified} />
                Ver.
              </label>
              <label className="flex items-center gap-1 text-xs text-foreground/70">
                <input type="checkbox" name="active" defaultChecked={p.active} />
                Act.
              </label>
              <button
                type="submit"
                className="rounded-full bg-saffron-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-saffron-800"
              >
                Save
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
