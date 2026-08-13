"use strict";

/* Did a QA step CRASH, or did it FAIL?
 *
 * 13-Aug-2026: tsc and eslint both died with "FATAL ERROR: Zone Allocation failed - process out
 * of memory" while another build ran on the same machine. run-all.js printed FAIL for both —
 * indistinguishable from a genuine type error. Both were clean when re-run alone minutes later.
 *
 * That is the same family of bug as a silent skip: a result that looks like an answer and is not
 * one. A step that COULD NOT RUN must never be reported as a step that found something wrong.
 *
 * The distinction is deliberately conservative in ONE direction. Softening a real failure to
 * "inconclusive" would hide a genuine bug, so these patterns match only crash signatures that no
 * ordinary tool failure produces — note that the bare word "error" is not among them, since
 * almost every failing tool prints it. The controls in test/qa-crashed.test.ts hold that line.
 */

const CRASH_PATTERNS =
  /FATAL ERROR|JavaScript heap out of memory|Zone Allocation failed|ENOMEM|spawnSync|Segmentation fault|killed by signal/i;

/**
 * @param {string} out          combined stdout + stderr
 * @param {number|null} status  exit code (0 means it finished, whatever else it printed)
 * @param {Error|null} error    spawn error, if the process never started
 * @param {string|null} signal  the signal that killed it, if any
 * @returns {boolean} true when the step produced no answer at all
 */
function crashed(out, status, error = null, signal = null) {
  if (status === 0) return false;
  return error != null || signal != null || CRASH_PATTERNS.test(out || "");
}

module.exports = { crashed, CRASH_PATTERNS };
