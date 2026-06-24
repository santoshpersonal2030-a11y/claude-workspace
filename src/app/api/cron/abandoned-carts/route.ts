import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendAbandonedCartEmail } from "@/lib/notifications";

// Emails users who left items in their cart and haven't been reminded yet.
// Intended to be hit on a schedule (e.g. Vercel Cron, hourly). When CRON_SECRET
// is set, Vercel includes it as `Authorization: Bearer <secret>`.
const ABANDON_AFTER_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - ABANDON_AFTER_MS).toISOString();

  const { data: carts } = await admin
    .from("carts")
    .select("user_id, items, updated_at")
    .lt("updated_at", cutoff)
    .is("notified_at", null);

  let sent = 0;
  for (const cart of carts ?? []) {
    const items = Array.isArray(cart.items)
      ? (cart.items as { name?: string; price?: number; quantity?: number }[])
      : [];
    if (items.length === 0) continue;

    await sendAbandonedCartEmail(cart.user_id, items);
    await admin
      .from("carts")
      .update({ notified_at: new Date().toISOString() })
      .eq("user_id", cart.user_id);
    sent += 1;
  }

  return NextResponse.json({ ok: true, reminders: sent });
}
