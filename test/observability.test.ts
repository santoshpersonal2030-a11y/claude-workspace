import { test } from "node:test";
import assert from "node:assert/strict";

import { parseSentryDsn, captureException } from "../src/lib/observability.ts";

test("parseSentryDsn builds ingestion endpoints from a standard DSN", () => {
  const p = parseSentryDsn("https://abc123@o9.ingest.sentry.io/456");
  assert.ok(p);
  assert.equal(p!.publicKey, "abc123");
  assert.equal(p!.storeUrl, "https://o9.ingest.sentry.io/api/456/store/");
  assert.equal(p!.envelopeUrl, "https://o9.ingest.sentry.io/api/456/envelope/");
});

test("parseSentryDsn rejects malformed or empty DSNs", () => {
  assert.equal(parseSentryDsn(undefined), null);
  assert.equal(parseSentryDsn(""), null);
  assert.equal(parseSentryDsn("not a url"), null);
  assert.equal(parseSentryDsn("https://o9.ingest.sentry.io/456"), null); // no key
  assert.equal(parseSentryDsn("https://key@host/"), null); // no project id
});

/* DOES IT ACTUALLY SEND? — added 13-Aug-2026.
 *
 * The DSN parser was tested; the reporting was not. "An error monitor nobody has seen fire is
 * indistinguishable from one that was never wired up" — and this project has shipped exactly
 * that shape of bug before (a hook returning a plausible default, a check that could not fail).
 *
 * These stub global fetch, so nothing leaves the machine.
 */

test("captureException POSTS to Sentry when a DSN is configured", async () => {
  const realFetch = globalThis.fetch;
  const realDsn = process.env.SENTRY_DSN;
  const calls: { url: string; auth: string; body: string }[] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    calls.push({
      url: String(url),
      auth: headers["X-Sentry-Auth"] ?? "",
      body: String(init?.body ?? ""),
    });
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  process.env.SENTRY_DSN = "https://abc123@o1.ingest.sentry.io/456";

  try {
    await captureException(new Error("kumkum rate lookup failed"), {
      tags: { area: "gst" },
      extra: { slug: "camphor" },
    });

    assert.equal(calls.length, 1, "nothing was sent");
    assert.match(calls[0].url, /o1\.ingest\.sentry\.io\/api\/456\/store\//);
    assert.match(calls[0].auth, /sentry_key=abc123/);

    const sent = JSON.parse(calls[0].body);
    assert.equal(sent.exception.values[0].value, "kumkum rate lookup failed");
    assert.equal(sent.tags.area, "gst");
    assert.equal(sent.extra.slug, "camphor");
    assert.equal(sent.level, "error");
  } finally {
    globalThis.fetch = realFetch;
    if (realDsn === undefined) delete process.env.SENTRY_DSN;
    else process.env.SENTRY_DSN = realDsn;
  }
});

test("CONTROL — with no DSN it sends NOTHING, and does not throw", async () => {
  const realFetch = globalThis.fetch;
  const realDsn = process.env.SENTRY_DSN;
  let called = 0;
  globalThis.fetch = (async () => {
    called++;
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  delete process.env.SENTRY_DSN;

  try {
    await captureException(new Error("should stay local"));
    assert.equal(called, 0, "an unconfigured reporter must not call out");
  } finally {
    globalThis.fetch = realFetch;
    if (realDsn !== undefined) process.env.SENTRY_DSN = realDsn;
  }
});

test("a failing Sentry endpoint must never break the request that reported", async () => {
  const realFetch = globalThis.fetch;
  const realDsn = process.env.SENTRY_DSN;
  globalThis.fetch = (async () => {
    throw new Error("network down");
  }) as typeof fetch;
  process.env.SENTRY_DSN = "https://abc123@o1.ingest.sentry.io/456";

  try {
    // The point: this resolves rather than rejecting. Error reporting that can take down the
    // page it is reporting on is worse than no error reporting.
    await captureException(new Error("original problem"));
  } finally {
    globalThis.fetch = realFetch;
    if (realDsn === undefined) delete process.env.SENTRY_DSN;
    else process.env.SENTRY_DSN = realDsn;
  }
});
