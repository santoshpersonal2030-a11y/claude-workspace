#!/usr/bin/env node
"use strict";

/* DATABASE BACKUP — every table, to timestamped JSON.
 *
 * WHY THIS EXISTS
 * Checked 14-Aug-2026: this project had NO backup of any kind. No dump script, no scheduled task,
 * no exported data. And the data is not all reproducible from code — `poojas` is seeded from
 * src/lib/poojas.ts, but PRODUCTS AND PANDITS EXIST ONLY IN THE DATABASE. The eleven GST rate
 * corrections made that day, all twelve prices, and six pandit records lived in exactly one place.
 * One bad migration, one wrong delete, one paused-and-purged project, and they were gone.
 *
 * The sister project learned this the expensive way: its backup silently died for EIGHT DAYS while
 * the scheduled task still reported "Ready". Hence the manifest and the freshness check below —
 * ⭐ JUDGE A BACKUP BY THE DATE OF ITS NEWEST DUMP, NEVER BY WHETHER THE JOB SAYS IT RAN.
 *
 *   node qa/backup-db.js              write a new dump under bookmypoojari/backups/
 *   node qa/backup-db.js --check      report on the newest dump and exit non-zero if it is stale
 *
 * ⚠️ WHAT THIS DOES **NOT** CAPTURE — a restore needs all three:
 *   1. This dump ................ the DATA
 *   2. supabase/migrations/ ..... the SCHEMA, functions, triggers and RLS policies (in git)
 *   3. Supabase dashboard ....... auth users, storage buckets, project settings
 * Data alone will not rebuild the shop. Say so out loud rather than discover it mid-incident.
 *
 * Uses the REST API and the service-role key, so it needs no database password and no pg_dump.
 * That is also its limit: it reads rows, not schema.
 */

const fs = require("node:fs");
const path = require("node:path");

const APP = path.resolve(__dirname, "..");
const OUT_ROOT = path.resolve(APP, "..", "backups");
const STALE_AFTER_HOURS = 48;

// Every table in the generated types, 14-Aug-2026. Kept explicit rather than discovered at run
// time: a table that silently disappears from the list is a table that silently stops being
// backed up, and the count check below turns that into a failure instead of a shrug.
const TABLES = [
  "addresses", "blog_posts", "booking_disputes", "booking_messages", "booking_priest_events",
  "bookings", "carts", "company_settings", "consultation_bookings", "contact_messages",
  "coupons", "credit_notes", "invoice_counters", "kit_items", "kyc_access_log",
  "live_astrologer_status", "live_messages", "live_sessions", "muhurat_windows", "notifications",
  "order_items", "orders", "pandit_applications", "pandit_reviews", "pandits", "payments",
  "payouts", "payroll_run_items", "payroll_runs", "peak_days", "pooja_subscriptions", "poojas",
  "priest_compensation", "priest_payout_accounts", "product_reviews", "products", "profiles",
  "push_subscriptions", "rate_imports", "reward_settings", "stock_subscriptions",
  "temple_puja_bookings", "wallet_transactions", "wishlists",
];

function env(key) {
  const file = path.join(APP, ".env.local");
  if (!fs.existsSync(file)) return process.env[key];
  const m = fs.readFileSync(file, "utf8").match(new RegExp("^" + key + "=(.*)$", "m"));
  return (m ? m[1].trim() : "") || process.env[key];
}

const dirs = () =>
  fs.existsSync(OUT_ROOT)
    ? fs.readdirSync(OUT_ROOT).filter((d) => /^\d{4}-\d{2}-\d{2}T/.test(d)).sort()
    : [];

/* --check: is there a RECENT dump? Not "did the job run" — when is the newest folder. */
function check() {
  const all = dirs();
  if (!all.length) {
    console.error("NO BACKUP EXISTS. Run: node qa/backup-db.js");
    process.exit(1);
  }
  const newest = all[all.length - 1];
  const manifestPath = path.join(OUT_ROOT, newest, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error(`Newest dump ${newest} has NO MANIFEST — it did not finish. Treat it as absent.`);
    process.exit(1);
  }
  const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const ageHours = (Date.now() - new Date(m.finishedAt).getTime()) / 36e5;
  console.log(`newest dump : ${newest}`);
  console.log(`age         : ${ageHours.toFixed(1)}h`);
  console.log(`tables      : ${m.tables.length}`);
  console.log(`rows        : ${m.totalRows}`);
  console.log(`failures    : ${m.failed.length ? m.failed.join(", ") : "none"}`);
  if (m.failed.length) {
    console.error("A TABLE FAILED TO DUMP. A partial backup that looks complete is the danger.");
    process.exit(1);
  }
  /* A table that was in the LAST dump and is absent from this one is a DROP, not a pending
     migration — and a dump that quietly stops covering a table is exactly the shape of backup
     that looks healthy until the day it is needed. */
  if (all.length > 1) {
    const prevPath = path.join(OUT_ROOT, all[all.length - 2], "manifest.json");
    if (fs.existsSync(prevPath)) {
      const prev = JSON.parse(fs.readFileSync(prevPath, "utf8"));
      const vanished = (prev.tables || []).filter((tb) => !m.tables.includes(tb));
      if (vanished.length) {
        console.error(`TABLE(S) DISAPPEARED SINCE THE LAST DUMP: ${vanished.join(", ")}`);
        console.error("That is a DROP, not a pending migration. Investigate before trusting this.");
        process.exit(1);
      }
    }
  }

  if (ageHours > STALE_AFTER_HOURS) {
    console.error(`STALE: older than ${STALE_AFTER_HOURS}h. The schedule is not running.`);
    process.exit(1);
  }
  console.log("OK");
}

async function backup() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing. Nothing written.");
    process.exit(1);
  }

  const startedAt = new Date().toISOString();
  const dir = path.join(OUT_ROOT, startedAt.replace(/[:.]/g, "-"));
  fs.mkdirSync(dir, { recursive: true });

  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const counts = {};
  const failed = [];
  const missing = [];
  let totalRows = 0;

  for (const table of TABLES) {
    try {
      // Paged, because a silent 1000-row cap would look exactly like a small table.
      const rows = [];
      for (let from = 0; ; from += 1000) {
        const res = await fetch(`${url}/rest/v1/${table}?select=*&order=id`, {
          headers: { ...headers, Range: `${from}-${from + 999}` },
        });
        if (!res.ok) {
          /* 404 = the table is not in the schema. That is NOT a failed read, and treating it as
             one would cry wolf on every run: `rate_imports` and `kit_items` only exist once their
             migrations are applied. Recorded separately so it is visible without being fatal.
             ⚠️ The case worth watching is a table that was in the LAST dump and is missing from
             this one — that is a DROP, not a pending migration. --check compares the two. */
          if (res.status === 404) {
            missing.push(table);
            console.log(`  ${table.padEnd(26)}  not in schema (migration not applied?)`);
            rows.length = 0;
            break;
          }
          // A table with no `id` column cannot be ordered by it; retry unordered before failing.
          const retry = await fetch(`${url}/rest/v1/${table}?select=*`, { headers });
          if (!retry.ok) throw new Error(`HTTP ${res.status}`);
          rows.push(...(await retry.json()));
          break;
        }
        const page = await res.json();
        rows.push(...page);
        if (page.length < 1000) break;
      }
      if (missing.includes(table)) continue;
      fs.writeFileSync(path.join(dir, `${table}.json`), JSON.stringify(rows, null, 2));
      counts[table] = rows.length;
      totalRows += rows.length;
      console.log(`  ${table.padEnd(26)}${String(rows.length).padStart(6)} rows`);
    } catch (err) {
      failed.push(table);
      console.error(`  ${table.padEnd(26)}FAILED — ${err.message}`);
    }
  }

  const manifest = {
    startedAt,
    finishedAt: new Date().toISOString(),
    project: url.replace("https://", "").split(".")[0],
    tables: Object.keys(counts),
    counts,
    totalRows,
    failed,
    missing,
    notCaptured: [
      "schema, functions, triggers, RLS policies — see supabase/migrations/ (in git)",
      "auth users — export from the Supabase dashboard",
      "storage buckets — export from the Supabase dashboard",
    ],
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));

  if (missing.length) {
    console.log(`  (${missing.length} not in the schema yet: ${missing.join(", ")})`);
  }
  console.log(
    `\n  ${Object.keys(counts).length}/${TABLES.length - missing.length} present tables, ${totalRows} rows -> ${dir}`,
  );
  if (failed.length) {
    console.error(`  ⚠️ ${failed.length} table(s) FAILED: ${failed.join(", ")}`);
    console.error("  This dump is INCOMPLETE. Do not treat it as a backup.");
    process.exit(1);
  }
  console.log("  manifest.json written — --check reads this, not the job's exit code.");
}

if (process.argv.includes("--check")) check();
else backup();
