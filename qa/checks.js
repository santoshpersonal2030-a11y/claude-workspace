#!/usr/bin/env node
/* BookMyPoojari — STATIC QA CHECKS.    Run:  node qa/checks.js
 *
 * This project was built in a seven-day sprint in June 2026 and then sat cold for six weeks.
 * It has 96 pages, 49 API routes and no re-runnable check on any of it beyond the unit tests.
 * This file is that check. It reads source only — no server, no browser, no database.
 * (The Supabase project is PAUSED by design; nothing here touches it.)
 *
 * WHAT IT IS FOR
 * It does not look for new bugs. It LOCKS IN what is currently true, so that if a later change
 * quietly removes a page, drops a pooja, renames a storage bucket or leaks a key into the
 * browser bundle, this fails loudly instead of the build going green over a hole.
 *
 * EVERY CHECK HAS A CONTROL.
 * A check that cannot fail is decoration. Each detector below is also run against a small
 * deliberately-poisoned input, and the control FAILS the run if the detector does not catch it.
 * So a green run means two things: the tree is clean, AND the instrument still works.
 *
 * PROVING THE CHECKS ARE REAL
 * Pass a different tree as the first argument and the whole suite runs against that instead:
 *     node qa/checks.js "C:/path/to/a/copy/of/the/app"
 * On 05-Aug-2026 a copy of this tree was poisoned in eight ways — a page deleted, an API route
 * deleted, a page planted outside [locale], a pooja priced at zero, a bucket misspelt behind a
 * constant, a bucket misspelt at the call site, NEXT_PUBLIC_RAZORPAY_KEY_SECRET added, a live
 * Razorpay key hardcoded, a Telugu key removed, and the plaintext id_number put back into the
 * KYC insert. All ten were caught. Two of them were only caught after this file was fixed:
 * the bucket-behind-a-constant typo slipped through the first version.
 *
 * Exit code 0 = everything passed. 1 = something failed, or a control broke.
 */

"use strict";

// The source modules are TypeScript. Node 24 strips types natively, but warns about it once
// per module; re-exec once with the warning silenced so plain `node qa/checks.js` stays quiet.
if (!process.env.__BMP_QA_CHILD) {
  const { spawnSync } = require("node:child_process");
  const r = spawnSync(
    process.execPath,
    ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", __filename, ...process.argv.slice(2)],
    { stdio: "inherit", env: { ...process.env, __BMP_QA_CHILD: "1" } },
  );
  process.exit(r.status === null ? 1 : r.status);
}

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.argv[2] || path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const APP = path.join(SRC, "app");

let fails = 0;
let controlsBroken = 0;
let passes = 0;

const line = (ok, label, detail) => {
  if (ok) passes++;
  else fails++;
  console.log((ok ? "  PASS  " : "  FAIL  ") + label + (detail ? "   " + detail : ""));
};
// A control asserts the *instrument* works, not the result. It must come out the opposite way.
const control = (ok, label) => {
  if (!ok) controlsBroken++;
  console.log((ok ? "  ctrl  " : " *CONTROL BROKEN* ") + label);
};
const head = (t) => console.log("\n" + t + "\n" + "-".repeat(t.length));

const read = (p) => {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
};

/* Strip comments before scanning. The comments in this codebase spell out the very strings the
   secret-scanner hunts for ("never prefix with NEXT_PUBLIC_", "rzp_test_..."), and on the sister
   project a scanner once passed a check on a padlock that existed only inside a comment. */
const strip = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

const ALL_FILES = walk(SRC);
const TS_FILES = ALL_FILES.filter((f) => /\.tsx?$/.test(f));
const SOURCE = strip(TS_FILES.map(read).join("\n"));

console.log("BookMyPoojari — QA CHECKS");
console.log("reading: " + ROOT);

head("0. CONTROLS ON THE READER ITSELF");
control(TS_FILES.length > 200, `walked ${TS_FILES.length} TypeScript files under src/`);
control(SOURCE.includes("getDictionary"), "the reader really is seeing this app's code");
control(
  !SOURCE.includes("a_symbol_that_is_definitely_not_there_xyz"),
  "the scanner correctly reports an absent symbol as absent",
);
control(
  strip("// NEXT_PUBLIC_FAKE_SECRET=1\nconst real = 1;").includes("NEXT_PUBLIC_FAKE_SECRET") ===
    false,
  "comment stripping removes a line comment (so comments cannot fake a pass)",
);

// ══════════════════════════════════════════════════════════════════════════════
head("1. ROUTE INVENTORY — nothing may silently disappear");
/* A route vanishing is invisible: the build still goes green, there is just one fewer page.
   These are the counts as built and verified on 05-Aug-2026 against `npm run build`, which
   printed 96 page routes, 49 API routes and the 3 root files. */
const EXPECTED = {
  pages: 96,
  apiRoutes: 49,
  authRoutes: 2,
  layouts: 3,
  locales: 3,
  poojas: 48,
  popularPoojas: 4,
  poojaCategories: 5,
  ritualTypes: 7,
};

const relFiles = ALL_FILES.map(rel);
const pages = relFiles.filter((f) => /^src\/app\/.*\/page\.tsx$/.test(f));
const apiRoutes = relFiles.filter((f) => /^src\/app\/api\/.*\/route\.ts$/.test(f));
const authRoutes = relFiles.filter(
  (f) => /^src\/app\/.*\/route\.ts$/.test(f) && !f.startsWith("src/app/api/"),
);
const layouts = relFiles.filter((f) => /^src\/app\/.*layout\.tsx$/.test(f));

line(pages.length === EXPECTED.pages, "96 page routes present", `found ${pages.length}`);
line(
  apiRoutes.length === EXPECTED.apiRoutes,
  "49 API routes present",
  `found ${apiRoutes.length}`,
);
line(
  authRoutes.length === EXPECTED.authRoutes,
  "2 non-API route handlers (auth callback + signout)",
  `found ${authRoutes.length}`,
);
line(layouts.length === EXPECTED.layouts, "3 layouts present", `found ${layouts.length}`);

/* Every page must live under [locale]. A page created outside it renders with no locale in the
   URL and no way to switch language — it would look fine and be permanently English. */
const outsideLocale = pages.filter((p) => !p.startsWith("src/app/[locale]/"));
line(
  outsideLocale.length === 0,
  "every page lives under src/app/[locale]/",
  outsideLocale.length ? outsideLocale.join(", ") : "all 96",
);

control(
  pages.filter((p) => p !== pages[0]).length === EXPECTED.pages - 1,
  "the page counter changes when a page is removed from the list",
);
control(
  ["src/app/poojas/page.tsx"].filter((p) => !p.startsWith("src/app/[locale]/")).length === 1,
  "the outside-[locale] detector catches a page planted outside the segment",
);

// ══════════════════════════════════════════════════════════════════════════════
head("2. POOJA CATALOG — 48, and every row usable");
/* The catalog is the product. `src/lib/poojas.ts` is seed data that the whole site reads:
   listing, detail pages, sitemap, search, booking prices. A dropped or malformed row is a
   page that 404s or a booking priced at zero. */
let poojasMod = null;
try {
  poojasMod = require(path.join(SRC, "lib", "poojas.ts"));
} catch {
  /* fall through to the dynamic-import path below */
}

async function poojaChecks() {
  if (!poojasMod) {
    poojasMod = await import(
      "file:///" + path.join(SRC, "lib", "poojas.ts").split(path.sep).join("/")
    );
  }
  const list = poojasMod.poojas;
  line(Array.isArray(list) && list.length === EXPECTED.poojas, "48 poojas in the catalog", `found ${list.length}`);

  const slugs = list.map((p) => p.slug);
  line(
    new Set(slugs).size === slugs.length,
    "no duplicate pooja slugs",
    `${slugs.length} slugs, ${new Set(slugs).size} unique`,
  );

  const badSlug = list.filter((p) => !/^[a-z0-9-]+$/.test(p.slug || ""));
  line(badSlug.length === 0, "every slug is URL-safe", badSlug.map((p) => p.slug).join(", "));

  const noName = list.filter((p) => !p.name || !String(p.name).trim());
  line(noName.length === 0, "every pooja has a name", `${noName.length} blank`);

  /* The price field is `startingPrice`, not `basePrice` — the first version of this check said
     basePrice and duly flagged all 48 rows as broken. The code was right and the check was wrong,
     which is exactly why a check that reports EVERYTHING as failing should be suspected first. */
  const badPrice = list.filter((p) => !(Number(p.startingPrice) > 0));
  line(
    badPrice.length === 0,
    "every pooja has a starting price above zero",
    badPrice.length ? badPrice.map((p) => p.slug).join(", ") : "48 priced",
  );

  const noEmoji = list.filter((p) => !p.emoji || !String(p.emoji).trim());
  line(
    noEmoji.length === 0,
    "every pooja has an emoji (the cards render it)",
    noEmoji.length ? noEmoji.map((p) => p.slug).join(", ") : "48 with icons",
  );

  const noDuration = list.filter((p) => !(Number(p.durationHours) > 0));
  line(
    noDuration.length === 0,
    "every pooja has a duration above zero",
    noDuration.length ? noDuration.map((p) => p.slug).join(", ") : "48 timed",
  );

  const noDesc = list.filter((p) => !p.shortDescription || !String(p.shortDescription).trim());
  line(
    noDesc.length === 0,
    "every pooja has a short description (the card body + meta description)",
    noDesc.length ? noDesc.map((p) => p.slug).join(", ") : "48 described",
  );

  const ritualSet = new Set(poojasMod.ritualTypes);
  const strayRitual = list.filter((p) => !ritualSet.has(p.ritualType));
  line(
    strayRitual.length === 0,
    "every pooja has one of the 7 known ritual types",
    strayRitual.map((p) => `${p.slug}:${p.ritualType}`).join(", "),
  );

  const cats = new Set(poojasMod.poojaCategories);
  const strayCat = list.filter((p) => !cats.has(p.category));
  line(
    strayCat.length === 0,
    "every pooja sits in one of the 5 known categories",
    strayCat.map((p) => `${p.slug}:${p.category}`).join(", "),
  );
  line(
    poojasMod.poojaCategories.length === EXPECTED.poojaCategories,
    "5 pooja categories",
    `found ${poojasMod.poojaCategories.length}`,
  );
  line(
    poojasMod.ritualTypes.length === EXPECTED.ritualTypes,
    "7 ritual types",
    `found ${poojasMod.ritualTypes.length}`,
  );
  line(
    poojasMod.popularPoojas.length === EXPECTED.popularPoojas,
    "4 poojas flagged popular (the home page grid)",
    `found ${poojasMod.popularPoojas.length}`,
  );

  // Controls: the same detectors, run over a deliberately broken catalog.
  const poisoned = [
    {
      slug: "ok-one",
      name: "Fine",
      startingPrice: 100,
      emoji: "🪔",
      durationHours: 2,
      category: [...cats][0],
      ritualType: [...ritualSet][0],
    },
    {
      slug: "ok-one",
      name: "",
      startingPrice: 0,
      emoji: "",
      durationHours: 0,
      category: "Nonsense Category",
      ritualType: "Nonsense Ritual",
    },
  ];
  control(
    new Set(poisoned.map((p) => p.slug)).size !== poisoned.length,
    "the duplicate-slug detector catches a planted duplicate",
  );
  control(
    poisoned.filter((p) => !(Number(p.startingPrice) > 0)).length === 1,
    "the zero-price detector catches a planted zero price",
  );
  control(
    poisoned.filter((p) => !p.emoji).length === 1,
    "the missing-emoji detector catches a planted blank emoji",
  );
  control(
    poisoned.filter((p) => !ritualSet.has(p.ritualType)).length === 1,
    "the ritual-type detector catches a planted stray ritual type",
  );
  control(
    poisoned.filter((p) => !cats.has(p.category)).length === 1,
    "the category detector catches a planted stray category",
  );
  control(
    poisoned.filter((p) => !p.name || !String(p.name).trim()).length === 1,
    "the blank-name detector catches a planted blank name",
  );
}

// ══════════════════════════════════════════════════════════════════════════════
function bucketChecks() {
  head("3. STORAGE BUCKETS — exactly three, spelled exactly these ways");
  /* Supabase storage buckets are matched by string. A typo does not throw at build time; the
     upload just fails at runtime, in production, for a real priest uploading a real ID.
     All three buckets are currently EMPTY (0 files), so no upload path has ever been proven. */
  const KNOWN = ["product-images", "pandit-photos", "kyc-documents"];

  for (const b of KNOWN) {
    line(SOURCE.includes(`"${b}"`), `bucket name "${b}" still present in source`);
  }

  // Any bucket referenced through .storage.from(...) must be one of the three.
  const strayFrom = (text) => {
    const re = /storage\s*\r?\n?\s*\.from\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
    const seen = new Set();
    let m;
    while ((m = re.exec(text))) seen.add(m[1]);
    return { seen, stray: [...seen].filter((b) => !KNOWN.includes(b)) };
  };
  const direct = strayFrom(SOURCE);
  line(
    direct.stray.length === 0,
    "no unknown bucket referenced via storage.from()",
    direct.stray.length ? direct.stray.join(", ") : `saw: ${[...direct.seen].sort().join(", ")}`,
  );

  /* The check above only sees the literal `.storage.from("…")` shape. Two of the three buckets are
     also reached through a named constant (LOGO_BUCKET, IMAGE_BUCKET), so a typo introduced there
     would be completely invisible to it — and "product-images" would still appear elsewhere in the
     tree, so a simple presence check would stay green too. That gap was found by poisoning a copy
     of this tree and watching the checks pass. This is the fix: any bucket-shaped string literal
     that is ALMOST one of the three, but not exactly, is a typo. */
  const editDistance = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 0; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
    return d[a.length][b.length];
  };
  const nearMisses = (text) => {
    const lits = new Set(
      [...text.matchAll(/["'`]([a-z][a-z0-9]*-[a-z0-9-]+)["'`]/g)].map((m) => m[1]),
    );
    return [...lits].filter(
      (s) => !KNOWN.includes(s) && KNOWN.some((k) => editDistance(s, k) <= 2),
    );
  };
  const misspelt = nearMisses(SOURCE);
  line(
    misspelt.length === 0,
    "no near-miss misspelling of a bucket name anywhere in source",
    misspelt.length ? misspelt.join(", ") : "no string within 2 edits of a bucket name",
  );

  control(
    strayFrom('admin.storage.from("typo-bucket").upload(p)').stray.length === 1,
    "the storage.from detector catches a planted misspelt bucket",
  );
  control(
    nearMisses('const LOGO_BUCKET = "product-imagez";').length === 1,
    "the near-miss detector catches a bucket typo hidden behind a constant",
  );
  control(
    nearMisses('const B = "pandit-fotos";').length === 1,
    "the near-miss detector catches pandit-fotos (2 edits from pandit-photos)",
  );
  control(
    nearMisses('const ok = "product-images"; const also = "booking-events";').length === 0,
    "the near-miss detector does NOT flag the correct names or unrelated hyphenated strings",
  );
}

// ══════════════════════════════════════════════════════════════════════════════
function envChecks() {
  head("4. SECRETS — nothing secret-shaped may be NEXT_PUBLIC_");
  /* Anything named NEXT_PUBLIC_* is inlined into the JavaScript the browser downloads. Putting a
     service-role key or a Razorpay secret behind that prefix hands it to every visitor, silently.
     Three NEXT_PUBLIC_ variables here are *meant* to be public — Supabase's publishable anon key,
     Razorpay's public key id, and the VAPID public key — so they are allowlisted by exact name.
     Anything else that smells like a secret is a failure. */
  const PUBLIC_BY_DESIGN = new Set([
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  ]);
  const SECRET_WORDS = /(SECRET|SERVICE_ROLE|PRIVATE|PASSWORD|_TOKEN|_KEY)(\b|$)/;

  const detectLeaks = (text) => {
    const names = new Set(text.match(/NEXT_PUBLIC_[A-Z0-9_]+/g) || []);
    return [...names].filter((n) => SECRET_WORDS.test(n) && !PUBLIC_BY_DESIGN.has(n));
  };

  const envExample = read(path.join(ROOT, ".env.example"));
  const envLocal = read(path.join(ROOT, ".env.local")); // gitignored; checked when present
  const scanned = SOURCE + "\n" + strip(envExample) + "\n" + strip(envLocal);

  const leaks = detectLeaks(scanned);
  line(
    leaks.length === 0,
    "no secret-shaped variable carries the NEXT_PUBLIC_ prefix",
    leaks.length ? leaks.join(", ") : "source + .env.example + .env.local scanned",
  );

  control(
    detectLeaks("NEXT_PUBLIC_RAZORPAY_KEY_SECRET=abc").length === 1,
    "the prefix detector catches a planted NEXT_PUBLIC_..._SECRET",
  );
  control(
    detectLeaks("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=abc").length === 1,
    "the prefix detector catches a planted NEXT_PUBLIC_ service-role key",
  );
  control(
    detectLeaks("NEXT_PUBLIC_SUPABASE_ANON_KEY=abc").length === 0,
    "the allowlist lets the genuinely-public anon key through",
  );

  // The server-only key must never be read from a client component.
  const clientFiles = TS_FILES.filter((f) => /^\s*["']use client["']/.test(read(f)));
  const leakyClient = clientFiles.filter((f) =>
    strip(read(f)).includes("SUPABASE_SERVICE_ROLE_KEY"),
  );
  line(
    leakyClient.length === 0,
    "no client component reads SUPABASE_SERVICE_ROLE_KEY",
    leakyClient.length ? leakyClient.map(rel).join(", ") : `${clientFiles.length} client files scanned`,
  );
  control(clientFiles.length > 10, `found ${clientFiles.length} "use client" files to scan`);

  head("5. SECRETS — no live key hardcoded anywhere in source");
  /* Placeholders in .env.example are fine and expected. A real key committed to git is not, and
     git never forgets it. These patterns are the shapes of the keys this app actually uses. */
  const KEY_PATTERNS = [
    [/\brzp_live_[A-Za-z0-9]{10,}/g, "Razorpay live key"],
    [/\brzp_test_(?!xxx)[A-Za-z0-9]{10,}/g, "Razorpay test key (real-looking)"],
    [/\bsk_live_[A-Za-z0-9]{10,}/g, "generic live secret key"],
    [/\bsb_secret_[A-Za-z0-9_-]{10,}/g, "Supabase secret key"],
    [/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g, "JWT (service-role shaped)"],
    [/\bAIza[0-9A-Za-z_-]{30,}/g, "Google API key"],
    [/\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, "SendGrid key"],
    [/\bre_[A-Za-z0-9]{24,}/g, "Resend API key"],
  ];

  const scanForKeys = (text) => {
    const hits = [];
    for (const [re, label] of KEY_PATTERNS) {
      const m = text.match(re);
      if (m) hits.push(`${label}: ${m[0].slice(0, 12)}…`);
    }
    return hits;
  };

  const hardcoded = scanForKeys(SOURCE + "\n" + strip(envExample));
  line(
    hardcoded.length === 0,
    "no live-looking API key hardcoded in src/ or .env.example",
    hardcoded.length ? hardcoded.join("; ") : `${TS_FILES.length} files scanned`,
  );

  control(
    scanForKeys('const k = "rzp_live_A1b2C3d4E5f6G7";').length === 1,
    "the key scanner catches a planted Razorpay live key",
  );
  control(
    scanForKeys(
      'const k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.abcdefghij";',
    ).length === 1,
    "the key scanner catches a planted service-role JWT",
  );
  control(
    scanForKeys("NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx").length === 0,
    "the key scanner does NOT flag the documented xxxx placeholder",
  );
}

// ══════════════════════════════════════════════════════════════════════════════
async function i18nChecks() {
  head("6. LANGUAGES — three locales, and the server can translate");
  /* The handoff calls full Hindi/Telugu coverage "pending, needs migrating to app/[locale]".
     The code says otherwise: the [locale] segment exists and getDictionary() is a server-side
     translator. These checks pin the parts that are genuinely done so they cannot regress
     while the remaining gaps are closed. */
  const i18n = await import(
    "file:///" + path.join(SRC, "lib", "i18n.ts").split(path.sep).join("/")
  );

  line(i18n.LOCALES.length === EXPECTED.locales, "3 locales (en, hi, te)", i18n.LOCALES.join(", "));
  line(typeof i18n.getDictionary === "function", "getDictionary() — the server-side translator — is exported");
  line(
    typeof i18n.getDictionary("hi").t === "function" &&
      i18n.getDictionary("hi").t("nav.panchang") !== "nav.panchang",
    "the server translator actually returns Hindi, not the key",
    i18n.getDictionary("hi").t("nav.panchang"),
  );
  line(
    i18n.getDictionary("te").t("nav.panchang") !== "nav.panchang",
    "the server translator actually returns Telugu, not the key",
    i18n.getDictionary("te").t("nav.panchang"),
  );

  control(
    i18n.t("hi", "a.key.that.does.not.exist") === "a.key.that.does.not.exist",
    "a missing key falls through to the key itself (so a gap is visible, not silent)",
  );
  control(
    i18n.t("en", "footer.rights", { year: 2026 }) !== i18n.t("en", "footer.rights"),
    "{var} interpolation really happens (a template is not mistaken for a translation)",
  );

  // Dictionary parity. Read the source dictionaries directly — the module only exposes t().
  const src = read(path.join(SRC, "lib", "i18n.ts"));
  const section = (name) => {
    const start = src.indexOf(`const ${name}: Dict = {`);
    if (start < 0) return "";
    const end = src.indexOf("\n};", start);
    return src.slice(start, end);
  };
  const keysOf = (name) =>
    new Set([...section(name).matchAll(/^\s{2}"([^"]+)":/gm)].map((m) => m[1]));

  const enKeys = keysOf("en");
  const hiKeys = keysOf("hi");
  const teKeys = keysOf("te");

  line(enKeys.size > 500, "the English dictionary parsed", `${enKeys.size} keys`);
  const missingHi = [...enKeys].filter((k) => !hiKeys.has(k));
  const missingTe = [...enKeys].filter((k) => !teKeys.has(k));
  const orphanHi = [...hiKeys].filter((k) => !enKeys.has(k));
  const orphanTe = [...teKeys].filter((k) => !enKeys.has(k));

  /* These are the gaps as they stand on 05-Aug-2026. The check is "no WORSE than today", so
     closing gaps passes and re-opening them fails. Tighten the numbers as they come down. */
  const HI_GAP_MAX = missingHiBaseline();
  const TE_GAP_MAX = missingTeBaseline();
  line(
    missingHi.length <= HI_GAP_MAX,
    `Hindi is no less complete than the 05-Aug baseline (${HI_GAP_MAX} missing)`,
    `${missingHi.length} of ${enKeys.size} English keys missing in Hindi`,
  );
  line(
    missingTe.length <= TE_GAP_MAX,
    `Telugu is no less complete than the 05-Aug baseline (${TE_GAP_MAX} missing)`,
    `${missingTe.length} of ${enKeys.size} English keys missing in Telugu`,
  );
  line(orphanHi.length === 0, "no Hindi key without an English parent", orphanHi.slice(0, 5).join(", "));
  line(orphanTe.length === 0, "no Telugu key without an English parent", orphanTe.slice(0, 5).join(", "));

  /* The footer duplicates three pooja names into the UI dictionary rather than importing the
     105 KB catalog into every page's client bundle. A duplicate that nobody checks is a
     divergence waiting to happen: this is the check that makes the trade safe. */
  const pi = await import(
    "file:///" + path.join(SRC, "lib", "poojas-i18n.ts").split(path.sep).join("/")
  );
  const poojaList = poojasMod.poojas;
  const FOOTER_POOJAS = [
    ["footer.pooja.satyanarayanKatha", "satyanarayan-katha"],
    ["footer.pooja.grihaPravesh", "griha-pravesh"],
    ["footer.pooja.lakshmiPuja", "lakshmi-puja"],
  ];
  const drifted = [];
  for (const [key, slug] of FOOTER_POOJAS) {
    const pooja = poojaList.find((p) => p.slug === slug);
    if (!pooja) {
      drifted.push(`${slug} is no longer in the catalog`);
      continue;
    }
    for (const loc of i18n.LOCALES) {
      const fromDict = i18n.t(loc, key);
      const fromCatalog = pi.localizePooja(pooja, loc).name;
      // The footer label is allowed to be a shortening of the catalog name (the catalog says
      // "Lakshmi Puja (Diwali)"), but it must not say something the catalog does not.
      if (!fromCatalog.startsWith(fromDict)) {
        drifted.push(`${loc}/${slug}: footer "${fromDict}" vs catalog "${fromCatalog}"`);
      }
    }
  }
  line(
    drifted.length === 0,
    "the footer's pooja names still match the catalog translations",
    drifted.length ? drifted.join("; ") : `${FOOTER_POOJAS.length} names × 3 locales agree`,
  );
  control(
    !pi.localizePooja(poojaList[0], "hi").name.startsWith("Satyanarayan Katha"),
    "the drift detector would notice an English footer label against a Hindi catalog name",
  );

  control(hiKeys.size > 100 && teKeys.size > 100, `hi=${hiKeys.size} te=${teKeys.size} keys parsed`);
  control(
    [...enKeys].filter((k) => !new Set([...enKeys].slice(1)).has(k)).length === 1,
    "the missing-key detector reports exactly one gap when one key is withheld",
  );
}
// Baselines live in one place so they are obvious to update as the gaps close.
function missingHiBaseline() {
  return 0;
}
function missingTeBaseline() {
  return 0;
}

// ══════════════════════════════════════════════════════════════════════════════
function sitemapChecks() {
  head("8. SITEMAP — all three languages must be discoverable");
  /* Reads the sitemap the build actually produced, not the code that produces it. Before
     05-Aug-2026 this file listed 117 URLs, every one of them English, with no hreflang at all:
     the Hindi and Telugu pages existed, were fully translated, and could never be found. That
     built sitemap is the control — these checks fail against it. Skipped (not failed) if there
     is no build output, so the suite still runs on a fresh clone. */
  const body = path.join(ROOT, ".next", "server", "app", "sitemap.xml.body");
  if (!fs.existsSync(body)) {
    console.log("  skip  no build output — run `npm run build` first");
    return;
  }
  const xml = read(body);
  const count = (re) => (xml.match(re) || []).length;

  const locs = count(/<loc>/g);
  const hi = count(/<loc>[^<]*\/hi(\/|<)/g);
  const te = count(/<loc>[^<]*\/te(\/|<)/g);
  const alts = count(/hreflang="/g);

  line(locs > 0, "the sitemap has entries", `${locs} URLs`);
  line(hi > 0, "Hindi pages are listed in the sitemap", `${hi} /hi URLs`);
  line(te > 0, "Telugu pages are listed in the sitemap", `${te} /te URLs`);
  line(
    hi === te,
    "Hindi and Telugu are listed equally (neither language is half-published)",
    `hi=${hi} te=${te}`,
  );
  line(alts > 0, "entries carry hreflang alternates", `${alts} hreflang links`);
  line(
    count(/hreflang="x-default"/g) > 0,
    "an x-default alternate is declared",
    `${count(/hreflang="x-default"/g)} x-default links`,
  );

  control(
    (('<loc>https://x.com/poojas</loc>').match(/<loc>[^<]*\/hi(\/|<)/g) || []).length === 0,
    "the /hi detector reports zero against an English-only sitemap (the pre-fix state)",
  );
  control(
    (('<loc>https://x.com/hi/poojas</loc>').match(/<loc>[^<]*\/hi(\/|<)/g) || []).length === 1,
    "the /hi detector finds a Hindi URL when one is present",
  );
  control(
    (("/histogram").match(/<loc>[^<]*\/hi(\/|<)/g) || []).length === 0,
    "the /hi detector is not fooled by an unrelated word starting with hi",
  );

  head("9. PLACEHOLDERS — no {variable} may reach the screen");
  /* Found by looking at the running site, not by any check that existed at the time. The
     announcement bar rendered "Free delivery on orders over {amount}" on all 96 pages, in every
     language, because it is mounted outside the language provider and the provider's default
     translator quietly discarded the vars argument. Nothing failed: not the build, not the type
     checker, not the tests, not the i18n audit — the string was equally wrong in all three
     languages, so a same-in-both-languages test could never see it.
     This reads the rendered pages and fails on any {word} left in visible text. */
  const OUT_DIR = path.join(ROOT, ".next", "server", "app");
  if (!fs.existsSync(OUT_DIR)) {
    console.log("  skip  no build output — run `npm run build` first");
  } else {
    const visibleOf = (html) =>
      html
        .slice(html.indexOf("<body"))
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, "\n");
    // {word} in body text. JSON blobs live inside <script>, which is stripped above.
    const placeholderRe = /\{[a-z][a-zA-Z0-9_]*\}/g;

    const sampled = [];
    const walkOut = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walkOut(p);
        else if (e.name.endsWith(".html")) sampled.push(p);
      }
    };
    walkOut(OUT_DIR);

    const leaks = new Map(); // placeholder -> count of pages
    for (const p of sampled) {
      const found = new Set(visibleOf(read(p)).match(placeholderRe) || []);
      for (const f of found) leaks.set(f, (leaks.get(f) || 0) + 1);
    }
    line(
      leaks.size === 0,
      "no untranslated {placeholder} appears in any rendered page",
      leaks.size
        ? [...leaks.entries()].map(([k, n]) => `${k} on ${n} pages`).join(", ")
        : `${sampled.length} rendered pages scanned`,
    );

    control(
      (("<body><p>over {amount} today</p>").match(placeholderRe) || []).length === 1,
      "the placeholder detector catches a planted {amount}",
    );
    control(
      (("<body><p>a css rule { color: red } here</p>").match(placeholderRe) || []).length === 0,
      "the placeholder detector is not fooled by braces with spaces inside",
    );
    control(sampled.length > 300, `${sampled.length} rendered pages available to scan`);
  }

  head("10. CANONICAL URLs — no page may claim to be a different page");
  /* Read from the rendered HTML. Until 05-Aug-2026 the root layout set the canonical URL, and a
     layout cannot know which page is rendering — so every one of the 96 pages declared itself
     canonical to the site root. To a search engine that reads as "these are all the same page",
     which would have kept the entire site out of the index however good the sitemap was.
     A page with NO canonical is fine (search engines self-canonicalise); a page pointing at the
     wrong URL is not. So this only fails on a canonical that contradicts its own path. */
  const OUT = path.join(ROOT, ".next", "server", "app");
  const canonicalOf = (html) =>
    (html.match(/rel="canonical"\s+href="([^"]+)"/) || [])[1] || null;

  const samples = [
    ["en/about.html", "/about"],
    ["hi/about.html", "/hi/about"],
    ["te/about.html", "/te/about"],
    ["hi/poojas.html", "/hi/poojas"],
    ["en/become-a-pandit.html", "/become-a-pandit"],
    ["hi/become-a-pandit.html", "/hi/become-a-pandit"],
  ];
  let wrong = [];
  let checked = 0;
  for (const [file, expectedPath] of samples) {
    const p = path.join(OUT, file);
    if (!fs.existsSync(p)) continue;
    checked++;
    const c = canonicalOf(read(p));
    if (c && !c.endsWith(expectedPath)) wrong.push(`${file} → ${c}`);
  }
  line(
    checked > 0,
    "sampled rendered pages for a canonical URL",
    `${checked} pages checked`,
  );
  line(
    wrong.length === 0,
    "no page declares a canonical URL belonging to a different page",
    wrong.length ? wrong.join("; ") : `${checked} pages consistent`,
  );

  // The homepage SHOULD have one, and it should be its own locale root.
  const home = path.join(OUT, "hi.html");
  if (fs.existsSync(home)) {
    const c = canonicalOf(read(home));
    line(
      c !== null && /\/hi$/.test(c),
      "the Hindi homepage declares itself canonical",
      String(c),
    );
  }

  control(
    canonicalOf('<link rel="canonical" href="https://x.com/hi"/>') === "https://x.com/hi",
    "the canonical reader extracts the URL",
  );
  control(
    canonicalOf("<html><head></head></html>") === null,
    "the canonical reader reports null when there is no canonical",
  );
  control(
    !"https://x.com/hi".endsWith("/hi/about"),
    "the mismatch detector catches a homepage canonical on an inner page (the pre-fix state)",
  );
}

// ══════════════════════════════════════════════════════════════════════════════
function kycChecks() {
  head("7. KYC — the plaintext ID must not reach the database (regression lock only)");
  /* READ-ONLY. Hardening KYC is explicitly out of scope and needs a decision from Santosh.
     This only pins the safe-by-default behaviour that exists today so a later edit cannot undo it
     without this going red. On the sister project, a field vanished precisely because nobody
     checked the INSERT column list — so that is what is checked here, not the comment above it. */
  const route = strip(read(path.join(APP, "api", "pandit-application", "route.ts")));
  const insertBlock = route.slice(
    route.indexOf('.from("pandit_applications").insert('),
    route.indexOf("});", route.indexOf('.from("pandit_applications").insert(')),
  );

  line(insertBlock.length > 50, "found the pandit_applications INSERT", `${insertBlock.length} chars`);
  line(
    !/(^|[\s,{])id_number\s*[,:]/.test(insertBlock),
    "the raw id_number column is NOT written by the insert",
  );
  line(insertBlock.includes("id_number_masked"), "the masked id IS written");
  line(insertBlock.includes("id_number_enc"), "the encrypted id column IS written");
  line(
    route.includes("kycKey ? encryptKyc(") && route.includes(": null"),
    "the full number is encrypted only when a key is set, and dropped otherwise",
  );

  control(
    /(^|[\s,{])id_number\s*[,:]/.test("{ full_name, id_number, status }"),
    "the plaintext-column detector catches a planted raw id_number",
  );
  control(
    !/(^|[\s,{])id_number\s*[,:]/.test("{ id_number_enc, id_number_masked }"),
    "the detector is not fooled by id_number_enc / id_number_masked",
  );
}

// ══════════════════════════════════════════════════════════════════════════════
(async () => {
  await poojaChecks();
  bucketChecks();
  envChecks();
  await i18nChecks();
  sitemapChecks();
  kycChecks();

  console.log("\n" + "=".repeat(70));
  console.log(`  ${passes} passed, ${fails} failed, ${controlsBroken} controls broken`);
  if (controlsBroken) {
    console.log("  A BROKEN CONTROL MEANS THE CHECKS THEMSELVES ARE NOT TRUSTWORTHY.");
  }
  console.log("=".repeat(70));
  process.exit(fails || controlsBroken ? 1 : 0);
})();
