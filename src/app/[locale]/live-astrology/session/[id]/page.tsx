import { redirect, notFound } from "next/navigation";

import Header from "@/components/Header";
import LiveRoom, { type LiveMessage } from "@/components/LiveRoom";
import { createClient } from "@/lib/supabase/server";
import { getAvailableBalance } from "@/lib/wallet";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live consultation" };

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/live-astrology");

  // RLS limits this to the caller's own sessions, so a missing row = not theirs.
  const { data: session } = await supabase
    .from("live_sessions")
    .select(
      "id, astrologer_name, channel, rate_per_min, status, minutes_billed, amount_billed, started_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!session) notFound();

  const { data: msgs } = await supabase
    .from("live_messages")
    .select("id, sender, body, created_at")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  const balance = await getAvailableBalance(user.id);

  return (
    <>
      <Header />
      <main className="flex-1">
        <LiveRoom
          sessionId={session.id}
          astrologerName={session.astrologer_name}
          channel={session.channel === "call" ? "call" : "chat"}
          ratePerMin={session.rate_per_min}
          startedAt={session.started_at}
          initialStatus={
            session.status === "ended" || session.status === "insufficient_balance"
              ? session.status
              : "active"
          }
          initialMessages={(msgs ?? []) as LiveMessage[]}
          initialMinutesBilled={session.minutes_billed}
          initialAmountBilled={session.amount_billed}
          initialBalance={balance}
        />
      </main>
    </>
  );
}
