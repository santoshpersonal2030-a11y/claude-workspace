import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatINR } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My Temple Pujas" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending payment",
  confirmed: "Confirmed",
  performed: "Puja performed",
  shipped: "Prasad shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  performed: "bg-sky-100 text-sky-800",
  shipped: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-stone-200 text-stone-600",
};

export default async function AccountTemplePujasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/temple-pujas");

  const { data: pujas } = await supabase
    .from("temple_puja_bookings")
    .select(
      "id, puja_name, temple_name, devotee_name, gotra, status, amount, video_url, prasad_tracking, prasad_carrier, created_at",
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-heading text-3xl text-maroon-800">
              My temple pujas
            </h1>
            <Link
              href="/temple-puja"
              className="rounded-full border border-saffron-300 px-4 py-1.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
            >
              + Book a temple puja
            </Link>
          </div>

          {(pujas ?? []).length === 0 ? (
            <div className="mt-10 rounded-2xl border border-saffron-100 bg-white p-8 text-center shadow-sm">
              <div className="text-4xl">🛕</div>
              <p className="mt-3 text-foreground/65">
                You haven&apos;t booked a temple puja yet.
              </p>
              <Link
                href="/temple-puja"
                className="mt-5 inline-block rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
              >
                Explore temple pujas
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {pujas!.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-heading text-lg text-maroon-700">
                        {p.puja_name}
                      </h2>
                      <p className="text-sm font-medium text-saffron-700">
                        {p.temple_name}
                      </p>
                      <p className="mt-1 text-sm text-foreground/65">
                        In the name of {p.devotee_name}
                        {p.gotra ? ` · gotra ${p.gotra}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLE[p.status] ?? "bg-stone-100"
                        }`}
                      >
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                      <p className="mt-2 font-heading text-lg text-saffron-700">
                        {formatINR(p.amount)}
                      </p>
                    </div>
                  </div>

                  {(p.video_url || p.prasad_tracking) && (
                    <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-saffron-50 pt-3 text-sm">
                      {p.video_url && (
                        <a
                          href={p.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
                        >
                          🎥 Watch puja video
                        </a>
                      )}
                      {p.prasad_tracking && (
                        <span className="text-foreground/70">
                          📦 Prasad{p.prasad_carrier ? ` (${p.prasad_carrier})` : ""}:{" "}
                          <span className="font-medium">{p.prasad_tracking}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
