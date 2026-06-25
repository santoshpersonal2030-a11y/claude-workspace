import { requireCapability } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import LiveReply, {
  type AdminLiveMessage,
} from "@/components/admin/LiveReply";
import { formatINR } from "@/lib/poojas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live chats — Admin" };

export default async function AdminLivePage() {
  await requireCapability("messages");
  const admin = createAdminClient();

  const { data: sessions } = await admin
    .from("live_sessions")
    .select(
      "id, user_id, astrologer_name, channel, rate_per_min, minutes_billed, amount_billed, started_at",
    )
    .eq("status", "active")
    .order("started_at", { ascending: true })
    .limit(30);

  const list = sessions ?? [];
  const sessionIds = list.map((s) => s.id);
  const userIds = [...new Set(list.map((s) => s.user_id))];

  const [{ data: msgs }, { data: profiles }] = await Promise.all([
    sessionIds.length
      ? admin
          .from("live_messages")
          .select("id, session_id, sender, body, created_at")
          .in("session_id", sessionIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
    userIds.length
      ? admin.from("profiles").select("id, full_name").in("id", userIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const nameOf = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name ?? "Customer"]),
  );
  const messagesBySession = new Map<string, AdminLiveMessage[]>();
  for (const m of msgs ?? []) {
    const arr = messagesBySession.get(m.session_id) ?? [];
    arr.push({
      id: m.id,
      sender: m.sender as AdminLiveMessage["sender"],
      body: m.body,
      created_at: m.created_at,
    });
    messagesBySession.set(m.session_id, arr);
  }

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">
        Live consultations
      </h1>
      <p className="mt-1 text-sm text-foreground/65">
        Reply to customers in active per-minute sessions as the assigned
        astrologer. New messages stream in live.
      </p>

      {list.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-saffron-200 bg-white px-4 py-6 text-center text-sm text-foreground/55">
          No active live sessions right now.
        </p>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {list.map((s) => (
            <div key={s.id}>
              <p className="mb-1.5 text-xs text-foreground/55">
                {s.astrologer_name} · {s.channel} · {formatINR(s.rate_per_min)}
                /min · billed {s.minutes_billed} min (
                {formatINR(s.amount_billed)})
              </p>
              <LiveReply
                sessionId={s.id}
                customerName={nameOf.get(s.user_id) ?? "Customer"}
                initialMessages={messagesBySession.get(s.id) ?? []}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
