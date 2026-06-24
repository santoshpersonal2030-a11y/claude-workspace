// SERVER-ONLY, dependency-free error reporting. Sends events to Sentry's store
// endpoint via fetch when SENTRY_DSN is set, otherwise logs to the console.
// No SDK, so there's nothing to build or bundle, and it's a no-op until keyed.

export type ParsedDsn = { storeUrl: string; envelopeUrl: string; publicKey: string };

// Parses a standard Sentry DSN (https://<key>@<host>/<projectId>) into the
// ingestion endpoints. Returns null for anything malformed.
export function parseSentryDsn(dsn: string | undefined | null): ParsedDsn | null {
  if (!dsn) return null;
  try {
    const u = new URL(dsn);
    const publicKey = u.username;
    const projectId = u.pathname.replace(/^\/+/, "");
    if (!publicKey || !projectId) return null;
    const base = `${u.protocol}//${u.host}/api/${projectId}`;
    return {
      storeUrl: `${base}/store/`,
      envelopeUrl: `${base}/envelope/`,
      publicKey,
    };
  } catch {
    return null;
  }
}

export function sentryConfigured(): boolean {
  return parseSentryDsn(process.env.SENTRY_DSN) !== null;
}

type Context = {
  level?: "error" | "warning" | "info";
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

// Reports an error to Sentry (best-effort; never throws). Falls back to
// console.error when unconfigured.
export async function captureException(
  err: unknown,
  context: Context = {},
): Promise<void> {
  const dsn = parseSentryDsn(process.env.SENTRY_DSN);
  const error = err instanceof Error ? err : new Error(String(err));

  if (!dsn) {
    console.error("[observability]", error.message, context.extra ?? "");
    return;
  }

  const event = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: Date.now() / 1000,
    platform: "node",
    level: context.level ?? "error",
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SITE_URL ?? undefined,
    tags: context.tags,
    extra: context.extra,
    exception: {
      values: [
        {
          type: error.name,
          value: error.message,
          stacktrace: error.stack
            ? { frames: stackFrames(error.stack) }
            : undefined,
        },
      ],
    },
  };

  try {
    await fetch(dsn.storeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=bookmypoojari/1.0, sentry_key=${dsn.publicKey}`,
      },
      body: JSON.stringify(event),
      // Don't let reporting hang a request.
      signal: AbortSignal.timeout(3000),
    });
  } catch (reportErr) {
    console.error("[observability] failed to report:", reportErr);
  }
}

// Turns a V8 stack string into coarse Sentry frames (most-recent last).
function stackFrames(stack: string) {
  return stack
    .split("\n")
    .slice(1)
    .map((line) => ({ function: line.trim().replace(/^at\s+/, "") }))
    .filter((f) => f.function)
    .reverse();
}
