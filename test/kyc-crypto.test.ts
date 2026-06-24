import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

import {
  decodeKey,
  encryptKyc,
  decryptKyc,
  maskId,
} from "../src/lib/kyc-crypto.ts";

const key = randomBytes(32);

test("encrypt/decrypt round-trips the identifier", () => {
  const plain = "ABCDE1234F";
  const payload = encryptKyc(plain, key);
  assert.match(payload, /^v1:[^:]+:[^:]+:[^:]+$/);
  assert.notEqual(payload, plain);
  assert.equal(decryptKyc(payload, key), plain);
});

test("each encryption uses a fresh IV (ciphertexts differ)", () => {
  const a = encryptKyc("123456789012", key);
  const b = encryptKyc("123456789012", key);
  assert.notEqual(a, b);
});

test("decrypting with the wrong key fails", () => {
  const payload = encryptKyc("SECRET99", key);
  assert.throws(() => decryptKyc(payload, randomBytes(32)));
});

test("tampered ciphertext fails authentication", () => {
  const payload = encryptKyc("SECRET99", key);
  const parts = payload.split(":");
  const ct = Buffer.from(parts[3], "base64");
  ct[0] ^= 0xff; // flip a bit
  parts[3] = ct.toString("base64");
  assert.throws(() => decryptKyc(parts.join(":"), key));
});

test("malformed payloads are rejected", () => {
  assert.throws(() => decryptKyc("not-a-payload", key));
  assert.throws(() => decryptKyc("v2:a:b:c", key));
});

test("decodeKey accepts 32-byte base64 and hex, rejects others", () => {
  const raw = randomBytes(32);
  assert.deepEqual(decodeKey(raw.toString("base64")), raw);
  assert.deepEqual(decodeKey(raw.toString("hex")), raw);
  assert.equal(decodeKey("tooshort"), null);
});

test("maskId reveals only the last four characters", () => {
  assert.equal(maskId("ABCDE1234F"), "•••••• 234F");
  assert.equal(maskId("1234 5678 9012"), "•••••••• 9012");
  assert.equal(maskId("1234"), "••••");
  assert.equal(maskId("12"), "••");
});
