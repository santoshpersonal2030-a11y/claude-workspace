import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Supabase Auth "Send SMS" hook. When a user requests a phone OTP, Supabase
// generates the code and POSTs it here so we can deliver it via 2Factor.in.
// The request is signed using the Standard Webhooks spec; we verify it with the
// hook secret before trusting the payload.
//
// Deploy:  supabase functions deploy send-sms-hook --no-verify-jwt
// Then in the dashboard: Authentication -> Hooks -> Send SMS -> point to this
// function and copy the generated secret into SEND_SMS_HOOK_SECRET below.
//
// Required function secrets (Project Settings -> Edge Functions -> Secrets):
//   TWO_FACTOR_API_KEY       - your 2Factor.in API key
//   TWO_FACTOR_TEMPLATE_NAME - DLT-approved transactional template name
//   SEND_SMS_HOOK_SECRET     - the secret Supabase shows when enabling the hook
//                              (format: "v1,whsec_..."). Optional but recommended.

interface SendSmsPayload {
  user: { phone?: string };
  sms: { otp: string };
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

// Verifies a Standard Webhooks signature (as used by Supabase Auth hooks).
async function verifySignature(
  secret: string,
  headers: Headers,
  body: string,
): Promise<boolean> {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const sigHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !sigHeader) return false;

  // Secret may be prefixed with "v1," and/or "whsec_".
  let key = secret;
  if (key.startsWith("v1,")) key = key.slice(3);
  if (key.startsWith("whsec_")) key = key.slice(6);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    base64ToBytes(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = `${id}.${timestamp}.${body}`;
  const mac = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(signed),
  );
  const expected = bytesToBase64(mac);

  // The header is a space-separated list of "v1,<signature>" entries.
  return sigHeader
    .split(" ")
    .map((part) => part.split(",")[1])
    .some((sig) => sig === expected);
}

function errorResponse(code: number, message: string): Response {
  return new Response(
    JSON.stringify({ error: { http_code: code, message } }),
    { status: code, headers: { "Content-Type": "application/json" } },
  );
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed");

  const body = await req.text();

  const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET");
  if (hookSecret) {
    const ok = await verifySignature(hookSecret, req.headers, body);
    if (!ok) return errorResponse(401, "Invalid webhook signature");
  }

  let payload: SendSmsPayload;
  try {
    payload = JSON.parse(body) as SendSmsPayload;
  } catch {
    return errorResponse(400, "Invalid JSON payload");
  }

  const phone = payload.user?.phone?.replace(/^\+/, "");
  const otp = payload.sms?.otp;
  if (!phone || !otp) return errorResponse(400, "Missing phone or otp");

  const apiKey = Deno.env.get("TWO_FACTOR_API_KEY");
  const template = Deno.env.get("TWO_FACTOR_TEMPLATE_NAME");
  if (!apiKey || !template) {
    return errorResponse(500, "2Factor.in is not configured");
  }

  // 2Factor transactional template endpoint: delivers our exact OTP via a
  // DLT-approved template. https://2factor.in/v3/?action=docs
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/${otp}/${encodeURIComponent(template)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.Status !== "Success") {
    return errorResponse(
      502,
      `2Factor delivery failed: ${data?.Details ?? res.statusText}`,
    );
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
