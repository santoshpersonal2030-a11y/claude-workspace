// Guest order access — how someone with no account proves an order is theirs.
//
// Pure functions, no database (test/guest-order.test.ts).
//
// THE PROBLEM THIS SOLVES. Every read policy on orders, order_items and payments is
// `user_id = auth.uid()`. A guest has no auth.uid(), so once they have paid there is no way for
// them to see their own order — no confirmation page, no tracking, nothing. The usual answer is a
// long unguessable token in the confirmation email:  /orders/<id>?t=<token>
//
// TWO PROPERTIES THAT MATTER, and both are easy to get wrong:
//
//   1. The token is derived, never stored in the clear. What goes in the database is a HASH. A
//      leaked backup then contains no working links. This mirrors how the KYC identifiers in this
//      project are already handled — full value never persisted.
//   2. Comparison is timing-safe. A plain `===` on a secret leaks its contents to anyone patient
//      enough to measure how long the comparison takes, one character at a time.
//
// ⚠️ Not wired up yet. Guest checkout needs orders.user_id to be nullable (or anonymous auth) plus
// a policy that accepts a token — see supabase/migrations/20260805_cod_and_guest_checkout.sql.

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** Reads the signing secret. Returns null when unset, which keeps the feature dormant. */
export function guestOrderSecret(): string | null {
  const raw = process.env.GUEST_ORDER_SECRET;
  return raw && raw.length >= 32 ? raw : null;
}

/**
 * A fresh, unguessable token for one order. 32 random bytes, url-safe.
 *
 * Random rather than derived from the order id: an id is a guessable input, and anything derived
 * only from it would be forgeable by anyone who learns the secret ONCE for ONE order.
 */
export function createGuestOrderToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * The value safe to store beside the order. Bound to the order id, so a token issued for one
 * order cannot be replayed against another even if both hashes leak.
 */
export function hashGuestOrderToken(
  orderId: string,
  token: string,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(`${orderId}:${token}`)
    .digest("base64url");
}

/**
 * Checks a token presented for an order against the stored hash.
 *
 * Returns false rather than throwing on anything malformed — a caller that has to distinguish
 * "wrong token" from "no token" would be tempted to say so out loud, and telling an attacker
 * which of the two they got is free information.
 */
export function verifyGuestOrderToken(params: {
  orderId: string;
  token: string | null | undefined;
  storedHash: string | null | undefined;
  secret: string | null;
}): boolean {
  const { orderId, token, storedHash, secret } = params;
  if (!secret || !token || !storedHash || !orderId) return false;

  const expected = Buffer.from(
    hashGuestOrderToken(orderId, token, secret),
    "utf8",
  );
  const actual = Buffer.from(storedHash, "utf8");
  // timingSafeEqual throws on a length mismatch, which would itself be a timing signal.
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
