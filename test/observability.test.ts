import { test } from "node:test";
import assert from "node:assert/strict";

import { parseSentryDsn } from "../src/lib/observability.ts";

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
