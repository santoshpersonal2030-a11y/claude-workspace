import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VideoRoom from "@/components/VideoRoom";
import { createClient } from "@/lib/supabase/server";
import { poojaRoomName } from "@/lib/video";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const metadata = { title: "Live pooja", robots: { index: false } };

export default async function LivePoojaPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/bookings/${id}/live`);

  // RLS limits this to the user's own booking.
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, mode, status, booking_date, time_slot, poojas(name, emoji)")
    .eq("id", id)
    .maybeSingle();

  if (!booking || booking.mode !== "online") notFound();

  const ready = booking.status !== "pending" && booking.status !== "cancelled";
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    undefined;

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl text-maroon-800">
                {booking.poojas?.emoji} {booking.poojas?.name}
              </h1>
              <p className="mt-1 text-sm text-foreground/65">
                {booking.booking_date} · {booking.time_slot}
              </p>
            </div>
            <Link
              href="/account/bookings"
              className="text-sm font-semibold text-saffron-700 hover:text-saffron-800"
            >
              ← {t("live.backToBookings")}
            </Link>
          </div>

          <div className="mt-6">
            {ready ? (
              <VideoRoom room={poojaRoomName(booking.id)} displayName={displayName} />
            ) : (
              <div className="rounded-2xl border border-saffron-100 bg-white p-10 text-center shadow-sm">
                <div className="text-4xl">🎥</div>
                <p className="mt-3 text-foreground/65">{t("live.notReady")}</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
