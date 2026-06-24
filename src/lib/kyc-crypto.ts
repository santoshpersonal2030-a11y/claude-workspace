import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// At-rest protection for KYC identifiers (e.g. pandit_applications.id_number).
// The full identifier is encrypted with AES-256-GCM under a server-only key, and
// a separate masked form (last 4 visible) is kept for display — so the plaintext
// is never persisted and admins see only the masked value by default.
//
// Dormant until keyed: with no KYC_ENCRYPTION_KEY set, getKycKey() returns null
// and callers must avoid persisting the plaintext (store only the mask).

const PREFIX = "v1";
const ALGO = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;

// Decodes a 32-byte key from a base64 or hex string; returns null if neither
// decoding yields exactly 32 bytes.
export function decodeKey(raw: string): Buffer | null {
  const b64 = Buffer.from(raw, "base64");
  if (b64.length === KEY_BYTES) return b64;
  const hex = Buffer.from(raw, "hex");
  if (hex.length === KEY_BYTES) return hex;
  return null;
}

// Reads the encryption key from KYC_ENCRYPTION_KEY. Returns null when unset or
// malformed, keeping the feature dormant until correctly keyed.
export function getKycKey(): Buffer | null {
  const raw = process.env.KYC_ENCRYPTION_KEY;
  return raw ? decodeKey(raw) : null;
}

// Encrypts plaintext to "v1:<iv>:<tag>:<ciphertext>" (each part base64).
export function encryptKyc(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    ct.toString("base64"),
  ].join(":");
}

// Decrypts a payload produced by encryptKyc. Throws if the format is wrong, the
// key is wrong, or the ciphertext was tampered with (GCM authentication fails).
export function decryptKyc(payload: string, key: Buffer): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new Error("Unrecognised KYC ciphertext format");
  }
  const [, ivB64, tagB64, ctB64] = parts;
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

// Masks an identifier for display, revealing only the last 4 characters
// (whitespace stripped): "ABCDE1234F" -> "•••••• 234F". Values of 4 or fewer
// characters are fully masked.
export function maskId(value: string): string {
  const v = value.replace(/\s+/g, "");
  if (v.length <= 4) return "•".repeat(v.length);
  return `${"•".repeat(v.length - 4)} ${v.slice(-4)}`;
}
