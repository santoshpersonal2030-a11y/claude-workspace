# What else this website could do

**Written 05-Aug-2026.** Grounded in what is actually in the code, not in what a marketplace
usually has. Where I claim something exists or doesn't, I checked.

This is a different question from `ECOMMERCE-GAP-ANALYSIS.md`. That one asked *"what does a normal
shop have that this lacks."* This one asks *"what could this particular site become."*

---

## The single most surprising finding

**There is a complete wedding-muhurat engine in this codebase that no page exposes.**

`src/lib/muhurat-engine.ts` is 42 KB of real astrological computation — tithi, nakshatra, yoga,
karana, choghadiya, sunrise/sunset, retrograde planets, vrat days, and a scoring system that rates
a date and says *why* it is or isn't auspicious.

Thirteen of its exported capabilities are **never called from anywhere**:

| Capability | What it does | Used by |
|---|---|---|
| `generateVivahCandidates` | Produces auspicious **wedding** dates | **nothing** |
| `vivahQuality` | Scores a date for a wedding | **nothing** |
| `vivahExclusionReason` | Explains *why* a date is unsuitable | **nothing** |
| `CEREMONY_RULES` | Muhurat rules for **14 ceremonies** | **nothing** |
| `ceremonyExclusionReason` | Why a date fails for a given ceremony | **nothing** |
| `muhuratQuality` | Generic date scoring | **nothing** |
| `retrogradePlanets` | Which planets are retrograde | **nothing** |
| `karanaAt`, `YOGAS` (27) | Further panchang detail | **nothing** |

The hard part is written, tested by its own unit tests, and switched off.

### What that unlocks — "Find your wedding date"

An Indian family planning a wedding does this: they go to a pandit, give both birth details, and
ask which dates in the next year are auspicious. It is one of the highest-intent, highest-value
conversations in this entire market — a wedding is the biggest ceremony spend a family makes.

**You already have every piece:** the vivah candidate generator, the quality scoring, the
exclusion reasons, 14 cities of sunrise data, the Gun Milan compatibility matrices, a pandit
roster, and a booking flow to sell into.

The page does not exist. Building it is mostly wiring.

**Why it matters more than another feature:** it is the one thing on this list that people search
for *by name*, months in advance, with money already committed to the event. It brings the
customer to you at the start of the journey instead of at the end.

---

## The second big idea — and it is really a fix

### Tie the store to the calendar you already own

The samagri store and the muhurat engine do not know each other exists.

That is strange, because **this is a date-critical shop.** Samagri is bought *for a ceremony on a
specific date*. A kit that arrives the day after the muhurat is worthless — not late, worthless.
And you already know, for any city, exactly which dates are auspicious and which festivals are
coming.

Three things fall straight out of that, in increasing order of value:

1. **"Order by ___ to receive before ___"** on every product, driven by the next muhurat.
2. **Festival kits that surface themselves.** There are **85 festivals** in `festivals.ts`. Two
   weeks before Ganesh Chaturthi, the store should be leading with the Ganesh kit — automatically,
   not because someone remembered.
3. **"You have a booking on the 14th — here is the samagri for it."** The booking already knows
   the pooja and the date; the pooja already knows its samagri kit price. Nothing connects them.

This is the highest-revenue-per-hour work available, because it is joining two things you have
already built rather than building a third.

---

## ⚠️ CORRECTED 12-Aug-2026 — four of these five were already built

**The table below was written on 05-Aug and was wrong about most of it.** I checked each function
against the codebase rather than trusting the list, and only one of the five is genuinely
missing. Recorded here rather than quietly edited away, because the list was used to decide what
to work on.

| # | Idea | 05-Aug claim | What is actually true |
|---|---|---|---|
| 1 | Which pandits serve my pincode? | "all unused" | ✅ **Already shipped.** `PanditDirectory.tsx` has a working pincode filter using `resolveTravelBand`, `servesNearby` and `nearbyProximity`, with exact-match priests sorted first and a "may also serve your area" expansion. Only the thin wrapper `servesPincode` is uncalled — a naming artefact, not a missing feature |
| 2 | Priest day-planner / route view | "all unused" | ❌ **Correct — genuinely not built.** `fitsSchedule`, `jobsCompatible`, `travelMinutes` and `isBlackedOut` have no caller anywhere |
| 3 | "Your rashi" personality content | "`RASHI_TRAITS` unused" | ✅ **Already shipped**, as `Kundli.moonTrait`, rendered by `KundliForm`. ⚠️ But the twelve traits are **English only** — a real gap, and a different one |
| 4 | Retrograde warnings | "`retrogradePlanets` unused" | ✅ **Already shipped** on the panchang page — `FullPanchanga.retrogrades`, rendered by `PanchangView` via the `pv.retro` key. Not on the *booking* date picker, which is the remaining gap |
| 5 | Per-ceremony date guidance | "`CEREMONY_RULES` unused" | ✅ **Built on 05-Aug**, hours after this table was written — `muhurat-finder.ts` uses `CEREMONY_RULES` and `muhuratQuality` for all 14 ceremonies |

**The lesson is the one this project keeps relearning: a list of what is missing goes stale faster
than the code does, and this one went stale the same night it was written.** Trust the code.

Still genuinely uncalled from the muhurat engine: `generateVivahCandidates`, `vivahQuality`,
`ceremonyExclusionReason` and `karanaAt`. The finder built its own path through
`generateCeremonyCandidates` instead.

Number 1 also deserves its original note: the e-commerce analysis said there is no pincode
serviceability check. That is true for **shipping samagri** — but not for **pandits**.

---

## Content and reach — where an Indian ceremony site actually gets found

You have **85 festivals, 27 nakshatras, 27 yogas, 14 cities, 48 poojas**. That is a serious
content asset producing very few pages.

- **A page per festival.** 85 pages of "when is X, what pooja, what samagri, book a pandit" —
  each one searched for every year, by name, by millions of people. You currently have a single
  festivals list page.
- ~~**City × pooja pages.**~~ ✅ **BUILT 12-Aug-2026** — `/poojas/[slug]/in/[city]`, 700 routes
  (14 cities × 50 poojas). Each page carries three things that genuinely differ by city and are
  *computed*, not templated: the auspicious dates for that ceremony at that city's sunrise, that
  city's panchang today, and the priests serving it. **Only 14 of the 50 poojas have muhurat
  rules; the other 36 say the timing is flexible rather than showing an invented date.**
  Build cost is bounded: the 4 popular poojas × 14 cities are prerendered (168 pages), the other
  646 routes render on demand and cache for a day. Prerendering all 700 would have added 2,100
  pages to a build that already takes over ten minutes on this laptop.
- **A yearly panchang / festival calendar** people bookmark and return to.

⚠️ **The honest caveat:** thin auto-generated pages are worth nothing and can hurt. These are only
worth building where each page says something a person actually wants — which for festivals and
city-pooja pairs it genuinely can, because the muhurat, the samagri and the local pandits really
do differ.

---

## Trust — the thing this market actually turns on

You are asking a family to let a stranger conduct a sacred ceremony in their home. That is a
bigger ask than any e-commerce purchase, and the site currently does very little to close it.

- **Real pandit profiles.** There are six pandits and **zero photographs** — the storage bucket is
  empty. A photo, a short video, a spoken language list, years of experience, which ceremonies
  they have performed. This is worth more than any feature on this page.
- **Reviews per pandit, shown prominently.** `pandit_reviews` exists as a table. Nobody has ever
  written one, but the frame should be there before the first customer arrives.
- **Video call before booking.** Live astrology already runs over Jitsi — the plumbing exists. A
  five-minute "meet your pandit" call before a wedding booking would close deals that a profile
  page cannot.
- **What actually happens on the day.** A simple, honest timeline: when they arrive, what they
  bring, what you need to arrange, how long it takes. First-time customers do not know, and not
  knowing is why they call a family contact instead of a website.

---

## Recurring revenue — you have more of this than you realise

`pooja_subscriptions` exists as a table, and `recurrence.ts` computes cadences. Beyond that:

- **Annual ceremonies remember themselves.** A Griha Pravesh anniversary, a Satyanarayan Katha
  every Purnima, a Shraddh on the same tithi each year. **The tithi maths is already written** —
  this is the difference between a one-off transaction and a customer for a decade.
- **Temple e-puja subscriptions** — eight temple pujas exist; a monthly offering at a named
  temple, with a photo or video back, is a proven model.
- **The Shraddh/Pitru Paksha calendar.** Deeply personal, annually recurring, and something people
  are genuinely anxious about getting right. The catalog already has `tarpan`, `pind-daan`,
  `pitru-paksha-shraddh` and `antyeshti`.

---

## Where I would NOT spend effort

Being clear about this is as useful as the list above.

- **A mobile app.** The project already has PWA plumbing, Capacitor config and a TWA manifest. An
  app store presence adds a release process and a review queue, and buys almost nothing while the
  website has no traffic.
- **AI chat / an astrology chatbot.** Tempting and cheap to bolt on. It would also confidently
  invent muhurats, and in this market a wrong auspicious date is not a bad answer — it is a
  ruined ceremony. You have a *real* computation engine; use that instead.
- **More payment methods beyond COD.** Razorpay already covers UPI, cards and netbanking.
- **Anything at all before there are product photographs and a company name in the settings.**

---

## If I had to pick five, in order

1. **Photographs and real pandit profiles.** Not a feature. Everything else is decoration without
   it.
2. **"Find your wedding date."** The engine is already written. Highest intent, highest value,
   and nobody else's version of it is connected to an actual bookable pandit.
3. **Join the store to the calendar** — delivery-by-muhurat, festival kits, samagri suggested
   from an existing booking.
4. **Festival pages.** 85 of them, each searched by name, every year, forever.
5. **Annual ceremony reminders.** Turns a transaction into a decade-long relationship, and the
   tithi maths is done.

---

## Where this actually stands — updated 05-Aug-2026

An earlier version of this section said the project waits for 2027. **That is no longer the
position.** Santosh: *"i want to build it and keep it and if i get time and people i might launch
it."*

So this list is a live backlog, not a memento. But "build it and keep it launch-ready" changes the
order of the five above rather than confirming it:

**Build the things that stay valuable whether or not you launch.** The wedding-muhurat page,
festival pages and the store-calendar join are all *code* — they keep their value sitting on a
branch, and they get better the longer they exist.

**Do not spend on the things that decay.** Product photography of stock you have not bought,
courier contracts, a COD float — those are launch costs, and they go stale if the launch is a year
out. They are also the things that need the people you do not yet have.

**Two things do not wait, because they are about not losing what exists:**

1. **The night-shift branch is on one laptop and nowhere else.** Fifteen commits, `origin/main`
   untouched. Keeping the project means keeping the work, and right now one disk failure ends it.
2. **The database is paused and has never had a real `pg_dump`** — only a JSON description of the
   schema. The schema exists in exactly one place, and it is a place that is switched off.
