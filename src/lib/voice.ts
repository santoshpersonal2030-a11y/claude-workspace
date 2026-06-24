// SERVER-ONLY Twilio Voice click-to-call for live phone consultations. We hit
// the REST API directly (Basic auth, no SDK), the same way razorpay.ts / sms.ts
// do. Dormant until keyed — every function is a safe no-op until the Twilio env
// is present, so the feature degrades to chat-only rather than erroring.
//
// Required env:
//   TWILIO_ACCOUNT_SID   - Twilio account SID
//   TWILIO_AUTH_TOKEN    - Twilio auth token
//   TWILIO_CALL_FROM     - a Twilio voice number in E.164 (caller ID for masking)
//   TWILIO_ASTROLOGER_HOTLINE - E.164 number the astrologer side is reached on
//                               (a hunt-group / call-centre line; keeps the
//                               astrologer's personal number private)

import { normalisePhone } from "@/lib/sms";

const TWILIO_API = "https://api.twilio.com/2010-04-01";

export function voiceConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_CALL_FROM &&
      process.env.TWILIO_ASTROLOGER_HOTLINE,
  );
}

// Turn a stored 10-digit Indian mobile into E.164 (+91…). Returns null if it
// isn't a valid mobile.
function toE164(raw: string): string | null {
  if (/^\+\d{8,15}$/.test(raw)) return raw; // already E.164
  const ten = normalisePhone(raw);
  return ten ? `+91${ten}` : null;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    c === "<"
      ? "&lt;"
      : c === ">"
        ? "&gt;"
        : c === "&"
          ? "&amp;"
          : c === "'"
            ? "&apos;"
            : "&quot;",
  );
}

export type CallResult = { ok: boolean; sid?: string; error?: string };

// Bridges customer ⇄ astrologer with number masking: Twilio rings the customer
// first, then <Dial>s the astrologer hotline using our Twilio number as caller
// ID, so neither party sees the other's real number.
export async function initiateMaskedCall(customerPhone: string): Promise<CallResult> {
  if (!voiceConfigured()) return { ok: false, error: "voice_not_configured" };

  const customer = toE164(customerPhone);
  if (!customer) return { ok: false, error: "invalid_customer_number" };

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_CALL_FROM!;
  const hotline = process.env.TWILIO_ASTROLOGER_HOTLINE!;

  const twiml =
    `<Response><Say voice="Polly.Aditi">` +
    `Namaste. Connecting you to your astrologer on Book My Poojari. Please hold.` +
    `</Say><Dial callerId="${escapeXml(from)}">${escapeXml(hotline)}</Dial></Response>`;

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({ To: customer, From: from, Twiml: twiml });

  try {
    const res = await fetch(`${TWILIO_API}/Accounts/${sid}/Calls.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      console.error("[voice] call failed:", await res.text());
      return { ok: false, error: "provider_error" };
    }
    const data = (await res.json()) as { sid?: string };
    return { ok: true, sid: data.sid };
  } catch (err) {
    console.error("[voice] error:", err);
    return { ok: false, error: "exception" };
  }
}
