import { formatRupees } from './format';

type OrderEmail = {
  to: string;
  orderNumber: string;
  items: { name: string; quantity: number; lineTotal: number }[];
  subtotal: number;
  shippingFee: number;
  total: number;
  shipName: string;
};

// Sends an order-confirmation email via Resend (https://resend.com).
// This is OPTIONAL: if RESEND_API_KEY isn't set, it quietly does nothing, so
// the store works fine without email. Add the key (and a verified "from"
// address in RESEND_FROM) to turn it on — no code changes needed.
export async function sendOrderConfirmation(order: OrderEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // email not configured yet — skip silently

  const from =
    process.env.RESEND_FROM || 'Online Pooja Stores <onboarding@resend.dev>';

  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0">${escapeHtml(i.name)} × ${i.quantity}</td>` +
        `<td style="padding:4px 0;text-align:right">${formatRupees(i.lineTotal)}</td></tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#2b1c1c;max-width:520px">
      <h2 style="color:#8b3a3a">Thank you, ${escapeHtml(order.shipName)}!</h2>
      <p>Your order <strong>${order.orderNumber}</strong> is confirmed
         (Cash on Delivery).</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
      <hr style="border:none;border-top:1px solid #e0b455;margin:12px 0" />
      <p style="font-size:14px">Subtotal: ${formatRupees(order.subtotal)}<br/>
         Shipping: ${order.shippingFee === 0 ? 'FREE' : formatRupees(order.shippingFee)}<br/>
         <strong>Total (pay on delivery): ${formatRupees(order.total)}</strong></p>
      <p style="color:#6f5b57;font-size:12px">Online Pooja Stores · Hyderabad, Telangana</p>
    </div>`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: order.to,
        subject: `Your Online Pooja Stores order ${order.orderNumber}`,
        html,
      }),
    });
  } catch {
    // Never let an email problem break the order.
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
