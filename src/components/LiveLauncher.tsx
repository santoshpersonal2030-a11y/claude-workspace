"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { formatINR } from "@/lib/poojas";

type Props = {
  slug: string;
  online: boolean;
  perMinuteChat: number;
  perMinuteCall: number;
  callAvailable: boolean;
};

const MESSAGES: Record<string, string> = {
  offline: "This astrologer just went offline. Try another who’s online now.",
  call_unavailable:
    "Phone calls aren’t available right now — start a chat instead.",
  call_failed: "We couldn’t place the call. Please try chat instead.",
  need_phone:
    "Add a phone number to your profile to receive a call, or start a chat.",
  create_failed: "Something went wrong starting the session. Please try again.",
};

// Starts a live chat or call. Pricing/availability/balance are all enforced
// server-side; this just kicks off the session and routes to the live room.
export default function LiveLauncher({
  slug,
  online,
  perMinuteChat,
  perMinuteCall,
  callAvailable,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"chat" | "call" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsTopUp, setNeedsTopUp] = useState(false);

  async function start(channel: "chat" | "call") {
    setBusy(channel);
    setError(null);
    setNeedsTopUp(false);
    try {
      const res = await fetch("/api/live/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, channel }),
      });

      if (res.status === 401) {
        router.push(`/login?next=/live-astrology/${slug}`);
        return;
      }

      const data = (await res.json()) as {
        sessionId?: string;
        error?: string;
        ratePerMin?: number;
        balance?: number;
      };

      if (res.ok && data.sessionId) {
        router.push(`/live-astrology/session/${data.sessionId}`);
        return;
      }

      if (data.error === "insufficient_balance") {
        setNeedsTopUp(true);
        setError(
          `You need at least ${formatINR(data.ratePerMin ?? 0)} in your wallet to start (your balance: ${formatINR(data.balance ?? 0)}).`,
        );
        return;
      }
      setError(MESSAGES[data.error ?? ""] ?? "Could not start the session.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => start("chat")}
          disabled={!online || busy !== null}
          className="flex-1 rounded-full bg-saffron-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "chat"
            ? "Starting…"
            : `💬 Start chat · ${formatINR(perMinuteChat)}/min`}
        </button>
        <button
          type="button"
          onClick={() => start("call")}
          disabled={!online || !callAvailable || busy !== null}
          title={
            !callAvailable ? "Phone calls aren’t available right now" : undefined
          }
          className="flex-1 rounded-full border border-saffron-500 px-6 py-3 text-center text-sm font-semibold text-saffron-800 transition-colors hover:bg-saffron-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "call"
            ? "Calling…"
            : `📞 Call · ${formatINR(perMinuteCall)}/min`}
        </button>
      </div>

      {!online && (
        <p className="mt-3 text-sm text-foreground/60">
          This astrologer is offline right now.{" "}
          <Link href="/live-astrology" className="text-saffron-700 hover:underline">
            See who’s online →
          </Link>
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-maroon-600">
          {error}
          {needsTopUp && (
            <>
              {" "}
              <Link
                href="/account/wallet"
                className="font-semibold text-saffron-700 hover:underline"
              >
                Add money →
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
