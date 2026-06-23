"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  sender_role: string;
  body: string;
  created_at: string;
};

const ROLE_LABEL: Record<string, string> = {
  customer: "Customer",
  pandit: "Pandit",
  admin: "Support",
};

// Per-booking chat thread shared by the customer, pandit and admin views.
// Polls for new messages while mounted.
export default function BookingChat({ bookingId }: { bookingId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [me, setMe] = useState<string>("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/messages`);
      if (!res.ok) return;
      const data = (await res.json()) as { role: string; messages: Message[] };
      setMe(data.role);
      setMessages(data.messages);
    } finally {
      setLoaded(true);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setText("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-saffron-100 bg-white shadow-sm">
      <div className="border-b border-saffron-50 px-4 py-3">
        <h3 className="font-heading text-lg text-maroon-700">Messages</h3>
        <p className="text-xs text-foreground/55">
          Chat with {me === "customer" ? "your Pandit / our team" : "the customer"}{" "}
          about this booking.
        </p>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
        {loaded && messages.length === 0 && (
          <p className="text-center text-sm text-foreground/45">
            No messages yet. Say hello 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_role === me;
          return (
            <div
              key={m.id}
              className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "bg-saffron-600 text-white"
                    : "bg-cream text-foreground"
                }`}
              >
                {m.body}
              </div>
              <span className="mt-0.5 text-[10px] text-foreground/40">
                {ROLE_LABEL[m.sender_role] ?? m.sender_role} ·{" "}
                {new Date(m.created_at).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-saffron-50 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-saffron-200 bg-cream px-4 py-2 text-sm outline-none focus:border-saffron-400"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="rounded-full bg-saffron-600 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
