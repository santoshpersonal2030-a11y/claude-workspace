import { redirect } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { cadenceLabel, WEEKDAY_NAMES, type Cadence } from "@/lib/recurrence";
import { timeSlots, languages } from "@/lib/poojas";
import {
  createSubscription,
  setSubscriptionActive,
  deleteSubscription,
} from "@/app/[locale]/account/subscriptions/actions";

export const metadata = { title: "Recurring Poojas" };

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-3 py-2 text-sm outline-none focus:border-saffron-400";

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/subscriptions");

  const [{ data: subs }, { data: poojaOptions }] = await Promise.all([
    supabase
      .from("pooja_subscriptions")
      .select("*, poojas(name, emoji)")
      .order("created_at", { ascending: false }),
    supabase
      .from("poojas")
      .select("id, name")
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <h1 className="font-heading text-3xl text-maroon-800">
            Recurring poojas
          </h1>
          <p className="mt-2 text-foreground/65">
            Set up a pooja to repeat — say a monthly Satyanarayan Katha or a
            weekly aarti. We&apos;ll schedule each one automatically and email you
            to confirm; you pay per occurrence as usual.
          </p>

          {/* Existing subscriptions */}
          <div className="mt-4 space-y-3">
            {(subs ?? []).length === 0 ? (
              <p className="text-sm text-foreground/65">
                No recurring poojas yet — add one below.
              </p>
            ) : (
              subs?.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
                >
                  <span className="text-2xl">{s.poojas?.emoji ?? "🪔"}</span>
                  <div className="min-w-48 flex-1">
                    <div className="font-heading text-lg text-maroon-700">
                      {s.poojas?.name ?? "Pooja"}
                    </div>
                    <div className="text-xs text-foreground/65">
                      {cadenceLabel(s.cadence as Cadence, s.anchor_day)} ·{" "}
                      {s.time_slot} · next {s.next_run}
                      {s.city ? ` · ${s.city}` : ""}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      s.active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {s.active ? "Active" : "Paused"}
                  </span>
                  <form action={setSubscriptionActive}>
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={(!s.active).toString()}
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-saffron-300 px-3 py-1 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
                    >
                      {s.active ? "Pause" : "Resume"}
                    </button>
                  </form>
                  <form action={deleteSubscription}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-stone-200 px-3 py-1 text-xs text-foreground/65 hover:border-red-300 hover:text-red-600"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>

          {/* Create a subscription */}
          <form
            action={createSubscription}
            className="mt-4 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
          >
            <h2 className="font-heading text-lg text-maroon-700">
              Add a recurring pooja
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-foreground/65">
                Pooja
                <select name="pooja_id" required className={`mt-1 ${inputClass}`}>
                  {(poojaOptions ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-foreground/65">
                Repeats
                <select name="cadence" className={`mt-1 ${inputClass}`}>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
              <label className="text-xs text-foreground/65">
                If monthly — day of month
                <select name="monthday" defaultValue="1" className={`mt-1 ${inputClass}`}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-foreground/65">
                If weekly — weekday
                <select name="weekday" defaultValue="1" className={`mt-1 ${inputClass}`}>
                  {WEEKDAY_NAMES.map((w, i) => (
                    <option key={w} value={i}>
                      {w}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-foreground/65">
                Time
                <select name="time_slot" required className={`mt-1 ${inputClass}`}>
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-foreground/65">
                Language
                <select name="language" className={`mt-1 ${inputClass}`}>
                  <option value="">—</option>
                  {languages.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-foreground/65 sm:col-span-2">
                Address
                <textarea
                  name="address"
                  rows={2}
                  required
                  className={`mt-1 ${inputClass}`}
                />
              </label>
              <label className="text-xs text-foreground/65">
                City
                <input name="city" required className={`mt-1 ${inputClass}`} />
              </label>
              <label className="text-xs text-foreground/65">
                Pincode
                <input name="pincode" className={`mt-1 ${inputClass}`} />
              </label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-foreground/70">
              <input type="checkbox" name="samagri_kit" /> Include a samagri kit
              each time
            </label>
            <button
              type="submit"
              className="mt-4 rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
            >
              Add recurring pooja
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
