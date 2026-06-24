import { createAdminClient } from "@/lib/supabase/admin";
import { setMessageHandled } from "@/app/[locale]/admin/actions";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminMessagesPage() {
  const admin = createAdminClient();
  const { data: messages } = await admin
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Messages</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Submissions from the contact form.
      </p>

      <div className="mt-6 space-y-3">
        {messages?.length ? (
          messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl border p-4 shadow-sm ${
                m.handled
                  ? "border-saffron-50 bg-cream-100/40"
                  : "border-saffron-200 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium text-maroon-700">
                  {m.subject || "(no subject)"}
                </div>
                <span className="text-xs text-foreground/65">
                  {formatDate(m.created_at)}
                </span>
              </div>
              <div className="mt-1 text-xs text-foreground/65">
                {m.name}
                {m.email ? ` · ${m.email}` : ""}
                {m.phone ? ` · ${m.phone}` : ""}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/75">
                {m.message}
              </p>
              <form action={setMessageHandled} className="mt-3">
                <input type="hidden" name="id" value={m.id} />
                <input
                  type="hidden"
                  name="handled"
                  value={(!m.handled).toString()}
                />
                <button
                  type="submit"
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                    m.handled
                      ? "border border-saffron-200 text-saffron-700 hover:bg-saffron-50"
                      : "bg-saffron-700 text-white hover:bg-saffron-800"
                  }`}
                >
                  {m.handled ? "Mark as open" : "Mark as handled"}
                </button>
              </form>
            </div>
          ))
        ) : (
          <p className="text-sm text-foreground/65">No messages yet.</p>
        )}
      </div>
    </div>
  );
}
