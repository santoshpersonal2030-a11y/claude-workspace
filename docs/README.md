# BookMyPoojari — the documents

**Read `SESSION-12-AUG.md` first.** It is the current state of the project.

These four handoff documents lived in `bookmypoojari\` — *outside* the git repository — until
12-Aug-2026. That meant the code was backed up to GitHub and the notes explaining it were not:
one disk failure would have left a repository nobody could interpret. They are in here now, so
they travel with the code.

⚠️ **Any older note pointing at `bookmypoojari\NIGHT-SHIFT-LOG.md` or `bookmypoojari\HANDOFF.md`
is stale.** The path is `bookmypoojari\app\docs\` now.

## Where to start

| Read | For |
|---|---|
| **`SESSION-12-AUG.md`** | **The current state.** 33 commits, what was built, what is outstanding |
| `NIGHT-SHIFT-LOG.md` | The 05-Aug session — the overselling bug, COD, the first 24 commits. Still accurate about everything it describes |
| `HANDOFF.md` | The 04-Aug snapshot of the whole project, gathered from GitHub, Supabase and the old browser conversations. Its top section is struck through and corrected |
| `NIGHT-SHIFT-PROMPT.md` | The original work order. A historical record, deliberately unedited |

## The working documents

| File | What it is |
|---|---|
| `PROJECT-PLAN.md` | The plan and roadmap the project was built from |
| `WHAT-ELSE-TO-BUILD.md` | The live backlog. ⚠️ Its "already built, just not surfaced" table was wrong about four of five items and is corrected in place |
| `ECOMMERCE-GAP-ANALYSIS.md` | What the store lacks versus a normal shop, tiered by cost |
| `I18N-MIGRATION-PLAN.md` | The Hindi/Telugu audit and plan. ⚠️ Its claim that one helper closes "almost all" of the date strings was measured and is wrong — see SESSION-12-AUG.md |
| `LAUNCH.md` | What going live needs |
| `NATIVE-APP.md` | The Capacitor / TWA app-store route |
| `VERIFICATION.md` | How the project verifies itself |

## A standing warning about all of these

**Every one of these documents has been wrong about something, and each time the code was
right.** The `app/[locale]/` migration described as "large, its own effort" was already done. The
five unbuilt features were four-fifths built. The thousand untranslated dates were three-quarters
untranslatable. A list of what is missing goes stale faster than the code does.

**Trust the code. Then trust `qa/checks.js`, which is run against it.**
