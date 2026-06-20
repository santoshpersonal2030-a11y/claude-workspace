// SERVER-ONLY email sender via Resend's REST API. If RESEND_API_KEY / EMAIL_FROM
// aren't set, sending is a logged no-op — so the app works before email is wired
// up and simply starts sending once the keys are present.

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!emailConfigured()) {
    console.warn(`[email] not configured — skipping "${args.subject}"`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: args.to,
        subject: args.subject,
        html: args.html,
      }),
    });
    if (!res.ok) {
      console.error("[email] send failed:", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] error:", err);
    return false;
  }
}

// Wraps body content in a simple branded shell.
export function emailLayout(heading: string, body: string): string {
  return `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;background:#fdf6ec;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #f3e2cb;border-radius:16px;overflow:hidden">
      <div style="background:#7a1f1f;padding:20px 24px;color:#fdf6ec">
        <div style="font-size:18px;font-weight:600">🪔 BookMyPoojari</div>
      </div>
      <div style="padding:24px">
        <h1 style="margin:0 0 12px;font-size:20px;color:#7a1f1f">${heading}</h1>
        ${body}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #f3e2cb;color:#9a8c7a;font-size:12px">
        Devotion, delivered. · bookmypoojari.com
      </div>
    </div>
  </div>`;
}
