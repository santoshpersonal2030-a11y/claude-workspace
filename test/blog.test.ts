import { test } from "node:test";
import assert from "node:assert/strict";

import { parseBlogContent } from "../src/lib/blog.ts";

test("parseBlogContent splits headings and paragraphs", () => {
  const sections = parseBlogContent(
    "Intro paragraph one.\n\nIntro paragraph two.\n\n## A Heading\nBody line a\nbody line b\n\nSecond para.",
  );
  assert.equal(sections.length, 2);
  assert.equal(sections[0].heading, undefined);
  assert.deepEqual(sections[0].paragraphs, [
    "Intro paragraph one.",
    "Intro paragraph two.",
  ]);
  assert.equal(sections[1].heading, "A Heading");
  assert.deepEqual(sections[1].paragraphs, [
    "Body line a body line b",
    "Second para.",
  ]);
});

test("parseBlogContent handles empty content", () => {
  assert.deepEqual(parseBlogContent(""), []);
  assert.deepEqual(parseBlogContent("\n\n  \n"), []);
});

test("parseBlogContent handles a leading heading", () => {
  const s = parseBlogContent("## Only Heading\nOne para.");
  assert.equal(s.length, 1);
  assert.equal(s[0].heading, "Only Heading");
  assert.deepEqual(s[0].paragraphs, ["One para."]);
});
