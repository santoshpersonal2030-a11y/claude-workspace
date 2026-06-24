-- Live astrology: per-minute chat/call with online astrologers, billed from the wallet.
-- Applied to the bookmypoojari project on 2026-06-24. Kept here as a repo record;
-- schema is otherwise managed directly on the Supabase project.

-- 1. Wallet: allow cash top-ups and per-minute consult debits, with a generic
--    idempotency reference (razorpay order id for top-ups; "session:minute" for charges).
alter table public.wallet_transactions
  add column if not exists reference text;

alter table public.wallet_transactions
  drop constraint if exists wallet_transactions_reason_check;
alter table public.wallet_transactions
  add constraint wallet_transactions_reason_check check (
    reason = any (array[
      'loyalty_earn','redeem','referral_referrer','referral_referee',
      'refund','signup_bonus','admin_adjust','topup','live_consult'
    ]::text[])
  );

create unique index if not exists wallet_transactions_reference_reason_key
  on public.wallet_transactions (reference, reason)
  where reference is not null;

-- 2. Astrologer presence (who is online right now). The roster itself is seed data
--    in src/lib/astrologers.ts; this table holds only mutable status. Public read.
create table if not exists public.live_astrologer_status (
  slug text primary key,
  status text not null default 'offline' check (status in ('online','busy','offline')),
  note text,
  updated_at timestamptz not null default now()
);
comment on table public.live_astrologer_status is 'Mutable online/busy/offline status per astrologer (roster is seed data in code). Public read; writes via service role.';
alter table public.live_astrologer_status enable row level security;
create policy "live_astrologer_status public read"
  on public.live_astrologer_status for select using (true);

-- 3. Live sessions: one metered chat/call between a user and an astrologer.
create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  astrologer_slug text not null,
  astrologer_name text not null,
  channel text not null check (channel in ('chat','call')),
  status text not null default 'active' check (status in ('active','ended','insufficient_balance')),
  rate_per_min integer not null check (rate_per_min > 0),
  minutes_billed integer not null default 0,
  amount_billed integer not null default 0,
  end_reason text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  -- Last heartbeat from the live room; a large gap means the customer left, so
  -- the session is timed out and the idle gap is not billed.
  last_tick_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
comment on table public.live_sessions is 'A per-minute metered live consult (chat/call). Billing columns (minutes_billed, amount_billed, status, ended_at) are written by the service role only.';
alter table public.live_sessions enable row level security;
create policy "live_sessions owner read"
  on public.live_sessions for select using (auth.uid() = user_id);
create policy "live_sessions owner insert"
  on public.live_sessions for insert with check (auth.uid() = user_id);
create index live_sessions_user_idx on public.live_sessions (user_id, created_at desc);

-- 4. Live messages: chat transcript, delivered in real time via Supabase Realtime.
create table if not exists public.live_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  sender text not null check (sender in ('user','astrologer','system')),
  body text not null,
  created_at timestamptz not null default now()
);
comment on table public.live_messages is 'Live consult chat messages. Users insert their own (sender=user); astrologer/system rows are written by the service role.';
alter table public.live_messages enable row level security;
create policy "live_messages owner read"
  on public.live_messages for select
  using (exists (select 1 from public.live_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "live_messages owner insert"
  on public.live_messages for insert
  with check (
    sender = 'user'
    and exists (
      select 1 from public.live_sessions s
      where s.id = session_id and s.user_id = auth.uid() and s.status = 'active'
    )
  );
create index live_messages_session_idx on public.live_messages (session_id, created_at);

-- Realtime delivery for chat + session-status changes.
alter publication supabase_realtime add table public.live_messages;
alter publication supabase_realtime add table public.live_sessions;
