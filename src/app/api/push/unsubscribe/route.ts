import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type Body = { endpoint: string };

// Removes the caller's subscription for a given endpoint (RLS-scoped).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  if (!body?.endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint);

  return NextResponse.json({ ok: true });
}
