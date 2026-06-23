// Pure referral-code generator. Uppercase, no visually ambiguous characters
// (no I/O/0/1) so codes are easy to read aloud and share.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(
  len = 8,
  rnd: () => number = Math.random,
): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(rnd() * ALPHABET.length)];
  }
  return out;
}

// Normalise a user-entered code: trim, uppercase, strip anything not in the
// alphabet (people paste spaces, dashes, lower-case, etc.).
export function normalizeReferralCode(raw: string): string {
  return raw
    .toUpperCase()
    .split("")
    .filter((c) => ALPHABET.includes(c))
    .join("");
}
