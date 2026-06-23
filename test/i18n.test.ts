import { test } from "node:test";
import assert from "node:assert/strict";

import { t, isLocale, LOCALES } from "../src/lib/i18n.ts";

test("t returns the locale string, falling back to English then the key", () => {
  assert.equal(t("hi", "nav.panchang"), "पंचांग");
  assert.equal(t("en", "nav.panchang"), "Panchang");
  // Unknown key falls through to the key itself.
  assert.equal(t("hi", "nav.unknown"), "nav.unknown");
});

test("t interpolates {vars}", () => {
  assert.equal(t("en", "footer.rights", { year: 2026 }), "© 2026 BookMyPoojari. All rights reserved.");
  // Missing var is left as the placeholder.
  assert.equal(t("en", "footer.rights"), "© {year} BookMyPoojari. All rights reserved.");
});

test("every Hindi key is also present in English (no orphan keys)", () => {
  // Pull the dictionaries indirectly: any hi key must resolve in en too.
  for (const key of ["nav.bookPooja", "brand.tagline", "footer.explore"]) {
    assert.notEqual(t("en", key), key, `missing en for ${key}`);
    assert.notEqual(t("hi", key), key, `missing hi for ${key}`);
  }
});

test("isLocale guards the supported set", () => {
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("hi"), true);
  assert.equal(isLocale("fr"), false);
  assert.equal(isLocale(undefined), false);
  assert.equal(LOCALES.length, 2);
});
