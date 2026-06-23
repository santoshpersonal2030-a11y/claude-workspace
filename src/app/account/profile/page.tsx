import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/app/account/profile/actions";

export const metadata = { title: "My Account" };

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-3 py-2 text-sm outline-none focus:border-saffron-400";

const ACCOUNT_LINKS = [
  { href: "/account/bookings", label: "My bookings", emoji: "🪔" },
  { href: "/account/orders", label: "My orders", emoji: "📦" },
  { href: "/account/subscriptions", label: "Recurring poojas", emoji: "🔁" },
  { href: "/account/addresses", label: "Saved addresses", emoji: "📍" },
  { href: "/account/wishlist", label: "Wishlist", emoji: "♡" },
];

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email, marketing_consent")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h1 className="font-heading text-3xl text-maroon-800">My account</h1>

          <div className="mt-6 flex flex-wrap gap-2">
            {ACCOUNT_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full border border-saffron-200 bg-white px-4 py-1.5 text-sm text-saffron-700 hover:bg-saffron-50"
              >
                {l.emoji} {l.label}
              </Link>
            ))}
          </div>

          <form
            action={updateProfile}
            className="mt-8 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
          >
            <h2 className="font-heading text-lg text-maroon-700">
              Profile details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-foreground/60">
                Full name
                <input
                  name="full_name"
                  defaultValue={profile?.full_name ?? ""}
                  className={`mt-1 ${inputClass}`}
                />
              </label>
              <label className="text-xs text-foreground/60">
                Phone
                <input
                  name="phone"
                  type="tel"
                  defaultValue={profile?.phone ?? ""}
                  className={`mt-1 ${inputClass}`}
                />
              </label>
              <label className="text-xs text-foreground/60 sm:col-span-2">
                Email
                <input
                  defaultValue={profile?.email ?? user.email ?? ""}
                  disabled
                  className={`mt-1 ${inputClass} opacity-60`}
                />
                <span className="mt-1 block text-[11px] text-foreground/45">
                  Email is managed by your sign-in method.
                </span>
              </label>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-foreground/70">
              <input
                type="checkbox"
                name="marketing_consent"
                defaultChecked={profile?.marketing_consent ?? false}
              />
              Send me offers, festival reminders and updates
            </label>
            <button
              type="submit"
              className="mt-4 rounded-full bg-saffron-600 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-700"
            >
              Save profile
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
