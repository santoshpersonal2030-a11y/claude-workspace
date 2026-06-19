# BookMyPoojari

This repo is **bookmypoojari.com** — a marketplace to book verified Hindu
priests (Pandits/Poojaris) for ceremonies, plus an e-commerce store for pooja
samagri. Stack: Next.js 16 + Tailwind 4 + Supabase + Razorpay + Twilio,
deployed on Vercel. See `docs/PROJECT-PLAN.md` for the full plan and roadmap.

The pooja catalog seed data lives in `src/lib/poojas.ts` and will later move to
the Supabase database. Brand palette (saffron / maroon / gold) is defined in
`src/app/globals.css`.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
