import { test } from "node:test";
import assert from "node:assert/strict";

import {
  createGuestOrderToken,
  hashGuestOrderToken,
  verifyGuestOrderToken,
  guestOrderSecret,
} from "../src/lib/guest-order.ts";

const SECRET = "x".repeat(32);
const ORDER = "11111111-2222-3333-4444-555555555555";
const OTHER = "99999999-8888-7777-6666-555555555555";

test("a freshly issued token verifies against its own stored hash", () => {
  const token = createGuestOrderToken();
  const storedHash = hashGuestOrderToken(ORDER, token, SECRET);
  assert.equal(
    verifyGuestOrderToken({ orderId: ORDER, token, storedHash, secret: SECRET }),
    true,
  );
});

test("the wrong token is rejected", () => {
  const storedHash = hashGuestOrderToken(ORDER, createGuestOrderToken(), SECRET);
  assert.equal(
    verifyGuestOrderToken({
      orderId: ORDER,
      token: createGuestOrderToken(),
      storedHash,
      secret: SECRET,
    }),
    false,
  );
});

test("a token issued for one order does not open another", () => {
  // The whole point of binding the hash to the order id. Without it, one leaked token would open
  // every guest order signed with the same secret.
  const token = createGuestOrderToken();
  const storedHash = hashGuestOrderToken(ORDER, token, SECRET);
  assert.equal(
    verifyGuestOrderToken({ orderId: OTHER, token, storedHash, secret: SECRET }),
    false,
  );
});

test("a different secret does not verify", () => {
  const token = createGuestOrderToken();
  const storedHash = hashGuestOrderToken(ORDER, token, SECRET);
  assert.equal(
    verifyGuestOrderToken({
      orderId: ORDER,
      token,
      storedHash,
      secret: "y".repeat(32),
    }),
    false,
  );
});

test("the stored hash is not the token", () => {
  // If these were ever equal, the database would be holding working links in the clear.
  const token = createGuestOrderToken();
  const storedHash = hashGuestOrderToken(ORDER, token, SECRET);
  assert.notEqual(storedHash, token);
  assert.ok(!storedHash.includes(token));
});

test("tokens are unguessable and never repeat", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 500; i++) seen.add(createGuestOrderToken());
  assert.equal(seen.size, 500, "every token must be unique");
  // 32 random bytes in base64url is 43 characters.
  assert.equal(createGuestOrderToken().length, 43);
});

test("hashing is deterministic for the same inputs", () => {
  const token = createGuestOrderToken();
  assert.equal(
    hashGuestOrderToken(ORDER, token, SECRET),
    hashGuestOrderToken(ORDER, token, SECRET),
  );
});

test("missing pieces are refused rather than throwing", () => {
  const token = createGuestOrderToken();
  const storedHash = hashGuestOrderToken(ORDER, token, SECRET);
  const cases = [
    { orderId: ORDER, token: null, storedHash, secret: SECRET },
    { orderId: ORDER, token: undefined, storedHash, secret: SECRET },
    { orderId: ORDER, token, storedHash: null, secret: SECRET },
    { orderId: ORDER, token, storedHash, secret: null },
    { orderId: "", token, storedHash, secret: SECRET },
    { orderId: ORDER, token: "", storedHash, secret: SECRET },
  ];
  for (const c of cases) {
    assert.equal(verifyGuestOrderToken(c), false);
  }
});

test("a stored hash of the wrong length is refused, not crashed on", () => {
  // timingSafeEqual throws on a length mismatch; that must be caught, not surfaced as a 500.
  assert.equal(
    verifyGuestOrderToken({
      orderId: ORDER,
      token: createGuestOrderToken(),
      storedHash: "short",
      secret: SECRET,
    }),
    false,
  );
});

test("the secret stays dormant until set, and rejects a weak one", () => {
  const before = process.env.GUEST_ORDER_SECRET;
  try {
    delete process.env.GUEST_ORDER_SECRET;
    assert.equal(guestOrderSecret(), null, "unset means the feature is off");

    process.env.GUEST_ORDER_SECRET = "tooshort";
    assert.equal(guestOrderSecret(), null, "a short secret is not accepted");

    process.env.GUEST_ORDER_SECRET = SECRET;
    assert.equal(guestOrderSecret(), SECRET);
  } finally {
    if (before === undefined) delete process.env.GUEST_ORDER_SECRET;
    else process.env.GUEST_ORDER_SECRET = before;
  }
});
