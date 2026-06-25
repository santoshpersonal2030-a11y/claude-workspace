import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatINR } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My Consultations" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending payment",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-sky-100 text-sky-800",
  cancelled: "bg-stone-200 text-stone-600",
};

export default async function AccountConsultationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account/consultations");

  const { data: consults } = await supabase
    .from("consultation_bookings")
    .select(
      "id, service_name, mode, status, amount, preferred_date, preferred_time, meeting_link, created_at, assigned:pandits(full_name)",
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-heading text-3xl text-maroon-800">
              My consultations
            </h1>
            <Link
              href="/consultations"
              className="rounded-full border border-saffron-300 px-4 py-1.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
            >
              + Book a consultation
            </Link>
          </div>

          {(consults ?? []).length === 0 ? (
            <div className="mt-10 rounded-2xl border border-saffron-100 bg-white p-8 text-center shadow-sm">
              <div className="text-4xl">🔮</div>
              <p className="mt-3 text-foreground/65">
                You haven&apos;t booked a consultation yet.
              </p>
              <Link
                href="/consultations"
                className="mt-5 inline-block rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
              >
                Explore consultations
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {consults!.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-heading text-lg text-maroon-700">
                        {c.service_name}
                      </h2>
                      <p className="mt-1 text-sm text-foreground/65">
                        {c.mode === "video" ? "🎥 Video call" : "📞 Phone call"}{" "}
                        · {c.preferred_date} · {c.preferred_time}
                      </p>
                      {c.assigned?.full_name && (
                        <p className="mt-1 text-sm text-foreground/65">
                          Astrologer: {c.assigned.full_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLE[c.status] ?? "bg-stone-100"
                        }`}
                      >
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                      <p className="mt-2 font-heading text-lg text-saffron-700">
                        {formatINR(c.amount)}
                      </p>
                    </div>
                  </div>

                  {c.status === "confirmed" && c.mode === "video" && (
                    <div className="mt-4 border-t border-saffron-50 pt-3 text-sm">
                      <Link
                        href={`/account/consultations/${c.id}/live`}
                        className="inline-block rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
                      >
                        🎥 Join video call →
                      </Link>
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
