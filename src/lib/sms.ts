// SERVER-ONLY transactional SMS sender via 2Factor.in's TSMS add-on.
//
// India's TRAI/DLT regime forbids arbitrary free-text transactional SMS: every
// message must map to a DLT-approved template registered against a sender ID,
// and the template's {#var#} placeholders are filled positionally. So instead
// of one catch-all template, each message KIND has its own approved template
// (named via its own env var) and a fixed, ordered list of variables.
//
// Required env (sending is a logged no-op until the base pair is present, same
// dormant-until-keyed pattern as email.ts / geo.ts):
//   TWO_FACTOR_API_KEY  - the 2Factor.in API key
//   SMS_SENDER_ID       - the 6-char DLT header / sender ID (e.g. BKMPJI)
// Plus, per kind, the approved template name (a kind with no template configured
// is itself a no-op, so kinds can be rolled out one DLT approval at a time):
//   SMS_TEMPLATE_PRIEST_ASSIGNMENT    vars: [poojaName, date]
//   SMS_TEMPLATE_ADMIN_DECLINE        vars: [panditName, poojaName, date]
//   SMS_TEMPLATE_CUSTOMER_CONFIRMED   vars: [panditName, poojaName, date]
//   SMS_TEMPLATE_CUSTOMER_REASSIGNING vars: [poojaName, date]

export type SmsKind =
  | "priest_assignment"
  | "admin_decline"
  | "customer_confirmed"
  | "customer_reassigning";

// Each kind's template-name env var. The ordered VAR1..VARn the caller supplies
// must match the placeholders in that DLT-approved template.
const TEMPLATE_ENV: Record<SmsKind, string> = {
  priest_assignment: "SMS_TEMPLATE_PRIEST_ASSIGNMENT",
  admin_decline: "SMS_TEMPLATE_ADMIN_DECLINE",
  customer_confirmed: "SMS_TEMPLATE_CUSTOMER_CONFIRMED",
  customer_reassigning: "SMS_TEMPLATE_CUSTOMER_REASSIGNING",
};

// True once the provider key + sender ID are set (a per-kind template may still
// be missing — sendTemplatedSms checks that separately).
export function smsConfigured(): boolean {
  return Boolean(process.env.TWO_FACTOR_API_KEY && process.env.SMS_SENDER_ID);
}

// Strip spaces/punctuation and a leading +91 / 91 / 0 to a 10-digit mobile.
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

// Sends one DLT-templated transactional SMS. Best-effort: returns false (and
// never throws) when unconfigured, the kind has no template, the number is
// invalid, or the provider rejects it.
export async function sendTemplatedSms(args: {
  to: string;
  kind: SmsKind;
  vars: string[];
}): Promise<boolean> {
  if (!smsConfigured()) {
    console.warn(`[sms] not configured — skipping ${args.kind} to ${args.to}`);
    return false;
  }
  const template = process.env[TEMPLATE_ENV[args.kind]];
  if (!template) {
    console.warn(`[sms] no template for ${args.kind} — skipping`);
    return false;
  }
  const to = normalisePhone(args.to);
  if (!to) {
    console.warn(`[sms] invalid mobile "${args.to}" — skipping`);
    return false;
  }
  try {
    const key = process.env.TWO_FACTOR_API_KEY!;
    const params = args.vars
      .map((v, i) => `&VAR${i + 1}=${encodeURIComponent(v)}`)
      .join("");
    const url =
      `https://2factor.in/API/V1/${key}/ADDON_SERVICES/SEND/TSMS` +
      `?From=${encodeURIComponent(process.env.SMS_SENDER_ID!)}` +
      `&To=${to}` +
      `&TemplateName=${encodeURIComponent(template)}` +
      params;
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
