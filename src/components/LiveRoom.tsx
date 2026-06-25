"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { formatINR } from "@/lib/poojas";
import { billableMinutes } from "@/lib/live-billing";

export type LiveMessage = {
  id: string;
  sender: "user" | "astrologer" | "system";
  body: string;
  created_at: string;
};

type Status = "active" | "ended" | "insufficient_balance";

type Props = {
  sessionId: string;
  astrologerName: string;
  channel: "chat" | "call";
  ratePerMin: number;
  startedAt: string;
  initialStatus: Status;
  initialMessages: LiveMessage[];
  initialMinutesBilled: number;
  initialAmountBilled: number;
  initialBalance: number;
};

function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LiveRoom({
  sessionId,
  astrologerName,
  channel,
  ratePerMin,
  startedAt,
  initialStatus,
  initialMessages,
  initialMinutesBilled,
  initialAmountBilled,
  initialBalance,
}: Props) {
  const [messages, setMessages] = useState<LiveMessage[]>(initialMessages);
  const [status, setStatus] = useState<Status>(initialStatus);
  const [billed, setBilled] = useState({
    minutes: initialMinutesBilled,
    amount: initialAmountBilled,
  });
  const [balance, setBalance] = useState(initialBalance);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const startMs = Date.parse(startedAt);
  const active = status === "active";
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime: new messages + session status changes.
  useEffect(() => {
    const supabase = createClient();
    const channelSub = supabase
      .channel(`live-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as LiveMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row],
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as {
            status: Status;
            minutes_billed: number;
            amount_billed: number;
          };
          setStatus(row.status);
          setBilled({ minutes: row.minutes_billed, amount: row.amount_billed });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [sessionId]);

  // Heartbeat: bill elapsed minutes and refresh balance/status.
  const tick = useCallback(async () => {
    try {
      const res = await fetch("/api/live/tick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        status: Status;
        minutesBilled: number;
        amountBilled: number;
        balance: number;
      };
      setStatus(data.status);
      setBilled({ minutes: data.minutesBilled, amount: data.amountBilled });
      setBalance(data.balance);
    } catch {
      /* transient — next tick retries */
    }
  }, [sessionId]);

  useEffect(() => {
    if (!active) return;
    // Defer the first bill so it doesn't setState synchronously inside the effect.
    const kick = setTimeout(tick, 0);
    const id = setInterval(tick, 20_000);
    return () => {
      clearTimeout(kick);
      clearInterval(id);
    };
  }, [active, tick]);

  // Live elapsed clock (display only; authoritative billing comes from ticks).
  useEffect(() => {
    if (!active) return;
    const id = setInterval(
      () => setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000))),
      1000,
    );
    return () => clearInterval(id);
  }, [active, startMs]);

  // Best-effort: end the session if the tab is closed/hidden, so a forgotten
  // tab can't keep the session open. (The server also idle-times-out.)
  useEffect(() => {
    const endBeacon = () => {
      if (status !== "active") return;
      const blob = new Blob([JSON.stringify({ sessionId })], {
        type: "application/json",
      });
      navigator.sendBeacon?.("/api/live/end", blob);
    };
    window.addEventListener("pagehide", endBeacon);
    return () => window.removeEventListener("pagehide", endBeacon);
  }, [sessionId, status]);

  async function send() {
    const text = input.trim();
    if (!text || sending || !active) return;
    setSending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("live_messages")
        .insert({ session_id: sessionId, sender: "user", body: text });
      if (!error) setInput("");
    } finally {
      setSending(false);
    }
  }

  async function endSession() {
    await fetch("/api/live/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    setStatus("ended");
  }

  const runningCost = active
    ? billableMinutes(startMs, startMs + elapsed * 1000) * ratePerMin
    : billed.amount;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Meter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-saffron-100 bg-white px-4 py-3">
        <div>
          <p className="font-heading text-maroon-800">{astrologerName}</p>
          <p className="text-xs text-foreground/55">
            {channel === "call" ? "📞 Phone consultation" : "💬 Live chat"} ·{" "}
            {formatINR(ratePerMin)}/min
          </p>
        </div>
        <div className="flex items-center gap-4 text-right text-sm">
          <div>
            <p className="font-mono text-maroon-700">{mmss(elapsed)}</p>
            <p className="text-[11px] text-foreground/55">
              ≈ {formatINR(runningCost)}
            </p>
          </div>
          <div className="hidden sm:block">
            <p className="text-foreground/70">{formatINR(balance)}</p>
            <p className="text-[11px] text-foreground/55">wallet</p>
          </div>
          {active && (
            <button
              type="button"
              onClick={endSession}
              className="rounded-full border border-maroon-200 px-4 py-1.5 text-sm font-semibold text-maroon-700 transition-colors hover:bg-maroon-50"
            >
              End
            </button>
          )}
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-cream/40 px-4 py-5">
        {messages.map((m) => {
          if (m.sender === "system") {
            return (
              <p
                key={m.id}
                className="mx-auto max-w-md rounded-full bg-saffron-50 px-4 py-1.5 text-center text-xs text-saffron-800"
              >
                {m.body}
              </p>
            );
          }
          const mine = m.sender === "user";
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  mine
                    ? "bg-saffron-600 text-white"
                    : "bg-white text-foreground/85"
                }`}
              >
                {!mine && (
                  <p className="mb-0.5 text-[11px] font-semibold text-saffron-700">
                    {astrologerName}
                  </p>
                )}
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer / ended state */}
      {active ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="flex items-center gap-2 border-t border-saffron-100 bg-white px-4 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              channel === "call"
                ? "Send a note while you talk…"
                : "Type your message…"
            }
            className="flex-1 rounded-full border border-saffron-100 px-4 py-2.5 text-sm focus:border-saffron-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-full bg-saffron-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-saffron-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="border-t border-saffron-100 bg-white px-4 py-3 text-center">
          <p className="text-sm text-foreground/70">
            {status === "insufficient_balance"
              ? `Session ended — wallet balance used up. You were billed ${formatINR(billed.amount)} for ${billed.minutes} min.`
              : `Session ended. You were billed ${formatINR(billed.amount)} for ${billed.minutes} min.`}
          </p>
          <div className="mt-3 flex justify-center gap-3">
            {status === "insufficient_balance" && (
              <Link
                href="/account/wallet"
                className="rounded-full bg-saffron-600 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-700"
              >
                Add money
              </Link>
            )}
            <Link
              href="/live-astrology"
              className="rounded-full border border-saffron-200 px-5 py-2 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
            >
              Back to astrologers
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
