// Lightweight in-memory fixed-window rate limiter for API routes.
//
// CAVEAT: state lives in this module's memory, so each serverless/edge instance
// limits independently — this is a basic abuse guard, not a global quota. For
// strict distributed limits, back it with Redis (e.g. Upstash) later.

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

// Records a hit for `key` and reports whether it's within `limit` per `windowMs`.
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): { ok: boolean; remaining: number; retryAfterSec: number } {
  // Bound memory: drop expired buckets once the map grows large.
  if (buckets.size > 10000) {
    for (const [k, b] of buckets) if (now >= b.reset) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }

  bucket.count += 1;
  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSec: Math.max(1, Math.ceil((bucket.reset - now) / 1000)),
  };
}
