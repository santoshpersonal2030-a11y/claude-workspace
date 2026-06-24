import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import {
  addAddress,
  setDefaultAddress,
  deleteAddress,
} from "@/app/[locale]/account/addresses/actions";

export const metadata = { title: "Saved Addresses" };

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-3 py-2 text-sm outline-none focus:border-saffron-400";

export default async function AddressesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/addresses");

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <Link
            href="/account/profile"
            className="text-sm text-foreground/65 hover:text-saffron-700"
          >
            ← My account
          </Link>
          <h1 className="mt-2 font-heading text-3xl text-maroon-800">
            Saved addresses
          </h1>
          <p className="mt-1 text-sm text-foreground/65">
            Save the places you book ceremonies for, so checkout is quicker.
          </p>

          <div className="mt-6 space-y-3">
            {(addresses ?? []).length === 0 ? (
              <p className="text-sm text-foreground/65">
                No saved addresses yet.
              </p>
            ) : (
              addresses?.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-start gap-3 rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-48 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-maroon-700">
                        {a.label || "Address"}
                      </span>
                      {a.is_default && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground/70">
                      {a.address}
                      {a.city ? `, ${a.city}` : ""}
                      {a.pincode ? ` · ${a.pincode}` : ""}
                    </p>
                  </div>
                  {!a.is_default && (
                    <form action={setDefaultAddress}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-saffron-300 px-3 py-1 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
                      >
                        Set default
                      </button>
                    </form>
                  )}
                  <form action={deleteAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-stone-200 px-3 py-1 text-xs text-foreground/65 hover:border-red-300 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>

          <form
            action={addAddress}
            className="mt-8 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
          >
            <h2 className="font-heading text-lg text-maroon-700">
              Add an address
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                name="label"
                aria-label="Address label"
                placeholder="Label (e.g. Home, Parents')"
                className={`${inputClass} sm:col-span-2`}
              />
              <textarea
                name="address"
                required
                rows={2}
                aria-label="Full address"
                placeholder="Full address"
                className={`${inputClass} sm:col-span-2`}
              />
              <input name="city" required aria-label="City" placeholder="City" className={inputClass} />
              <input name="pincode" aria-label="Pincode" placeholder="Pincode" className={inputClass} />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-foreground/70">
              <input type="checkbox" name="is_default" /> Make this my default
              address
            </label>
            <button
              type="submit"
              className="mt-4 rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
            >
              Save address
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
