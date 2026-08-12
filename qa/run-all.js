#!/usr/bin/env node
/* BookMyPoojari — THE WHOLE GATE, ONE COMMAND.
 *
 *   node qa/run-all.js              everything that does not need a running server
 *   node qa/run-all.js --full       also builds, and runs the browser suite against npm start
 *
 * WHY THIS EXISTS
 * The gate is seven separate commands and it is easy to run six, see green, and believe the
 * seventh. Worse, several of them SKIP silently: the i18n and a11y audits need `npm run build`
 * output, the reflow suite needs a server, and the live audit needs both. A skipped step and a
 * passed step look identical in a scrollback.
 *
 * So the one rule here: THIS SCRIPT NEVER PRINTS "ALL GREEN" IF ANYTHING WAS SKIPPED.
 * Skips are counted, named, and turn the final verdict amber. Exit code is 0 only when every
 * step ran AND passed.
 */

"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");

const ROOT = path.resolve(__dirname, "..");
const FULL = process.argv.includes("--full");

const C = {
  b: (s) => `\x1b[1m${s}\x1b[0m`,
  g: (s) => `\x1b[32m${s}\x1b[0m`,
  r: (s) => `\x1b[31m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`,
  d: (s) => `\x1b[2m${s}\x1b[0m`,
};

const results = [];

function serverUp(port = 3000) {
  return new Promise((resolve) => {
    const s = net.createConnection({ port, host: "127.0.0.1" }, () => {
      s.end();
      resolve(true);
    });
    s.on("error", () => resolve(false));
    s.setTimeout(1500, () => {
      s.destroy();
      resolve(false);
    });
  });
}

const built = () => fs.existsSync(path.join(ROOT, ".next", "server", "app", "en.html"));

function run(name, cmd, args, { grep } = {}) {
  process.stdout.write(`${C.d("▶")} ${name} … `);
  const started = Date.now();
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    maxBuffer: 64 * 1024 * 1024,
  });
  const secs = ((Date.now() - started) / 1000).toFixed(0);
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  const ok = r.status === 0;
  const detail = grep ? (out.match(grep) || [])[0] : undefined;
  results.push({ name, state: ok ? "pass" : "fail", detail, out });
  console.log(
    `${ok ? C.g("pass") : C.r("FAIL")} ${C.d(`${secs}s`)}${detail ? ` ${C.d(detail.trim())}` : ""}`,
  );
  return ok;
}

function skip(name, why) {
  results.push({ name, state: "skip", detail: why });
  console.log(`${C.d("▶")} ${name} … ${C.y("SKIPPED")} ${C.d(why)}`);
}

(async () => {
  console.log(C.b("\nBookMyPoojari — full QA\n"));
  if (!FULL) {
    console.log(
      C.d("  (no --full: the build and the browser suite will be skipped, and said so)\n"),
    );
  }

  // ── 1. The fast gate — no build, no server ────────────────────────────────
  run("types      (tsc --noEmit)", "npx", ["tsc", "--noEmit"]);
  run("lint       (eslint)", "npm", ["run", "lint"]);
  run("unit tests (node --test)", "npm", ["test"], { grep: /# pass \d+|pass \d+/ });
  run("checks     (qa/checks.js)", "node", ["qa/checks.js"], {
    grep: /\d+ passed, \d+ failed, \d+ controls broken/,
  });

  // ── 2. Anything that reads the built pages ────────────────────────────────
  if (FULL) run("build      (next build)", "npm", ["run", "build"], { grep: /\d+ routes?|✓/ });

  if (built()) {
    run("i18n audit (rendered pages)", "node", ["qa/i18n-audit.js"], {
      grep: /\d+ {2}interface text/,
    });
    run("a11y audit (rendered pages)", "node", ["qa/a11y-audit.js"], {
      grep: /\d+ instances across \d+ rules, \d+ pages scanned/,
    });
  } else {
    const why = "no build output — run with --full, or `npm run build` first";
    skip("i18n audit (rendered pages)", why);
    skip("a11y audit (rendered pages)", why);
  }

  // ── 3. Anything that needs a running server ───────────────────────────────
  const up = await serverUp();
  if (up) {
    run("live audit (dynamic routes)", "node", ["qa/live-audit.js"]);
    run("reflow     (real browser)", "npx", ["playwright", "test", "e2e/reflow.spec.ts"], {
      grep: /\d+ passed|\d+ failed/,
    });
  } else {
    const why = "nothing listening on :3000 — start `npm start` in another terminal";
    skip("live audit (dynamic routes)", why);
    skip("reflow     (real browser)", why);
  }

  // ── The verdict ───────────────────────────────────────────────────────────
  const failed = results.filter((r) => r.state === "fail");
  const skipped = results.filter((r) => r.state === "skip");
  const passed = results.filter((r) => r.state === "pass");

  console.log(`\n${"═".repeat(70)}`);
  console.log(
    `  ${C.g(`${passed.length} passed`)} · ${
      failed.length ? C.r(`${failed.length} FAILED`) : "0 failed"
    } · ${skipped.length ? C.y(`${skipped.length} SKIPPED`) : "0 skipped"}`,
  );

  for (const f of failed) {
    console.log(`\n${C.r("FAILED")} ${C.b(f.name)}`);
    console.log(
      f.out
        .split("\n")
        .filter((l) => /error|fail|✗|✘|FAIL/i.test(l))
        .slice(0, 12)
        .map((l) => `    ${l.trim()}`)
        .join("\n") || "    (see the command's own output above)",
    );
  }

  if (skipped.length) {
    console.log(
      `\n${C.y("⚠ NOT EVERYTHING RAN.")} These prove nothing either way — they did not execute:`,
    );
    for (const s of skipped) console.log(`    ${s.name} — ${s.detail}`);
  }

  /* The whole point. A partial run must never read as a clean bill of health: on this project
     an audit reported "0 issues across 198 pages" for weeks while silently skipping the
     homepage, and both prerender audits skipped 65 dynamic routes while sounding definitive. */
  console.log("═".repeat(70));
  if (failed.length) {
    console.log(C.r("  RED — something is broken. Fix it before committing."));
  } else if (skipped.length) {
    console.log(
      C.y("  AMBER — everything that RAN passed, but not everything ran. Not a green gate."),
    );
    console.log(C.d("  Run `node qa/run-all.js --full` with `npm start` up for the real answer."));
  } else {
    console.log(C.g("  GREEN — every step ran and every step passed."));
  }
  console.log(`${"═".repeat(70)}\n`);

  process.exit(failed.length ? 1 : 0);
})();
