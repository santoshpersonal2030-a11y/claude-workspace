import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VideoRoom from "@/components/VideoRoom";
import { createClient } from "@/lib/supabase/server";
import { consultRoomName } from "@/lib/video";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const metadata = { title: "Video consultation", robots: { index: false } };

export default async function LiveConsultationPage({
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
  if (!user) redirect(`/login?next=/account/consultations/${id}/live`);

  const { data: consult } = await supabase
    .from("consultation_bookings")
    .select("id, mode, status, meeting_link, service_name")
    .eq("id", id)
    .maybeSingle();

  if (!consult || consult.mode !== "video") notFound();

  const ready = consult.status === "confirmed" || consult.status === "completed";
  // Don't fall back to the email — it would be shown to the astrologer.
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ?? undefined;

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-heading text-2xl text-maroon-800">
              🔮 {consult.service_name}
            </h1>
            <Link
              href="/account/consultations"
              className="text-sm font-semibold text-saffron-700 hover:text-saffron-800"
            >
              ← {t("live.backToConsults")}
            </Link>
          </div>

          <div className="mt-4">
            {!ready ? (
              <div className="rounded-2xl border border-saffron-100 bg-white p-10 text-center shadow-sm">
                <div className="text-4xl">🎥</div>
                <p className="mt-3 text-foreground/65">{t("live.notReady")}</p>
              </div>
            ) : consult.meeting_link ? (
              // An admin attached an external link (e.g. Zoom/Meet) — prefer it.
              <div className="rounded-2xl border border-saffron-100 bg-white p-10 text-center shadow-sm">
                <div className="text-4xl">🎥</div>
                <a
                  href={consult.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
                >
                  {t("live.joinConsult")} →
                </a>
              </div>
            ) : (
              <VideoRoom room={consultRoomName(consult.id)} displayName={displayName} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
