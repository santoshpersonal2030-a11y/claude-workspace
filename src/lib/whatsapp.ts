// SERVER-ONLY transactional WhatsApp sender via Meta's WhatsApp Cloud API.
//
// Like SMS under DLT, business-initiated WhatsApp messages must use a
// pre-approved message TEMPLATE; the template's {{1}}, {{2}} … body params are
// filled positionally. So this mirrors sms.ts: each message KIND maps to its own
// approved template (named via its own env var) with a fixed, ordered variable
// list. Gated on the access token + phone-number id, and a logged no-op until
// they're set (same dormant-until-keyed pattern as email.ts / sms.ts).
//
// Required env:
//   WHATSAPP_TOKEN            - a permanent/system-user access token
//   WHATSAPP_PHONE_ID         - the WhatsApp Business phone-number id
//   WHATSAPP_LANG             - template language code (optional, default "en")
// Plus, per kind, the approved template name:
//   WHATSAPP_TEMPLATE_PRIEST_ASSIGNMENT    vars: [poojaName, date]
//   WHATSAPP_TEMPLATE_ADMIN_DECLINE        vars: [panditName, poojaName, date]
//   WHATSAPP_TEMPLATE_CUSTOMER_CONFIRMED   vars: [panditName, poojaName, date]
//   WHATSAPP_TEMPLATE_CUSTOMER_REASSIGNING vars: [poojaName, date]

import type { SmsKind } from "@/lib/sms";

// WhatsApp reuses the same message kinds as SMS.
const TEMPLATE_ENV: Record<SmsKind, string> = {
  priest_assignment: "WHATSAPP_TEMPLATE_PRIEST_ASSIGNMENT",
  admin_decline: "WHATSAPP_TEMPLATE_ADMIN_DECLINE",
  customer_confirmed: "WHATSAPP_TEMPLATE_CUSTOMER_CONFIRMED",
  customer_reassigning: "WHATSAPP_TEMPLATE_CUSTOMER_REASSIGNING",
};

export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

// Build a WhatsApp recipient (E.164, India default +91) from a raw number.
export function toWhatsAppNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`; // bare 10-digit Indian
  if (/^91[6-9]\d{9}$/.test(digits)) return digits; // already 91-prefixed
  if (digits.length >= 11 && digits.length <= 15) return digits; // other intl
  return null;
}

// Sends one templated WhatsApp message. Best-effort: returns false (never throws)
// when unconfigured, the kind has no template, the number is invalid, or the API
// rejects it.
export async function sendTemplatedWhatsApp(args: {
  to: string;
  kind: SmsKind;
  vars: string[];
}): Promise<boolean> {
  if (!whatsappConfigured()) {
    console.warn(`[whatsapp] not configured — skipping ${args.kind} to ${args.to}`);
    return false;
  }
  const template = process.env[TEMPLATE_ENV[args.kind]];
  if (!template) {
    console.warn(`[whatsapp] no template for ${args.kind} — skipping`);
    return false;
  }
  const to = toWhatsAppNumber(args.to);
  if (!to) {
    console.warn(`[whatsapp] invalid number "${args.to}" — skipping`);
    return false;
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: template,
            language: { code: process.env.WHATSAPP_LANG || "en" },
            components: [
              {
                type: "body",
                parameters: args.vars.map((v) => ({ type: "text", text: v })),
              },
            ],
          },
        }),
      },
    );
    if (!res.ok) {
      console.error("[whatsapp] send failed:", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[whatsapp] error:", err);
    return false;
  }
}
