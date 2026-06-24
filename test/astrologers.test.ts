import { test } from "node:test";
import assert from "node:assert/strict";

import {
  astrologers,
  getAstrologer,
  ratePerMinute,
} from "../src/lib/astrologers.ts";

test("astrologer slugs are unique and url-safe", () => {
  const slugs = astrologers.map((a) => a.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate slug");
  for (const slug of slugs) {
    assert.match(slug, /^[a-z0-9-]+$/, `slug not url-safe: ${slug}`);
  }
});

test("every astrologer has sane pricing and metadata", () => {
  for (const a of astrologers) {
    assert.ok(a.name.trim().length > 0, `${a.slug} missing name`);
    assert.ok(a.perMinuteChat > 0, `${a.slug} chat rate must be positive`);
    assert.ok(a.perMinuteCall > 0, `${a.slug} call rate must be positive`);
    // Voice costs at least as much as text, everywhere.
    assert.ok(
      a.perMinuteCall >= a.perMinuteChat,
      `${a.slug} call rate should be >= chat rate`,
    );
    assert.ok(a.rating >= 0 && a.rating <= 5, `${a.slug} rating out of range`);
    assert.ok(a.reviews >= 0, `${a.slug} negative reviews`);
    assert.ok(a.experienceYears > 0, `${a.slug} experience must be positive`);
    assert.ok(a.specialities.length > 0, `${a.slug} needs specialities`);
    assert.ok(a.languages.length > 0, `${a.slug} needs languages`);
  }
});

test("getAstrologer / ratePerMinute resolve from the catalog", () => {
  const a = astrologers[0];
  assert.equal(getAstrologer(a.slug)?.name, a.name);
  assert.equal(getAstrologer("does-not-exist"), undefined);

  assert.equal(ratePerMinute(a.slug, "chat"), a.perMinuteChat);
  assert.equal(ratePerMinute(a.slug, "call"), a.perMinuteCall);
  assert.equal(ratePerMinute("does-not-exist", "chat"), null);
});
