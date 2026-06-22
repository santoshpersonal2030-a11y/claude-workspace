// SERVER-ONLY transactional SMS sender via 2Factor.in's TSMS add-on.
//
// India's TRAI/DLT regime forbids arbitrary free-text transactional SMS: every
// message must map to a DLT-approved template registered against a sender ID.
// So this helper is GATED on three env vars and is a logged no-op until they are
// all set (same philosophy as email.ts / geo.ts — dormant until configured):
//
//   TWO_FACTOR_API_KEY    - the 2Factor.in API key
//   SMS_SENDER_ID         - the 6-char DLT header / sender ID (e.g. BKMPJI)
//   SMS_DLT_TEMPLATE      - the approved template name on 2Factor, whose single
//                           {#var#} placeholder receives the message text
//
// The caller passes a finished message string; it is sent as the template's one
// variable. Numbers are normalised to a bare 10-digit Indian mobile (2Factor
// also accepts 91-prefixed). Best-effort: never throws into its caller.

export function smsConfigured(): boolean {
  return Boolean(
    process.env.TWO_FACTOR_API_KEY &&
      process.env.SMS_SENDER_ID &&
      process.env.SMS_DLT_TEMPLATE,
  );
}

// Strip spaces/punctuation and a leading +91 / 91 / 0 to a 10-digit mobile.
function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

export async function sendSms(args: {
  to: string;
  message: string;
}): Promise<boolean> {
  if (!smsConfigured()) {
    console.warn(`[sms] not configured — skipping SMS to ${args.to}`);
    return false;
  }
  const to = normalisePhone(args.to);
  if (!to) {
    console.warn(`[sms] invalid mobile "${args.to}" — skipping`);
    return false;
  }
  try {
    const key = process.env.TWO_FACTOR_API_KEY!;
    const url =
      `https://2factor.in/API/V1/${key}/ADDON_SERVICES/SEND/TSMS` +
      `?From=${encodeURIComponent(process.env.SMS_SENDER_ID!)}` +
      `&To=${to}` +
      `&TemplateName=${encodeURIComponent(process.env.SMS_DLT_TEMPLATE!)}` +
      `&VAR1=${encodeURIComponent(args.message)}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      console.error("[sms] send failed:", await res.text());
      return false;
    }
    const body = (await res.json()) as { Status?: string };
    if (body.Status && body.Status !== "Success") {
      console.error("[sms] provider error:", body);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[sms] error:", err);
    return false;
  }
}
