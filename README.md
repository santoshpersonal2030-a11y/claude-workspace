# BookMyPoojari.com

Book verified, experienced **Pandits / Poojaris** for any ceremony, and order
authentic **pooja samagri** kits delivered to your door. A two-sided service
marketplace combined with an e-commerce store.

## Tech stack

| Layer | Choice | Status |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router, TypeScript) | ✅ Set up |
| Styling | **Tailwind CSS 4** | ✅ Set up |
| Database / Auth / Storage | **Supabase** (Postgres) | ⏳ Planned |
| Payments | **Razorpay** (UPI, cards, netbanking) | ⏳ Planned |
| Notifications | **Twilio** (WhatsApp / SMS) | ⏳ Planned |
| Hosting | **Vercel** | ⏳ Planned |
| Domain + email | **Hostinger** (bookmypoojari.com) | ✅ Owned |

## Getting started (local)

```bash
npm install
npm run dev
# open http://localhost:3000
```

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # lint
```

## Project structure

```
src/
  app/                 # Next.js App Router pages
    layout.tsx         # Root layout, fonts, site metadata
    page.tsx           # Homepage
    globals.css        # Design system (brand colours, fonts)
  components/           # Reusable UI (Header, Footer, ...)
  lib/
    poojas.ts          # Pooja catalog (seed data → moves to DB later)
docs/
  PROJECT-PLAN.md      # Full product plan & roadmap
```

## Roadmap

See [`docs/PROJECT-PLAN.md`](docs/PROJECT-PLAN.md) for the full phased plan.

**Phase 1 (MVP):** Homepage → pooja catalog → booking flow → samagri store →
payments → confirmations.
