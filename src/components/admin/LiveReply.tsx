"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type AdminLiveMessage = {
  id: string;
  sender: "user" | "astrologer" | "system";
  body: string;
  created_at: string;
};

// Astrologer-side panel for one active session: shows the live transcript (via
// Realtime) and lets the admin reply as the astrologer.
export default function LiveReply({
  sessionId,
  customerName,
  initialMessages,
}: {
  sessionId: string;
  customerName: string;
  initialMessages: AdminLiveMessage[];
}) {
  const [messages, setMessages] = useState<AdminLiveMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [closed, setClosed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    const sub = supabase
      .channel(`admin-live-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as AdminLiveMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [sessionId]);

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/live/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, body }),
      });
      if (res.ok) setText("");
      else if (res.status === 409) setClosed(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-saffron-100 bg-white shadow-sm">
      <div className="border-b border-saffron-50 px-4 py-2 text-sm font-semibold text-maroon-700">
        {customerName}
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto px-4 py-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`text-sm ${
              m.sender === "system"
                ? "text-center text-xs text-foreground/50"
                : m.sender === "astrologer"
                  ? "text-right"
                  : "text-left"
            }`}
          >
            <span
              className={`inline-block rounded-lg px-3 py-1.5 ${
                m.sender === "astrologer"
                  ? "bg-saffron-600 text-white"
                  : m.sender === "user"
                    ? "bg-cream text-foreground/85"
                    : ""
              }`}
            >
              {m.body}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {closed ? (
        <p className="border-t border-saffron-50 px-4 py-3 text-sm text-foreground/55">
          Session closed.
        </p>
      ) : (
        <form
          onSubmit={reply}
          className="flex items-center gap-2 border-t border-saffron-50 px-4 py-3"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Reply as the astrologer…"
            className="flex-1 rounded-full border border-saffron-100 px-3 py-2 text-sm focus:border-saffron-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="rounded-full bg-saffron-600 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
