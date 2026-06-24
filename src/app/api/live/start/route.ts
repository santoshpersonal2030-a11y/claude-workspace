import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { startSession } from "@/lib/live-consult";
import type { ConsultChannel } from "@/lib/astrologers";

// Opens a live per-minute consultation. Pricing, availability and balance are all
// decided server-side; the client only names the astrologer and channel.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as {
    slug?: string;
    channel?: ConsultChannel;
  };
  const channel: ConsultChannel = body.channel === "call" ? "call" : "chat";
  if (!body.slug) {
    return NextResponse.json({ error: "Missing astrologer" }, { status: 400 });
  }

  let phone: string | null = null;
  if (channel === "call") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .maybeSingle();
    phone = profile?.phone ?? null;
  }

  const result = await startSession({
    userId: user.id,
    slug: body.slug,
    channel,
    customerPhone: phone,
  });

  if (!result.ok) {
    const status =
      result.error === "insufficient_balance"
        ? 402
        : result.error === "not_found"
          ? 404
          : result.error === "offline" ||
              result.error === "call_unavailable" ||
              result.error === "need_phone" ||
              result.error === "call_failed"
            ? 409
            : 500;
    return NextResponse.json(
      { error: result.error, balance: result.balance, ratePerMin: result.ratePerMin },
      { status },
    );
  }

  return NextResponse.json(result);
}
