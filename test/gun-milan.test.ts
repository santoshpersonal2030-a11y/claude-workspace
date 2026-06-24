import { test } from "node:test";
import assert from "node:assert/strict";

import { ashtakootMilan, YONI_MATRIX, VASHYA_MATRIX } from "../src/lib/gun-milan.ts";

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

test("Yoni matrix is a valid 14×14 symmetric table, diagonal 4, enemies 0", () => {
  assert.equal(YONI_MATRIX.length, 14);
  for (let i = 0; i < 14; i++) {
    assert.equal(YONI_MATRIX[i].length, 14);
    assert.equal(YONI_MATRIX[i][i], 4); // same yoni → full 4
    for (let j = 0; j < 14; j++) {
      assert.equal(YONI_MATRIX[i][j], YONI_MATRIX[j][i], `asymmetric at ${i},${j}`);
      assert.ok(YONI_MATRIX[i][j] >= 0 && YONI_MATRIX[i][j] <= 4);
    }
  }
  // The seven classical mutual-enemy yoni pairs score 0 both ways.
  const enemies: [number, number][] = [
    [0, 8], // Horse–Buffalo
    [1, 13], // Elephant–Lion
    [2, 11], // Sheep–Monkey
    [3, 12], // Serpent–Mongoose
    [4, 10], // Dog–Deer
    [5, 6], // Cat–Rat
    [7, 9], // Cow–Tiger
  ];
  for (const [a, b] of enemies) {
    assert.equal(YONI_MATRIX[a][b], 0, `enemy ${a},${b}`);
    assert.equal(YONI_MATRIX[b][a], 0, `enemy ${b},${a}`);
  }
});

test("Vashya matrix is 5×5, diagonal 2, scores within 0..2", () => {
  assert.equal(VASHYA_MATRIX.length, 5);
  for (let i = 0; i < 5; i++) {
    assert.equal(VASHYA_MATRIX[i].length, 5);
    assert.equal(VASHYA_MATRIX[i][i], 2); // same group → full 2
    for (let j = 0; j < 5; j++) {
      assert.ok(VASHYA_MATRIX[i][j] >= 0 && VASHYA_MATRIX[i][j] <= 2);
    }
  }
});
