import { test } from "node:test";
import assert from "node:assert/strict";

import { ashtakootMilan } from "../src/lib/gun-milan.ts";

test("identical charts: same nadi → Nadi dosha, perfect sub-koots otherwise", () => {
  const p = { nakshatra: 5, rashi: 1 }; // Mrigashira, Vrishabha
  const r = ashtakootMilan(p, p);
  const by = (n: string) => r.koots.find((k) => k.name === n)!;
  assert.equal(r.max, 36);
  assert.equal(by("Nadi").score, 0); // same nadi
  assert.equal(r.nadiDosha, true);
  assert.equal(by("Yoni").score, 4); // same yoni
  assert.equal(by("Gana").score, 6); // same gana
  assert.equal(by("Graha Maitri").score, 5); // same lord
  assert.equal(by("Bhakoot").score, 7); // same rashi (1-1)
  assert.equal(by("Varna").score, 1);
});

test("total stays within 0..36 and equals the koot sum", () => {
  for (const [a, b] of [
    [{ nakshatra: 1, rashi: 0 }, { nakshatra: 14, rashi: 6 }],
    [{ nakshatra: 27, rashi: 11 }, { nakshatra: 3, rashi: 2 }],
    [{ nakshatra: 10, rashi: 4 }, { nakshatra: 22, rashi: 9 }],
  ] as const) {
    const r = ashtakootMilan(a, b);
    const sum = r.koots.reduce((s, k) => s + k.score, 0);
    assert.equal(r.total, sum);
    assert.ok(r.total >= 0 && r.total <= 36, `total ${r.total}`);
    for (const k of r.koots) assert.ok(k.score >= 0 && k.score <= k.max);
  }
});

test("Bhakoot dosha detected for a 6-8 rashi pair", () => {
  // rashi 0 and rashi 5 → positions 6 and 8 → Shadashtak dosha.
  const r = ashtakootMilan({ nakshatra: 1, rashi: 0 }, { nakshatra: 8, rashi: 5 });
  assert.equal(r.bhakootDosha, true);
  assert.equal(r.koots.find((k) => k.name === "Bhakoot")!.score, 0);
});

test("different nadi scores the full 8", () => {
  // Ashwini (Aadi) vs Bharani (Madhya).
  const r = ashtakootMilan({ nakshatra: 1, rashi: 0 }, { nakshatra: 2, rashi: 0 });
  assert.equal(r.koots.find((k) => k.name === "Nadi")!.score, 8);
  assert.equal(r.nadiDosha, false);
});
