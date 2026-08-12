#!/usr/bin/env node
/* ONLINE POOJA STORES — THE WHOLE GATE, ONE COMMAND.
 *
 *   node qa/run-all.js
 *
 * Ported from bookmypoojari and IC-38 on 12-Aug-2026. Deliberately NOT a copy of either: this
 * project's gate is small because this project's suite is small — it had NO tests of any kind
 * until today, so pretending otherwise would be the exact dishonesty the runner exists to stop.
 *
 * THE ONE RULE: it never says GREEN when something did not run. A skipped step and a passed step
 * look identical in a scrollback, and that confusion has cost real money on the sibling
 * projects — an audit that reported "0 problems" when 0 things had loaded, and two audits that
 * skipped the homepage for weeks while printing a confident zero.
 *
 * A BROKEN CONTROL IS A FAILURE, even when the exit code is 0. A control is the probe that must
 * give the opposite answer; if it stops working, the run proved nothing.
 */

"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const C = {
  b: (s) => `\x1b[1m${s}\x1b[0m`,
  g: (s) => `\x1b[32m${s}\x1b[0m`,
  r: (s) => `\x1b[31m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`,
  d: (s) => `\x1b[2m${s}\x1b[0m`,
};

const results = [];
const has = (p) => fs.existsSync(path.join(ROOT, p));

function run(name, cmd, args) {
  process.stdout.write(`${C.d("▶")} ${name} … `);
  const t = Date.now();
  /* ⚠️ shell ONLY for npm/npx, NEVER for an absolute path.
     `npm` and `npx` are .cmd shims on Windows and need a shell. But node itself lives at
     "C:\Program Files\nodejs\node.exe", and with shell:true that path is split at the space —
     the shell reports 'C:\Program' is not recognized, exits 1, and produces no output at all.
     This runner did exactly that: it reported qa/checks.js as FAILED without ever running it,
     in 0 seconds, and the verdict looked correct because those checks genuinely do fail right
     now. A QA tool giving the right answer for the wrong reason is the worst possible bug in a
     QA tool — the next time the checks pass, it would still have said FAIL. */
  const needsShell = /^(npm|npx|yarn|pnpm)$/.test(cmd);
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: needsShell,
    maxBuffer: 64 * 1024 * 1024,
  });
  const secs = ((Date.now() - t) / 1000).toFixed(0);
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  const controlBroken = /CONTROL BROKEN|\b[1-9]\d*\s+controls?\s+broken\b/i.test(out);
  const ok = r.status === 0 && !controlBroken;
  const summary = (out.match(/\d+ passed, \d+ failed, \d+ controls broken/) || [])[0];
  results.push({ name, state: ok ? "pass" : "fail", out, controlBroken });
  console.log(
    `${ok ? C.g("pass") : C.r("FAIL")} ${C.d(`${secs}s`)}` +
      `${summary ? ` ${C.d(summary)}` : ""}` +
      `${controlBroken ? ` ${C.r("← CONTROL BROKEN")}` : ""}`,
  );
}

function skip(name, why) {
  results.push({ name, state: "skip", why });
  console.log(`${C.d("▶")} ${name} … ${C.y("SKIPPED")} ${C.d(why)}`);
}

console.log(C.b("\nOnline Pooja Stores — QA\n"));

run("checks  (qa/checks.js)", process.execPath, ["qa/checks.js"]);

/* ⚠️ TYPES ONLY IF TYPESCRIPT IS ACTUALLY INSTALLED.
   Without node_modules, `npx tsc` does NOT fall back to nothing — it downloads an unrelated
   package that happens to be called `tsc` and prints "This is not the tsc command you are
   looking for", then exits non-zero. That reads as "your types are broken" when the truth is
   "you never ran npm install". A false RED costs the same trust as a false GREEN, so this is
   skipped by name instead. */
if (has(path.join("node_modules", "typescript"))) {
  run("types   (tsc --noEmit)", "npx", ["tsc", "--noEmit"]);
} else {
  skip("types   (tsc --noEmit)", "typescript is not installed here — run `npm install` first");
}

// `lint` is in package.json but there is no ESLint config in the repo, so it would either
// prompt or do nothing. Named rather than silently omitted.
if (has(".eslintrc.json") || has(".eslintrc.js") || has("eslint.config.mjs")) {
  run("lint    (next lint)", "npm", ["run", "lint"]);
} else {
  skip("lint    (next lint)", "no ESLint config in the repo — `npm run lint` has nothing to apply");
}

/* Everything below does not exist yet. Naming them every run is the point: an absent test and a
   passing test must never look the same. These are the gaps, not a to-do list I invented. */
const MISSING = [
  ["unit tests", "no test runner and no `test` script — nothing exercises orders.ts or pricing"],
  ["rendered-page audit", "nothing checks the built pages for accessibility or stray placeholders"],
  ["browser / layout", "no Playwright — nothing measures a real page at a real width"],
  ["the money path, live", "Razorpay has never taken a rupee here; checkout is untested end to end"],
];

const failed = results.filter((r) => r.state === "fail");
const passed = results.filter((r) => r.state === "pass");
const skipped = results.filter((r) => r.state === "skip");

console.log(`\n${"═".repeat(72)}`);
console.log(
  `  ran: ${C.g(`${passed.length} passed`)} · ${
    failed.length ? C.r(`${failed.length} FAILED`) : "0 failed"
  }${skipped.length ? ` · ${C.y(`${skipped.length} skipped`)}` : ""}`,
);

for (const f of failed) {
  console.log(`\n${C.r("FAILED")} ${C.b(f.name)}${f.controlBroken ? C.r("  (control broken)") : ""}`);
  console.log(
    (f.out || "")
      .split("\n")
      .filter((l) => /FAIL|CONTROL BROKEN|error/i.test(l))
      .slice(0, 10)
      .map((l) => `    ${l.trim()}`)
      .join("\n") || "    (see output above)",
  );
}

console.log(`\n${C.y("⚠ THESE DO NOT EXIST YET. They prove nothing either way:")}`);
for (const [n, why] of MISSING) console.log(`    ${C.b(n)} — ${C.d(why)}`);

console.log(`${"═".repeat(72)}`);
if (failed.length) {
  console.log(C.r("  RED — something is broken, or a control is."));
} else {
  console.log(C.y("  AMBER — what exists passed. Most of a real gate does not exist yet."));
  console.log(C.d("  This is not a clean bill of health. It is a small suite reporting honestly."));
}
console.log(`${"═".repeat(72)}\n`);

process.exit(failed.length ? 1 : 0);
