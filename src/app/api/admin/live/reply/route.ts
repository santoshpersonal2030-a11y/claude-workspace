import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/admin";
import { can } from "@/lib/roles";

// An admin (standing in for the astrologer) posts a reply into a live session.
// Gated by the `messages` capability. Writes via the service role as sender
// 'astrologer', which Realtime then pushes to the customer's open room.
export async function POST(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx || !can(ctx.role, "messages")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { sessionId, body } = (await request.json()) as {
    sessionId?: string;
    body?: string;
  };
  const text = body?.trim();
  if (!sessionId || !text) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("live_sessions")
    .select("status")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (session.status !== "active") {
    return NextResponse.json({ error: "Session is closed" }, { status: 409 });
  }

  const { error } = await admin
    .from("live_messages")
    .insert({ session_id: sessionId, sender: "astrologer", body: text });
  if (error) {
    return NextResponse.json({ error: "Could not send" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
