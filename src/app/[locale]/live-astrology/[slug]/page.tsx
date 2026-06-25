import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveLauncher from "@/components/LiveLauncher";
import { getAstrologer } from "@/lib/astrologers";
import { getPresence } from "@/lib/live-status";
import { voiceConfigured } from "@/lib/voice";
import { createClient } from "@/lib/supabase/server";
import { getAvailableBalance } from "@/lib/wallet";
import { formatINR } from "@/lib/poojas";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = getAstrologer(slug);
  if (!a) return { title: "Astrologer not found" };
  return {
    title: `${a.name} — Live Astrology Chat & Call`,
    description: a.shortBio,
  };
}

const STATUS_LABEL = {
  online: "Online now",
  busy: "Busy — try again shortly",
  offline: "Offline",
} as const;

export default async function AstrologerProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = getAstrologer(slug);
  if (!a) notFound();

  const presence = (await getPresence(slug)).status;
  const callAvailable = voiceConfigured();

  // Wallet balance for a signed-in visitor (so they can see if they can afford it).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const balance = user ? await getAvailableBalance(user.id) : null;

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <Link
            href="/live-astrology"
            className="text-sm text-foreground/65 hover:text-saffron-700"
          >
            ← All astrologers
          </Link>

          <div className="mt-4 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full bg-saffron-50 text-4xl"
                aria-hidden
              >
                {a.avatar}
              </span>
              <div className="flex-1">
                <h1 className="font-heading text-2xl text-maroon-800">
                  {a.name}
                </h1>
                <p className="text-sm text-foreground/60">
                  ⭐ {a.rating.toFixed(1)} (
                  {a.reviews.toLocaleString("en-IN")} reviews) ·{" "}
                  {a.experienceYears} years
                </p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    presence === "online"
                      ? "text-emerald-700"
                      : presence === "busy"
                        ? "text-amber-700"
                        : "text-foreground/45"
                  }`}
                >
                  {STATUS_LABEL[presence]}
                </p>
              </div>
            </div>

            <p className="mt-5 text-foreground/75">{a.shortBio}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {a.specialities.map((sp) => (
                <span
                  key={sp}
                  className="rounded-full bg-saffron-50 px-3 py-1 text-sm text-saffron-800"
                >
                  {sp}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm text-foreground/60">
              Speaks {a.languages.join(", ")}
            </p>

            <div className="mt-4 border-t border-saffron-50 pt-6">
              <LiveLauncher
                slug={a.slug}
                online={presence === "online"}
                perMinuteChat={a.perMinuteChat}
                perMinuteCall={a.perMinuteCall}
                callAvailable={callAvailable}
              />
              <p className="mt-4 text-xs text-foreground/55">
                Billed per started minute from your wallet.{" "}
                {balance !== null ? (
                  <>
                    Wallet balance: <strong>{formatINR(balance)}</strong> ·{" "}
                    <Link
                      href="/account/wallet"
                      className="text-saffron-700 hover:underline"
                    >
                      Add money
                    </Link>
                  </>
                ) : (
                  <Link
                    href={`/login?next=/live-astrology/${a.slug}`}
                    className="text-saffron-700 hover:underline"
                  >
                    Sign in to start
                  </Link>
                )}
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
