// SERVER-ONLY orchestration for live per-minute consultations: starting a
// session, metering it minute-by-minute against the wallet, and ending it. All
// billing writes go through the service-role admin client (live_sessions billing
// columns are not user-writable) and through the wallet ledger, so a customer
// can never forge a charge or a balance. The arithmetic itself lives in the pure,
// unit-tested live-billing.ts.

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAstrologer,
  ratePerMinute,
  type ConsultChannel,
} from "@/lib/astrologers";
import { getPresence } from "@/lib/live-status";
import { getAvailableBalance, addReferencedTxn } from "@/lib/wallet";
import { computeBilling, canAfford } from "@/lib/live-billing";
import { voiceConfigured, initiateMaskedCall } from "@/lib/voice";
import { formatINR } from "@/lib/poojas";

export type SessionStatus = "active" | "ended" | "insufficient_balance";

type SessionRow = {
  id: string;
  user_id: string;
  astrologer_slug: string;
  astrologer_name: string;
  channel: ConsultChannel;
  status: SessionStatus;
  rate_per_min: number;
  minutes_billed: number;
  amount_billed: number;
  end_reason: string | null;
  started_at: string;
  ended_at: string | null;
  last_tick_at: string;
};

// If a tick arrives more than this long after the previous one, the customer
// closed the tab / lost connection — we end the session at the last heartbeat
// and never bill the idle gap.
const IDLE_TIMEOUT_MS = 120_000;

export type SessionSnapshot = {
  status: SessionStatus;
  minutesBilled: number;
  amountBilled: number;
  ratePerMin: number;
  balance: number;
  endReason: string | null;
};

const SESSION_COLS =
  "id, user_id, astrologer_slug, astrologer_name, channel, status, rate_per_min, minutes_billed, amount_billed, end_reason, started_at, ended_at, last_tick_at";

async function postMessage(
  sessionId: string,
  sender: "system" | "astrologer",
  body: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("live_messages")
    .insert({ session_id: sessionId, sender, body });
}

// Loads a session and confirms it belongs to the caller. Returns null otherwise.
export async function loadOwnedSession(
  sessionId: string,
  userId: string,
): Promise<SessionRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("live_sessions")
    .select(SESSION_COLS)
    .eq("id", sessionId)
    .maybeSingle();
  if (!data || data.user_id !== userId) return null;
  return data as SessionRow;
}

export type StartResult =
  | {
      ok: true;
      sessionId: string;
      ratePerMin: number;
      balance: number;
      channel: ConsultChannel;
    }
  | { ok: false; error: string; balance?: number; ratePerMin?: number };

// Opens a metered session if the astrologer is available and the wallet can
// cover at least one minute. For a call, also places the masked phone call.
export async function startSession(args: {
  userId: string;
  slug: string;
  channel: ConsultChannel;
  customerPhone?: string | null;
}): Promise<StartResult> {
  const astro = getAstrologer(args.slug);
  if (!astro) return { ok: false, error: "not_found" };

  const rate = ratePerMinute(args.slug, args.channel);
  if (rate == null) return { ok: false, error: "not_found" };

  const presence = await getPresence(args.slug);
  if (presence.status === "offline") {
    return { ok: false, error: "offline" };
  }

  const balance = await getAvailableBalance(args.userId);
  if (!canAfford(balance, rate)) {
    return { ok: false, error: "insufficient_balance", balance, ratePerMin: rate };
  }

  // A phone consult needs working telephony and the customer's number.
  if (args.channel === "call") {
    if (!voiceConfigured()) {
      return { ok: false, error: "call_unavailable", balance, ratePerMin: rate };
    }
    if (!args.customerPhone) {
      return { ok: false, error: "need_phone", balance, ratePerMin: rate };
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("live_sessions")
    .insert({
      user_id: args.userId,
      astrologer_slug: astro.slug,
      astrologer_name: astro.name,
      channel: args.channel,
      rate_per_min: rate,
      status: "active",
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "create_failed" };

  if (args.channel === "call") {
    const call = await initiateMaskedCall(args.customerPhone!);
    if (!call.ok) {
      // Roll the session back to ended so it never meters a call that never rang.
      await admin
        .from("live_sessions")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
          end_reason: "call_failed",
        })
        .eq("id", data.id);
      return { ok: false, error: "call_failed", balance, ratePerMin: rate };
    }
    await postMessage(
      data.id,
      "system",
      `📞 Calling you now to connect with ${astro.name}. Please pick up. You’re billed ${formatINR(rate)}/min once connected.`,
    );
  } else {
    await postMessage(
      data.id,
      "astrologer",
      `नमस्ते 🙏 You’re connected with ${astro.name}. Share your question and birth details to begin. You’re billed ${formatINR(rate)}/min.`,
    );
  }

  return { ok: true, sessionId: data.id, ratePerMin: rate, balance, channel: args.channel };
}

// Charges any whole minutes elapsed since the last tick. Each minute is its own
// idempotent ledger row (reference `${sessionId}:${minute}`), so retries and
// concurrent ticks never double-charge. Ends the session when the wallet is spent.
export async function meterSession(session: SessionRow): Promise<SessionSnapshot> {
  const balanceNow = await getAvailableBalance(session.user_id);

  if (session.status !== "active") {
    return {
      status: session.status,
      minutesBilled: session.minutes_billed,
      amountBilled: session.amount_billed,
      ratePerMin: session.rate_per_min,
      balance: balanceNow,
      endReason: session.end_reason,
    };
  }

  // Idle guard: a long gap since the last heartbeat means the customer left.
  // End the session without billing the gap (minutes already reflect the last
  // tick), so a reopened/forgotten tab can't run up the wallet.
  if (Date.now() - Date.parse(session.last_tick_at) > IDLE_TIMEOUT_MS) {
    const adminIdle = createAdminClient();
    await adminIdle
      .from("live_sessions")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
        end_reason: "timed_out",
      })
      .eq("id", session.id)
      .eq("status", "active");
    return {
      status: "ended",
      minutesBilled: session.minutes_billed,
      amountBilled: session.amount_billed,
      ratePerMin: session.rate_per_min,
      balance: balanceNow,
      endReason: "timed_out",
    };
  }

  const result = computeBilling({
    startedAtMs: Date.parse(session.started_at),
    nowMs: Date.now(),
    ratePerMin: session.rate_per_min,
    minutesAlreadyBilled: session.minutes_billed,
    amountAlreadyBilled: session.amount_billed,
    availableBalance: balanceNow,
  });

  // Charge each newly-elapsed minute exactly once, ever.
  for (let m = session.minutes_billed + 1; m <= result.targetMinutes; m++) {
    await addReferencedTxn(
      session.user_id,
      -session.rate_per_min,
      "live_consult",
      `${session.id}:${m}`,
      `${session.astrologer_name} — live ${session.channel}, min ${m}`,
    );
  }

  const ended = result.exhausted;
  const newStatus: SessionStatus = ended ? "insufficient_balance" : "active";
  const admin = createAdminClient();
  await admin
    .from("live_sessions")
    .update({
      minutes_billed: result.targetMinutes,
      amount_billed: result.targetMinutes * session.rate_per_min,
      status: newStatus,
      ended_at: ended ? new Date().toISOString() : null,
      end_reason: ended ? "insufficient_balance" : null,
      last_tick_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  if (ended) {
    await postMessage(
      session.id,
      "system",
      `Your wallet balance is used up — the session has ended after ${result.targetMinutes} min (${formatINR(result.targetMinutes * session.rate_per_min)}). Top up to continue.`,
    );
  }

  return {
    status: newStatus,
    minutesBilled: result.targetMinutes,
    amountBilled: result.targetMinutes * session.rate_per_min,
    ratePerMin: session.rate_per_min,
    balance: await getAvailableBalance(session.user_id),
    endReason: ended ? "insufficient_balance" : null,
  };
}

// Final settlement requested by the customer (or the room unmounting).
export async function endSession(
  session: SessionRow,
  reason = "user_ended",
): Promise<SessionSnapshot> {
  // Bill any outstanding minutes first.
  const snap = session.status === "active" ? await meterSession(session) : null;

  const admin = createAdminClient();
  const fresh = (await loadOwnedSession(session.id, session.user_id))!;

  if (fresh.status === "active") {
    await admin
      .from("live_sessions")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
        end_reason: reason,
      })
      .eq("id", session.id);
    await postMessage(
      session.id,
      "system",
      `Session ended • ${fresh.minutes_billed} min • ${formatINR(fresh.amount_billed)}. Thank you 🙏`,
    );
  }

  const balance = await getAvailableBalance(session.user_id);
  return {
    status: fresh.status === "active" ? "ended" : fresh.status,
    minutesBilled: fresh.minutes_billed,
    amountBilled: fresh.amount_billed,
    ratePerMin: fresh.rate_per_min,
    balance,
    endReason: snap?.endReason ?? (fresh.status === "active" ? reason : fresh.end_reason),
  };
}
