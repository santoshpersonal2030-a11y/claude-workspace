import { NextResponse } from "next/server";

import { captureException } from "@/lib/observability";

// Receives client-side errors (from the error boundaries) and forwards them to
// Sentry server-side, so the DSN/handling stays on the server.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      stack?: string;
      url?: string;
      digest?: string;
    };
    const err = new Error(body.message || "Client error");
    if (body.stack) err.stack = body.stack;
    await captureException(err, {
      tags: { source: "client" },
      extra: { url: body.url, digest: body.digest },
    });
  } catch {
    /* swallow — reporting must never error the client */
  }
  return NextResponse.json({ ok: true });
}
