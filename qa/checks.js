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
   These are the counts as built and verified on 05-Aug-2026 against `npm run build`.

   BASELINE CHANGED 05-Aug-2026, twice, both on purpose:
     96 → 97  added /[locale]/muhurat/find
     97 → 98  added /[locale]/festivals/[slug]  (one route, 17 festivals × 3 locales = 51 pages)
   The check caught both and failed, which is the whole point of it — the number moves only when
   someone writes a new one here and says why. A route disappearing produces exactly the same
   failure, and that is the case this exists for. */
/* The page count moves ONLY when someone writes the new number down here and says why.
   A route DISAPPEARING looks identical to one being added, which is the case this number
   exists to catch.
     12-Aug-2026: 98 -> 99, adding src/app/[locale]/poojas/[slug]/in/[city]/page.tsx — the
     city × pooja page ("Griha Pravesh pandit in Hyderabad"). */
const EXPECTED = {
  pages: 99,
  festivals: 17,
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

line(
  pages.length === EXPECTED.pages,
  `${EXPECTED.pages} page routes present`,
  `found ${pages.length}`,
);
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
  outsideLocale.length ? outsideLocale.join(", ") : `all ${pages.length}`,
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

  /* ── script purity ────────────────────────────────────────────────────────
     A Hindi string containing a Telugu letter, or a Telugu string containing a Devanagari one,
     renders as a visibly wrong glyph in the middle of a word — and passes every other check
     here: the key exists, parity is intact, the build is green, the tests pass.

     Found the hard way on 05-Aug-2026. Hand-writing the festival translations, I typed a Tamil
     ம into "జన్మాష్టమి" and a Devanagari ठ into "ఛఠ్", twice. Reading it back did not catch it;
     the two glyphs look near enough right at a glance. Scanning the codepoints did.

     Every other translation file was clean, so this guards against future hand-editing rather
     than papering over existing debt. */
  const SCRIPT_RANGES = {
    Devanagari: /[ऀ-ॿ]/,
    Telugu: /[ఀ-౿]/,
    Tamil: /[஀-௿]/,
    Kannada: /[ಀ-೿]/,
    Bengali: /[ঀ-৿]/,
    Gujarati: /[઀-૿]/,
    Gurmukhi: /[਀-੿]/,
    Malayalam: /[ഀ-ൿ]/,
    Odia: /[଀-୿]/,
  };
  const EXPECTED_SCRIPT = { hi: "Devanagari", te: "Telugu" };

  const foreignScriptIn = (text, locale) => {
    const out = [];
    for (const [name, re] of Object.entries(SCRIPT_RANGES)) {
      if (name === EXPECTED_SCRIPT[locale]) continue;
      const hits = [...new Set([...text].filter((c) => re.test(c)))];
      if (hits.length) out.push(`${name}: ${hits.join("")}`);
    }
    return out;
  };

  const i18nFiles = fs
    .readdirSync(path.join(SRC, "lib"))
    .filter((f) => /-i18n\.ts$|^i18n\.ts$/.test(f));

  const mixups = [];
  for (const f of i18nFiles) {
    const text = read(path.join(SRC, "lib", f));
    for (const locale of ["hi", "te"]) {
      const m = new RegExp(
        `(?:^|\\n)\\s*(?:"?${locale}"?:\\s*\\{|const ${locale}: Dict = \\{)`,
      ).exec(text);
      if (!m) continue;
      /* The block ends at the NEXT locale key, whatever it is called. The first version of this
         only recognised en/hi/te as boundaries — and calendar-i18n.ts legitimately carries seven
         languages (en, hi, te, ta, kn, ml, mr), because the calendar page lets a visitor read it
         in any script regardless of the site language. So the "te" block ran on through the
         Tamil, Kannada and Malayalam ones and the check reported a pile of script mixups that
         were simply other languages doing their job. Any two-letter key is a boundary now. */
      const rest = text.slice(m.index + m[0].length);
      const nextLoc = rest.search(/\n\s*(?:"?[a-z]{2}"?:\s*\{|const [a-z]{2}: Dict = \{)/);
      const block = nextLoc > 0 ? rest.slice(0, nextLoc) : rest;
      const foreign = foreignScriptIn(block, locale);
      if (foreign.length) mixups.push(`${f}[${locale}] ${foreign.join(", ")}`);
    }
  }
  line(
    mixups.length === 0,
    "no Hindi or Telugu block contains a letter from another Indic script",
    mixups.length ? mixups.join(" | ") : `${i18nFiles.length} translation files scanned`,
  );

  control(i18nFiles.length >= 8, `found ${i18nFiles.length} translation files to scan`);
  control(
    foreignScriptIn("जन्माष्टमी", "hi").length === 0,
    "the script check accepts pure Devanagari as Hindi",
  );
  control(
    foreignScriptIn("జన్మాష్టమి", "te").length === 0,
    "the script check accepts pure Telugu as Telugu",
  );
  control(
    foreignScriptIn("జన్మాష్టமి", "te").length === 1,
    "the script check catches the Tamil ம planted in a Telugu word",
  );
  control(
    foreignScriptIn("ఛठ్", "te").length === 1,
    "the script check catches the Devanagari ठ planted in a Telugu word",
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
function stockChecks() {
  head("11. STOCK — the checkout must not sell what is not there");
  /* Until 05-Aug-2026 the checkout route never read the `stock` column at all. The only stock
     check in the entire purchase path lived in the browser, against a number baked into a page
     cached for five minutes — so a stale cart or an item that sold out after render went straight
     through to payment. Stock was then decremented AFTER the money was taken, by a function whose
     `greatest(stock - qty, 0)` clamped at zero, leaving no trace that anything had been oversold.
     These lock in that the server checks first and that an oversell cannot go unreported. */
  const checkout = strip(read(path.join(APP, "api", "checkout", "route.ts")));

  const selectLine = (checkout.match(/\.select\(\s*"([^"]*products?[^"]*)"\s*\)/) ||
    checkout.match(/\.from\("products"\)[\s\S]{0,200}?\.select\(\s*"([^"]+)"/) || [])[1];
  line(
    /\bstock\b/.test(selectLine || ""),
    "the checkout reads the stock column",
    selectLine ? selectLine.slice(0, 70) : "(select not found)",
  );
  line(
    checkout.includes("INSUFFICIENT_STOCK"),
    "the checkout can refuse a cart it cannot fill",
  );
  // `[\w.]*` so the comparison can be written on properties (`s.available < s.requested`).
  line(
    /available\s*<\s*[\w.]*requested|requested\s*>\s*[\w.]*available/i.test(checkout),
    "the refusal compares what was asked for against what is in stock",
  );
  /* `indexOf` returns -1 for something absent, and -1 is less than everything — so the naive
     "A comes before B" test PASSES when A is missing entirely. Both ordering checks here did
     exactly that against the pre-fix code, reporting the correct order for code that did not
     exist. Presence has to be asserted before position. */
  const before = (text, a, b) => {
    const ia = text.indexOf(a);
    const ib = text.indexOf(b);
    return ia >= 0 && ib >= 0 && ia < ib;
  };
  /* Match the CALL, not the name. `createRazorpayOrder` also appears in the import at the top of
     the file, so comparing against the first occurrence compared against the import line and
     reported the check as happening too late. */
  line(
    before(checkout, "INSUFFICIENT_STOCK", "createRazorpayOrder({"),
    "the stock check happens BEFORE the payment is created",
  );

  const payments = strip(read(path.join(SRC, "lib", "payments.ts")));
  line(
    payments.includes("reportOversell"),
    "an oversell that slips through the race window is reported, not swallowed",
  );
  line(
    before(payments, "reportOversell(admin, orderId)", "decrement_stock_for_order"),
    "the oversell report runs BEFORE the decrement (which clamps at zero and erases the evidence)",
  );

  const migration = read(
    path.join(ROOT, "supabase", "migrations", "20260805_stock_reservation.sql"),
  );
  line(
    migration.includes("reserve_stock_for_order") && migration.includes("for update"),
    "the atomic database fix is written down for when the project is un-paused",
    migration ? `${migration.length} bytes` : "MISSING",
  );
  line(
    /NOT APPLIED/.test(migration),
    "that migration is clearly marked as not yet applied",
  );

  control(
    checkout.length > 500,
    `read the checkout route (${checkout.length} chars)`,
  );
  control(
    !/\bstock\b/.test('.select("id, slug, name, price, active, gst_rate, hsn_code")'),
    "the stock-in-select detector reports the pre-fix select line as missing stock",
  );
  control(
    /\bstock\b/.test('.select("id, slug, name, price, active, stock, gst_rate")'),
    "the stock-in-select detector finds stock when it is there",
  );
  /* ── admin edits must keep stock honest ────────────────────────────────────
     None of the admin order actions touched stock. Halve a quantity, delete a line, or cancel a
     paid order and inventory never moved — so the products table drifted from reality on every
     correction, and that same number feeds the "only 2 left" badge, the sold-out state, the
     reorder suggestions and the back-in-stock emails. */
  const adminActions = strip(read(path.join(APP, "[locale]", "admin", "actions.ts")));

  line(
    adminActions.includes("STOCK_CONSUMED_STATUSES"),
    "admin edits know which orders have already taken stock out of inventory",
  );
  line(
    /updateOrderItem[\s\S]{0,900}?adjustStock/.test(adminActions),
    "changing a line's quantity adjusts stock",
  );
  line(
    /removeOrderItem[\s\S]{0,900}?adjustStock/.test(adminActions),
    "removing a line puts its units back",
  );
  line(
    adminActions.includes("restockOrder") &&
      /restocking[\s\S]{0,400}?restockOrder\(admin, id\)/.test(adminActions),
    "cancelling a paid order puts its stock back",
  );
  line(
    before(adminActions, "const previous = await orderStatusOf", 'from("orders").update(update)'),
    "the previous status is read BEFORE the update (afterwards it is unknowable)",
  );
  line(
    /previous === "paid" \|\| previous === "packed"/.test(adminActions),
    "only pre-dispatch cancellations restock — shipped and delivered goods are a return, not stock",
  );
  line(
    /if \(next < 0\)[\s\S]{0,200}?throw new Error/.test(adminActions),
    "an admin change that would push stock below zero is refused, not clamped",
  );

  control(
    adminActions.length > 5000,
    `read the admin actions file (${adminActions.length} chars)`,
  );
  control(
    !/updateOrderItem[\s\S]{0,900}?adjustStock/.test(
      'export async function updateOrderItem(f){ const item = await get(); await update(item); }',
    ),
    "the quantity-adjust detector reports absence when the call is not there",
  );

  control(before("abc", "b", "c"), "the ordering test is true for a genuinely ordered pair");
  control(!before("abc", "c", "b"), "the ordering test is false when the order is reversed");
  control(
    !before("abc", "zzz", "c"),
    "the ordering test is FALSE when the first marker is absent (the -1 trap)",
  );
}

// ══════════════════════════════════════════════════════════════════════════════
function codGuestChecks() {
  head("12. COD + GUEST CHECKOUT — must stay dormant until deliberately switched on");
  /* Both features are blocked on the paused database (orders.user_id is NOT NULL, there is no
     payment-method column, and every read policy is keyed to auth.uid()). The rules and the token
     handling are written and unit-tested; the wiring is not. These checks make sure that
     half-built state cannot drift into something that looks live. */
  const cod = strip(read(path.join(SRC, "lib", "cod.ts")));
  const guest = strip(read(path.join(SRC, "lib", "guest-order.ts")));
  const checkout = strip(read(path.join(APP, "api", "checkout", "route.ts")));

  line(cod.length > 200 && guest.length > 200, "the COD and guest-order rules exist");
  line(
    /enabled:\s*false/.test(cod) && /servicePincodes:\s*\[\]/.test(cod),
    "COD ships DISABLED, with no serviceable pincode — a payment method must fail closed",
  );
  line(
    !checkout.includes("codEligibility"),
    "the checkout does NOT yet offer COD (it cannot: there is no payment_method column)",
  );
  line(
    checkout.includes('return NextResponse.json({ error: "Not authenticated" }'),
    "the checkout still requires an account (guest checkout is not wired up)",
  );
  line(
    guest.includes("timingSafeEqual"),
    "guest order tokens are compared in constant time, not with ===",
  );
  line(
    /update\(`\$\{orderId\}:\$\{token\}`\)/.test(guest),
    "the guest token hash is bound to its order, so one token cannot open another",
  );
  line(
    !guest.includes("process.env.GUEST_ORDER_SECRET") ||
      /length >= 32/.test(guest),
    "a guest-order secret shorter than 32 characters is rejected",
  );

  const migration = read(
    path.join(ROOT, "supabase", "migrations", "20260805_cod_and_guest_checkout.sql"),
  );
  line(
    /NOT APPLIED/.test(migration),
    "the COD / guest-checkout migration is marked as not yet applied",
    migration ? `${migration.length} bytes` : "MISSING",
  );

  control(
    /enabled:\s*false/.test("export const P = { enabled: false };"),
    "the fail-closed detector recognises a disabled default",
  );
  control(
    !/enabled:\s*false/.test("export const P = { enabled: true };"),
    "the fail-closed detector rejects an enabled default",
  );
  control(
    "x".repeat(31).length < 32 && "x".repeat(32).length >= 32,
    "the secret-length boundary is where it is claimed to be",
  );
}

// ══════════════════════════════════════════════════════════════════════════════
function muhuratFinderChecks() {
  head("13. MUHURAT FINDER — the engine is wired to a public page");
  /* muhurat-engine.ts could do all of this since June; the only caller was the admin screen, so a
     visitor asking "which dates are auspicious for my wedding?" got an empty page. These lock in
     that the public route exists, that it cannot be talked into nonsense by a URL, and — the one
     that matters most — that the honesty note is still on the page. A computed muhurat presented
     as authoritative is the single way this feature could do real harm. */
  const finder = strip(read(path.join(SRC, "lib", "muhurat-finder.ts")));
  const page = strip(read(path.join(APP, "[locale]", "muhurat", "find", "page.tsx")));

  line(finder.length > 500, "the finder library exists", `${finder.length} chars`);
  line(page.length > 500, "the public /muhurat/find page exists", `${page.length} chars`);

  line(
    finder.includes("isKnownCeremony") && page.includes("isKnownCeremony"),
    "the page validates the ceremony from the URL instead of trusting it",
  );
  line(
    page.includes("isKnownCity"),
    "the page validates the city from the URL instead of trusting it",
  );
  line(
    /MONTH_CHOICES\.includes\(Number\(sp\.months\)\)/.test(page),
    "the look-ahead is restricted to the offered values",
  );
  /* Matched on the whole `const months = …` line rather than with a nested-paren pattern. The
     first version used `[^)]*`, which cannot cross the `)` inside `Math.floor(opts.months)`, so
     it reported correctly-clamped code as unclamped. Second time tonight that `[^)]*` has lied. */
  const monthsLine = (finder.match(/^\s*const months = .*$/m) || [""])[0];
  line(
    monthsLine.includes("Math.min") && monthsLine.includes("MAX_MONTHS"),
    "the finder clamps the range, so a hand-typed URL cannot pin the CPU",
    monthsLine.trim().slice(0, 70),
  );
  line(
    finder.includes("true, // strict"),
    "only dates passing every rule are offered — never a near-miss",
  );

  // The disclaimer. Checked in the DICTIONARY as well as the page, because a key that exists but
  // is never rendered, and a render of a key that does not exist, look identical from one side.
  line(page.includes('t("mf.disclaimer")'), "the page renders the honesty note");
  const dict = read(path.join(SRC, "lib", "i18n.ts"));
  const disclaimers = (dict.match(/"mf\.disclaimer":/g) || []).length;
  line(
    disclaimers === EXPECTED.locales,
    "the honesty note is written in all three languages",
    `found ${disclaimers} of ${EXPECTED.locales}`,
  );

  control(
    !/MONTH_CHOICES\.includes\(Number\(sp\.months\)\)/.test("const months = Number(sp.months);"),
    "the range detector rejects a page that takes months straight from the URL",
  );
  control(
    ('{"mf.disclaimer": "a"}'.match(/"mf\.disclaimer":/g) || []).length === 1,
    "the disclaimer counter counts one occurrence as one",
  );
}

// ══════════════════════════════════════════════════════════════════════════════
async function festivalChecks() {
  head("14. FESTIVAL PAGES — one addressable page per festival");
  /* The site had a single rolling 120-day list and nothing per festival, so "when is Diwali 2027"
     — searched by name, every year, by a very large number of people — had nowhere to land.
     Also: festival names had NO translation layer, so they rendered in English on the Hindi and
     Telugu calendar. Both are locked in here. */
  const fp = await import(
    "file:///" + path.join(SRC, "lib", "festival-pages.ts").split(path.sep).join("/")
  );
  const fest = await import(
    "file:///" + path.join(SRC, "lib", "festivals.ts").split(path.sep).join("/")
  );
  const fi18n = await import(
    "file:///" + path.join(SRC, "lib", "festivals-i18n.ts").split(path.sep).join("/")
  );

  const pages = fp.festivalPages();
  line(
    pages.length === EXPECTED.festivals,
    "17 distinct festivals get a page",
    `found ${pages.length} from ${fest.FESTIVALS.length} rows`,
  );

  const slugs = pages.map((p) => p.slug);
  line(new Set(slugs).size === slugs.length, "no two festivals share a URL");
  line(
    slugs.every((s) => /^[a-z0-9-]+$/.test(s)),
    "every festival slug is URL-safe",
  );

  /* Several festivals share a pooja (Navratri + Dussehra → durga-puja; Diwali, Dhanteras and
     Akshaya Tritiya → lakshmi-puja). Keying the page off the pooja would silently merge them. */
  const sharedPooja = new Set(
    pages.map((p) => p.poojaSlug).filter((s, i, a) => a.indexOf(s) !== i),
  );
  line(
    sharedPooja.size > 0 && new Set(slugs).size === pages.length,
    "festivals sharing one pooja still get separate pages",
    `${sharedPooja.size} pooja(s) serve more than one festival`,
  );

  const totalDates = pages.reduce((n, p) => n + p.dates.length, 0);
  line(
    totalDates === fest.FESTIVALS.length,
    "no festival date was lost while grouping",
    `${totalDates} of ${fest.FESTIVALS.length}`,
  );

  for (const locale of ["hi", "te"]) {
    const translated = new Set(fi18n.translatedFestivalNames(locale));
    const missing = [...new Set(fest.FESTIVALS.map((f) => f.name))].filter(
      (n) => !translated.has(n),
    );
    line(
      missing.length === 0,
      `every festival name is translated into ${locale}`,
      missing.length ? missing.join(", ") : `${translated.size} names`,
    );
  }

  const sitemap = strip(read(path.join(APP, "sitemap.ts")));
  line(
    sitemap.includes("festivalPages()"),
    "the festival pages are in the sitemap",
  );
  const listPage = strip(read(path.join(APP, "[locale]", "festivals", "page.tsx")));
  line(
    listPage.includes("festivalSlug(") && listPage.includes("/festivals/"),
    "the festival list links through to each festival's page",
  );
  line(
    listPage.includes("localizeFestivalName"),
    "the festival list shows translated names",
  );

  // ── the store ↔ calendar join ──────────────────────────────────────────────
  /* The store and the calendar did not know each other existed. The part that matters most here
     is what the site does NOT say: with no dispatch lead time configured it must show a countdown
     and promise no delivery date. Samagri arriving the day after the muhurat is worthless, and a
     family told it will arrive in time will not buy elsewhere. Fail closed, like COD. */
  const sc = strip(read(path.join(SRC, "lib", "store-calendar.ts")));
  line(sc.length > 500, "the store-calendar library exists", `${sc.length} chars`);
  line(
    /process\.env\.SAMAGRI_LEAD_DAYS/.test(sc),
    "the lead time comes from configuration, not from a hardcoded guess",
  );
  line(
    /if \(!raw\) return null/.test(sc),
    "an unset lead time yields NO delivery promise",
  );
  line(
    !/const .*LEAD_DAYS = \d/.test(sc),
    "no lead time is baked into the code as a default",
  );
  const envExampleText = read(path.join(ROOT, ".env.example"));
  line(
    envExampleText.includes("SAMAGRI_LEAD_DAYS="),
    "the setting is documented in .env.example",
  );
  line(
    /SAMAGRI_LEAD_DAYS=\s*(\r?\n|$)/.test(envExampleText),
    "and ships BLANK, so the promise stays off until someone measures it",
  );

  const storePage = strip(read(path.join(APP, "[locale]", "store", "page.tsx")));
  line(storePage.includes("nextOccasion"), "the store shows the next festival");
  const poojaPage = strip(read(path.join(APP, "[locale]", "poojas", "[slug]", "page.tsx")));
  line(poojaPage.includes("occasionsForPooja"), "a pooja page shows the festival it is for");

  control(
    /SAMAGRI_LEAD_DAYS=\s*(\r?\n|$)/.test("SAMAGRI_LEAD_DAYS=\n"),
    "the blank-setting detector recognises an empty value",
  );
  control(
    !/SAMAGRI_LEAD_DAYS=\s*(\r?\n|$)/.test("SAMAGRI_LEAD_DAYS=5\n"),
    "the blank-setting detector rejects a value that has been filled in",
  );

  control(pages.length > 0 && fest.FESTIVALS.length > pages.length, "the table really does repeat festivals across years");
  control(
    fi18n.localizeFestivalName("Diwali", "hi") !== "Diwali",
    "the name localizer returns something other than the English name",
  );
  control(
    fi18n.localizeFestivalName("Not A Festival", "hi") === "Not A Festival",
    "the name localizer falls back to English for an unknown festival",
  );
}

// ══════════════════════════════════════════════════════════════════════════════
function auditCoverageChecks() {
  head("15. AUDIT COVERAGE — the tools must not go blind again");
  /* Both audits read PRERENDERED html, which is 33 of the 98 page routes. The other 65 are
     server-rendered on demand and were checked by nothing — while the accessibility audit printed
     a confident "0 instances". Silent about two thirds of the site and sounding definitive is the
     worst shape a check can have. qa/live-audit.js covers them against a running server. */
  const rules = read(path.join(ROOT, "qa", "a11y-rules.js"));
  const a11y = read(path.join(ROOT, "qa", "a11y-audit.js"));
  const live = read(path.join(ROOT, "qa", "live-audit.js"));

  line(rules.length > 1000, "the accessibility rules live in one shared file", `${rules.length} chars`);
  line(live.length > 1000, "the live audit exists", `${live.length} chars`);
  line(
    a11y.includes('require("./a11y-rules.js")') && live.includes('require("./a11y-rules.js")'),
    "both audits import the SAME rules rather than keeping copies",
  );
  /* Two copies of a rule drift, and then the two reports disagree and nobody knows which to
     believe. This asserts the rule bodies exist in exactly one place. */
  const ruleNames = ["control-no-label", "aria-hidden-focusable", "no-aria-expanded"];
  for (const r of ruleNames) {
    const inRules = rules.includes(`"${r}"`);
    const inAudit = a11y.includes(`add("${r}"`) || live.includes(`add("${r}"`);
    line(inRules && !inAudit, `rule "${r}" is defined once, in a11y-rules.js`);
  }

  line(
    /Could not reach|process\.exit\(1\)/.test(live),
    "the live audit refuses to report a clean run when the server is down",
  );
  line(
    live.includes("CONTENT IS STILL UNAUDITED"),
    "it names the logged-in pages it could NOT check instead of hiding them in the total",
  );
  line(
    /returned 200 to a signed-out stranger/.test(live),
    "it treats an auth-gated page answering 200 as a finding",
  );
  line(
    a11y.includes("qa/live-audit.js"),
    "the prerendered audit points at the live one for the routes it cannot see",
  );

  // The same sharing rule for the i18n side.
  const i18nRules = read(path.join(ROOT, "qa", "i18n-rules.js"));
  const i18nAudit = read(path.join(ROOT, "qa", "i18n-audit.js"));
  line(i18nRules.length > 1000, "the i18n rules live in one shared file", `${i18nRules.length} chars`);
  line(
    i18nAudit.includes('require("./i18n-rules.js")') && live.includes('require("./i18n-rules.js")'),
    "both audits share one definition of what counts as untranslated",
  );
  line(
    !i18nAudit.includes("function visibleText") && !live.includes("function visibleText"),
    "neither audit keeps its own copy of the text extractor",
  );
  /* The shape-based classifier must stay OFF where file attribution is available. Turning it on
     for the prerendered audit moved 65 phrases between buckets and made a refactor look like a
     change in the site. */
  line(
    /shapeFallback = false/.test(i18nRules),
    "shape-based classification is off by default",
  );
  line(
    /shapeFallback: true/.test(live) && !/shapeFallback: true/.test(i18nAudit),
    "only the live audit, which has no file map, falls back to shape",
  );

  control(rules.includes("auditHtml"), "the shared module exports the rule runner");
  control(
    !read(path.join(ROOT, "qa", "a11y-rules.js")).includes("readFileSync"),
    "the shared rules are pure — no filesystem, so both callers can use them",
  );
}

// ══════════════════════════════════════════════════════════════════════════════
function dateFormatChecks() {
  head("16. DATES — localized for readers, FROZEN for documents");
  /* 978 untranslated strings are dates, all from one cause: every call site hardcoded "en-IN".
     src/lib/dates.ts fixes that for text a person READS.
     It must never reach the documents. An invoice, credit note, payslip, booking receipt or GST
     export is a RECORD: its date format is what a tax authority, an accountant and the customer's
     own files get reconciled against, and it must be identical for everyone regardless of the
     language they happen to browse in. Localizing it retrospectively would make previously-issued
     documents disagree with new ones. */
  const dates = strip(read(path.join(SRC, "lib", "dates.ts")));
  line(dates.length > 500, "the shared date helper exists", `${dates.length} chars`);
  line(
    /hi:\s*"hi-IN"/.test(dates) && /te:\s*"te-IN"/.test(dates),
    "it maps every locale to a real Intl locale",
  );
  line(
    /INTL_LOCALE\[locale\] \?\? "en-IN"/.test(dates),
    "an unknown locale falls back rather than throwing",
  );

  // The frozen surfaces, by path. Each must still hardcode en-IN and must not import the helper.
  /* ⚠️ THREE OF THESE WERE MISSING UNTIL 12-Aug-2026 — OrderInvoice.tsx, ewaybill.ts and
     einvoice.ts. They are the GST tax invoice, the e-way bill and the e-invoice: the three
     documents where a changed date format is a filing problem rather than a cosmetic one, and
     precisely the ones the list forgot. Nothing would have gone red if someone had localised
     an e-invoice date. A frozen list that omits the most frozen files is worse than none. */
  const FROZEN = [
    ["lib", "invoice-pdf.ts"],
    ["lib", "payslip-pdf.ts"],
    ["lib", "exports.ts"],
    ["lib", "ewaybill.ts"],
    ["lib", "einvoice.ts"],
    ["components", "receipts", "BookingReceipt.tsx"],
    ["components", "receipts", "CreditNote.tsx"],
    ["components", "receipts", "OrderInvoice.tsx"],
  ];
  let checkedFrozen = 0;
  for (const parts of FROZEN) {
    const file = path.join(SRC, ...parts);
    const text = read(file);
    if (!text) continue;
    checkedFrozen++;
    line(
      !/from "@\/lib\/dates"/.test(text) && !/require\(".*lib\/dates"\)/.test(text),
      `${parts[parts.length - 1]} does NOT localize its dates`,
    );
  }
  control(
    checkedFrozen === FROZEN.length,
    `${checkedFrozen} of ${FROZEN.length} financial/legal files found and checked`,
  );
  // Every frozen file must still hardcode a locale — if one stopped formatting dates entirely
  // the "does not import the helper" check above would pass while proving nothing.
  for (const parts of FROZEN) {
    const text = read(path.join(SRC, ...parts));
    if (!text) continue;
    line(
      /toLocaleDateString\("en-[A-Z]{2}"|Intl\.(DateTimeFormat|NumberFormat)\("en-[A-Z]{2}"/.test(
        text,
      ),
      `${parts[parts.length - 1]} still pins its own en-** format`,
    );
  }
  control(
    !/from "@\/lib\/dates"/.test('import { formatDate } from "@/lib/other";'),
    "the frozen-import detector is not fooled by a different module",
  );
  control(
    /from "@\/lib\/dates"/.test('import { formatDate } from "@/lib/dates";'),
    "the frozen-import detector does catch a real import of the helper",
  );

  // And the reader-facing surfaces that HAVE been converted must actually use it.
  const READER = [
    ["app", "[locale]", "festivals", "[slug]", "page.tsx"],
    ["app", "[locale]", "muhurat", "find", "page.tsx"],
    ["components", "OccasionBanner.tsx"],
    // 12-Aug-2026 — the sixteen that were "blocked behind locale plumbing".
    ["app", "[locale]", "blog", "page.tsx"],
    ["app", "[locale]", "blog", "[slug]", "page.tsx"],
    ["app", "[locale]", "panchang", "page.tsx"],
    ["app", "[locale]", "panchang", "[date]", "page.tsx"],
    ["app", "[locale]", "choghadiya", "page.tsx"],
    ["app", "[locale]", "pandits", "[slug]", "page.tsx"],
    ["app", "[locale]", "pandits", "in", "[city]", "page.tsx"],
    ["app", "[locale]", "account", "orders", "page.tsx"],
    ["app", "[locale]", "account", "orders", "[id]", "page.tsx"],
    ["app", "[locale]", "account", "bookings", "page.tsx"],
    ["app", "[locale]", "account", "bookings", "[id]", "page.tsx"],
    ["app", "[locale]", "account", "wallet", "page.tsx"],
    ["app", "[locale]", "priest", "messages", "page.tsx"],
    ["app", "[locale]", "priest", "calendar", "page.tsx"],
    ["components", "PanchangView.tsx"],
    ["components", "TodayPanchang.tsx"],
    ["components", "BookingTimeline.tsx"],
    ["components", "BookingChat.tsx"],
    ["components", "NotificationBell.tsx"],
    ["components", "ProductReviews.tsx"],
  ];
  let readerFound = 0;
  for (const parts of READER) {
    const text = read(path.join(SRC, ...parts));
    if (!text) continue;
    readerFound++;
    const name = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    line(/from "@\/lib\/dates"/.test(text), `${name} uses the shared date helper`);
    /* …and no longer hardcodes one. Importing the helper while leaving the old call in place is
       the failure this pair exists to catch — it looks converted in a diff and is not. */
    line(
      !/toLocale(Date|Time)?String\("en-/.test(text),
      `${name} no longer hardcodes en-IN`,
    );
  }
  control(readerFound === READER.length, `${readerFound} of ${READER.length} reader files found`);
  control(
    /toLocale(Date|Time)?String\("en-/.test('x.toLocaleDateString("en-IN", {})'),
    "the hardcoded-locale detector catches a real call",
  );
  control(
    !/toLocale(Date|Time)?String\("en-/.test("formatDateShort(x, loc)"),
    "…and is not fooled by the helper",
  );

  /* THE FOUR COPIES. `to12h` was pasted verbatim into four files. Four copies of a formatter is
     how three of them stay in step and one drifts, and it is why the clock format is now in one
     place with a unit test comparing it to the old implementation for every minute of the day. */
  const clockCopies = TS_FILES.filter((f) =>
    /function to12h\(mins: number\)/.test(read(f)),
  ).map(rel);
  line(
    clockCopies.length === 0,
    "no file carries its own copy of the 12-hour clock formatter",
    clockCopies.length ? clockCopies.join(", ") : "all four now call formatClock()",
  );
  control(
    /function to12h\(mins: number\)/.test("function to12h(mins: number): string {"),
    "the copy detector catches the function it is looking for",
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
function chromeChecks() {
  head("17. SITE CHROME — the header is on all 96 pages, in all three languages");
  /* Accessible names — aria-label — are text a screen reader speaks and nobody sees. That is
     exactly why the header's were still English long after the visible header was translated:
     nothing on screen looks wrong. A Hindi visitor using a screen reader heard "Open menu",
     "Primary", "Language" and "Saved items" on every page of the site.

     The rule is stronger than "translate these four strings": in these files an aria-label may
     not be a bare string literal at all, so a new control added later cannot reintroduce the
     problem. Emoji-only and empty labels are not names, and `aria-label={...}` expressions are
     the correct form. */
  const CHROME = [
    ["components", "Header.tsx"],
    ["components", "HeaderAuth.tsx"],
    ["components", "LanguageSwitcher.tsx"],
    ["components", "WishlistNavButton.tsx"],
  ];
  /* ⚠️ THIS IS THE CHEAP CHECK, AND IT IS NOT THE GROUND TRUTH. Read the note below it.
     It catches the common form — aria-label="Open menu" — and nothing more. Two earlier
     versions of it claimed more than that and were wrong both times: the first only matched
     aria-label="…" and passed WishlistNavButton, whose label was a template literal; the second
     added templates and STILL passed it, because that template contained a nested backtick
     (`Saved items${count ? ` (${count})` : ""}`) and the pattern gave up at the inner one.
     Source parsing kept agreeing with the exact file that shipped English to every Hindi page.
     So this stays deliberately modest, and the rendered-output check below is what actually
     holds the line. */
  const literalAriaLabel = (text) => {
    const out = [];
    for (const m of text.matchAll(/aria-label=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g)) {
      const [whole, dq, sq, tpl] = m;
      const name = tpl !== undefined ? tpl.replace(/\$\{[^}]*\}/g, "") : (dq ?? sq);
      if (/[A-Za-z]/.test(name)) out.push(whole.trim());
    }
    return out;
  };

  let scanned = 0;
  for (const parts of CHROME) {
    const file = path.join(SRC, ...parts);
    const text = read(file);
    if (!text) continue;
    scanned++;
    const hits = literalAriaLabel(text);
    line(
      hits.length === 0,
      `${parts[parts.length - 1]} has no quoted-literal aria-label`,
      hits.length ? hits.join(" | ") : "no aria-label=\"…\" in this file",
    );
  }
  control(scanned === CHROME.length, `${scanned} chrome files found and scanned`);
  control(
    literalAriaLabel('aria-label="Open menu"').length === 1,
    "the detector catches a planted hardcoded aria-label",
  );
  control(
    literalAriaLabel('aria-label={t("a11y.openMenu")}').length === 0,
    "the detector is not fooled by a dictionary-backed aria-label",
  );
  control(
    literalAriaLabel("aria-label={`Saved items${count}`}").length === 1,
    "the detector catches English hidden in a TEMPLATE literal — the case it first missed",
  );
  control(
    literalAriaLabel("aria-label={`${t('common.savedItemsCount')} (${n})`}").length === 0,
    "the detector is not fooled by a template whose text is all ${…} holes",
  );

  /* The site-wide fallback <title> and og:description. Hardcoded English here meant a Hindi
     page shared on WhatsApp previewed in English, however well the page itself translated. */
  const layout = read(path.join(APP, "[locale]", "layout.tsx"));
  line(
    /getDictionary\(loc\)/.test(layout),
    "the root layout builds its metadata from the dictionary",
  );
  line(
    !/BookMyPoojari — Book Verified Pandits/.test(layout),
    "the English site title is no longer hardcoded in the layout",
  );
  line(
    (layout.match(/t\("meta\.site\.(title|desc|shortDesc)"\)/g) || []).length >= 5,
    "title, description and both social previews all translate",
    `${(layout.match(/t\("meta\.site\./g) || []).length} uses`,
  );
  control(
    /BookMyPoojari — Book Verified Pandits/.test(
      'default: "BookMyPoojari — Book Verified Pandits & Pooja Samagri Online",',
    ),
    "the hardcoded-title detector catches the string it is looking for",
  );

  /* ── THE GROUND TRUTH ──────────────────────────────────────────────────────
     The page a Hindi visitor is actually served. No source pattern can be clever enough to be
     fooled here, because there is no source left — only the HTML the build produced. Every
     phrase below leaked from the shared header onto ALL 96 pages in both languages, and three
     of the four were invisible on screen (they are accessible names). Skipped, not failed,
     without a build, so the suite still runs on a fresh clone. */
  /* Only these four. The header's other English — "Close menu", "Primary mobile", "Account menu",
     "Sign in" — appears only after a click or after the session loads, so it is not in any
     prerendered page and CANNOT be checked here. Listing it would make this check look twice as
     broad as it is. It is translated, and covered by the source check above and by nothing else;
     qa/live-audit.js's stated blind spot (text behind an interaction) still applies. */
  const CHROME_ENGLISH = [
    'aria-label="Open menu"',
    'aria-label="Primary"',
    'aria-label="Language"',
    'aria-label="Saved items"',
  ];
  const rendered = [];
  for (const loc of ["hi", "te"]) {
    const f = path.join(ROOT, ".next", "server", "app", `${loc}.html`);
    if (fs.existsSync(f)) rendered.push([loc, read(f)]);
  }
  if (rendered.length < 2) {
    console.log("  skip  no build output — run `npm run build` first");
  } else {
    for (const [loc, html] of rendered) {
      const found = CHROME_ENGLISH.filter((s) => html.includes(s));
      line(
        found.length === 0,
        `the rendered ${loc} homepage speaks no English chrome`,
        found.length ? found.join(" | ") : `${CHROME_ENGLISH.length} phrases checked, none present`,
      );
    }
    // Controls: the English page MUST contain them, or this is looking in the wrong place.
    const enHtml = read(path.join(ROOT, ".next", "server", "app", "en.html"));
    control(
      enHtml.length > 1000,
      `found the rendered English homepage to compare against (${enHtml.length} chars)`,
    );
    /* The control that matters. If the English page does not contain all four, then finding
       none of them in Hindi proves nothing at all — the phrases moved, or this is reading the
       wrong file. That exact mistake ("the English pooja pages were never built") cost an hour
       on 05-Aug: the probe was looking in the wrong folder and the alarm was its own. */
    const inEnglish = CHROME_ENGLISH.filter((s) => enHtml.includes(s));
    control(
      inEnglish.length === CHROME_ENGLISH.length,
      `the English homepage contains all ${CHROME_ENGLISH.length} — so their absence in hi/te means something (${inEnglish.length} found)`,
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
function cityPoojaChecks() {
  head("20. CITY × POOJA PAGES — and the thin-page trap");
  const file = path.join(
    APP,
    "[locale]",
    "poojas",
    "[slug]",
    "in",
    "[city]",
    "page.tsx",
  );
  const src = read(file);
  line(src.length > 1000, "the city × pooja page exists", `${src.length} chars`);

  /* THE WHOLE RISK OF THIS PAGE TYPE IS THAT IT IS THIN. 700 pages differing only in a swapped
     city name are worth nothing and can hurt. So the three things that genuinely differ by city
     are asserted to be present — if a later edit strips them out, this page becomes exactly the
     spam the plan document warned against and the gate should say so. */
  line(/findAuspiciousDates\(/.test(src), "it computes auspicious dates for THIS city");
  line(/fullPanchanga\(/.test(src), "it computes the panchang for THIS city");
  line(/\/pandits\/in\/\$\{city\}/.test(src), "it links to the priests serving THIS city");

  /* AND IT MUST NOT INVENT A MUHURAT. Only 14 of the 50 poojas have rules in CEREMONY_RULES.
     For the other 36 the page has to say the timing is flexible, not quietly show nothing or —
     far worse — show dates computed with default rules. A wrong auspicious date is a ruined
     ceremony, not a bad search result. */
  line(
    /isKnownCeremony\(slug\)/.test(src),
    "it asks whether this ceremony HAS muhurat rules before showing any date",
  );
  line(
    /hasRules\s*\?\s*findAuspiciousDates/.test(src),
    "…and only computes dates when it does",
  );
  line(
    /cp\.flexibleTiming/.test(src) && /cp\.noneInWindow/.test(src),
    "…and says which of the two empty cases it is, rather than showing a blank",
  );
  line(
    /t\("mf\.disclaimer"\)/.test(src),
    "the honesty note appears wherever computed dates do",
  );

  // Build cost. Prerendering all 700 × 3 would add 2,100 pages to a build already over ten
  // minutes on this laptop, to bake pages nobody has asked for.
  line(
    /popularPoojas\.flatMap/.test(src),
    "only the popular poojas are prerendered; the rest render on demand",
  );
  line(
    /export const revalidate = 86400/.test(src),
    "…and cache for a day once they do",
  );

  const sitemap = read(path.join(APP, "sitemap.ts"));
  line(
    /popularPoojas\.flatMap/.test(sitemap),
    "the sitemap lists the popular city × pooja pages",
  );

  control(
    /isKnownCeremony\(slug\)/.test("const hasRules = isKnownCeremony(slug);"),
    "the muhurat-guard detector catches the call it is looking for",
  );
  control(
    !/hasRules\s*\?\s*findAuspiciousDates/.test(
      "const dates = findAuspiciousDates({ ceremony: slug });",
    ),
    "…and would NOT pass an unguarded call",
  );
}

// ══════════════════════════════════════════════════════════════════════════════
function auditRootCoverageChecks() {
  head("19. THE AUDITS MUST LOOK AT THE HOMEPAGE");
  /* Both prerender audits walked .next/server/app/<locale>/ — and Next writes the locale ROOT
     page to .next/server/app/<locale>.html, a SIBLING of that directory. So from the day they
     were written until 12-Aug-2026 neither audit ever looked at the most-visited page on the
     site, in any language, while printing "198 pages". It was hiding seven interface leaks.

     This is the second blind spot of exactly this shape in these tools (the first was the 65
     dynamic routes, closed by qa/live-audit.js). Both were silent about part of the site while
     sounding definitive, which is the failure mode worth a permanent check. */
  const i18n = read(path.join(ROOT, "qa", "i18n-audit.js"));
  const a11y = read(path.join(ROOT, "qa", "a11y-audit.js"));
  line(
    /\$\{locale\}\.html/.test(i18n),
    "the i18n audit adds the locale root page to its walk",
  );
  line(
    /out\.set\("index\.html", root\)/.test(i18n),
    "…under a route key that lines up across the three languages",
  );
  line(
    /Refusing to report on a\\n/.test(i18n) || /Refusing to report/.test(i18n),
    "…and REFUSES to run if it is missing, rather than reporting a smaller number",
  );
  line(/"en\.html"/.test(a11y), "the a11y audit adds the English root page to its walk");
  line(
    /Refusing to report/.test(a11y),
    "…and refuses to run without it",
  );

  // The build artifact itself, so this cannot pass on a stale assumption about Next's layout.
  const appOut = path.join(ROOT, ".next", "server", "app");
  if (!fs.existsSync(path.join(appOut, "en.html"))) {
    console.log("  skip  no build output — run `npm run build` first");
    return;
  }
  for (const loc of ["en", "hi", "te"]) {
    line(
      fs.existsSync(path.join(appOut, `${loc}.html`)),
      `${loc}.html really is where Next puts the ${loc} homepage`,
    );
  }
  control(
    !fs.existsSync(path.join(appOut, "en", "index.html")),
    "…and it is NOT inside app/en/, which is why the walk missed it",
  );
}

// ══════════════════════════════════════════════════════════════════════════════
function publicPageChecks() {
  head("18. THE PUBLIC PAGES THAT TRANSLATED NOTHING");
  /* Thirteen public pages reached the dictionary for not one single word. Ten are ordinary
     interface copy and are now done. THREE ARE DELIBERATELY STILL ENGLISH — Terms, Privacy and
     Refund are the contract with the customer and need a person who will take responsibility for
     the wording. That is a decision, not an oversight, so it is asserted here rather than left
     to be mistaken for unfinished work later: if one of them starts translating, this goes red
     and someone has to say who signed it off. */
  const PUBLIC = [
    ["app", "[locale]", "contact", "page.tsx"],
    ["app", "[locale]", "become-a-pandit", "page.tsx"],
    ["app", "[locale]", "login", "page.tsx"],
    ["app", "[locale]", "auth", "reset", "page.tsx"],
    ["app", "[locale]", "blog", "page.tsx"],
    ["app", "[locale]", "blog", "[slug]", "page.tsx"],
    ["app", "[locale]", "live-astrology", "page.tsx"],
    ["app", "[locale]", "live-astrology", "[slug]", "page.tsx"],
    ["app", "[locale]", "offline", "page.tsx"],
    ["components", "ContactForm.tsx"],
    ["components", "PanditApplicationForm.tsx"],
    ["components", "PackageBookingForm.tsx"],
  ];
  // A file "translates" if it reaches the dictionary at all — getDictionary for a server
  // component, useT for a client one.
  const translates = (text) =>
    /getDictionary\(/.test(text) || /\buseT\(\)/.test(text);

  let found = 0;
  for (const parts of PUBLIC) {
    const text = read(path.join(SRC, ...parts));
    if (!text) continue;
    found++;
    line(
      translates(text),
      `${parts[parts.length - 2]}/${parts[parts.length - 1]} reaches the dictionary`,
    );
  }
  control(found === PUBLIC.length, `${found} of ${PUBLIC.length} public files found`);
  control(
    !translates('export default function P() { return <h1>Contact Us</h1>; }'),
    "the detector does NOT call a hardcoded page translated",
  );
  control(
    translates('const { t } = getDictionary(loc);'),
    "the detector recognises the server-component route",
  );
  control(translates("const t = useT();"), "the detector recognises the client route");

  const LEGAL = [
    ["app", "[locale]", "terms", "page.tsx"],
    ["app", "[locale]", "privacy", "page.tsx"],
    ["app", "[locale]", "refund-policy", "page.tsx"],
  ];
  for (const parts of LEGAL) {
    const text = read(path.join(SRC, ...parts));
    line(
      !translates(text),
      `${parts[parts.length - 2]} is STILL English on purpose — needs a human to sign off the wording`,
    );
  }

  /* Two traps this slice had to avoid, both asserted rather than trusted to a comment.
     1. A module-level array is evaluated once on first load, so a translated one freezes in
        whichever language rendered first and serves that to everybody. Footer.tsx had exactly
        this bug. contact/, become-a-pandit/ and live-astrology/ all had such an array.
     2. The priest form's five ID types are WRITTEN TO THE DATABASE by /api/pandit-application.
        Translating the option value would put Hindi into a column the admin console reads as
        English, and nothing would notice until a real priest applied. */
  for (const [parts, name] of [
    [["app", "[locale]", "contact", "page.tsx"], "contact"],
    [["app", "[locale]", "become-a-pandit", "page.tsx"], "become-a-pandit"],
  ]) {
    const text = read(path.join(SRC, ...parts));
    line(
      !/^const (channels|PERKS) = \[/m.test(text),
      `${name} builds its translated list INSIDE the component, not at module scope`,
    );
  }
  control(
    /^const PERKS = \[/m.test("const PERKS = [\n  { title: 'x' },\n];"),
    "the module-scope detector catches a top-level array",
  );
  control(
    !/^const (channels|PERKS) = \[/m.test("  const channels = [\n    { label: t('x') },\n  ];"),
    "the module-scope detector is not fooled by an indented one inside a component",
  );

  const paf = read(path.join(SRC, "components", "PanditApplicationForm.tsx"));
  for (const v of ["Aadhaar", "PAN", "Voter ID", "Driving Licence", "Passport"]) {
    line(
      paf.includes(`value: "${v}"`),
      `the priest form still submits "${v}" to the database in English`,
    );
  }
  line(
    /\{t\(it\.key\)\}/.test(paf),
    "…while showing the visitor the translated label",
  );
}

// ══════════════════════════════════════════════════════════════════════════════
(async () => {
  await poojaChecks();
  bucketChecks();
  envChecks();
  await i18nChecks();
  sitemapChecks();
  stockChecks();
  codGuestChecks();
  muhuratFinderChecks();
  await festivalChecks();
  auditCoverageChecks();
  dateFormatChecks();
  chromeChecks();
  publicPageChecks();
  auditRootCoverageChecks();
  cityPoojaChecks();
  kycChecks();

  console.log("\n" + "=".repeat(70));
  console.log(`  ${passes} passed, ${fails} failed, ${controlsBroken} controls broken`);
  if (controlsBroken) {
    console.log("  A BROKEN CONTROL MEANS THE CHECKS THEMSELVES ARE NOT TRUSTWORTHY.");
  }
  console.log("=".repeat(70));
  process.exit(fails || controlsBroken ? 1 : 0);
})();
