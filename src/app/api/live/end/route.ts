import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { loadOwnedSession, endSession } from "@/lib/live-consult";

// Ends a live consultation: settles outstanding minutes and closes the session.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { sessionId } = (await request.json()) as { sessionId?: string };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session" }, { status: 400 });
  }

  const session = await loadOwnedSession(sessionId, user.id);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const snapshot = await endSession(session);
  return NextResponse.json(snapshot);
}
