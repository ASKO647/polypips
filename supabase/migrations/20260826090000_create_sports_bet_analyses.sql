-- The new Sport-universe "Analyse IA" (replaces "Top opportunités" on the
-- Sports Overview page) — deliberately separate from `analyses`
-- (Polymarket's Analyse IA): this analyzes ANY real-world sports bet at
-- ANY bookmaker, submitted by the user (screenshot or manual entry), never
-- a Polymarket market. There is no market_slug/market_url to key off of
-- and no live odds feed to re-check later, so unlike `analyses` there is
-- no resolved/resolved_outcome/resolved_correct tracking here — building a
-- fake "accuracy" number with nothing real to compare against would
-- violate the same "never fabricate data" rule the rest of the app
-- follows. This table exists purely as: (a) the user's own history, (b) a
-- quota counter for analyze-sports-bet's daily limit — a separate counter
-- from analyses' own, since this is a distinct product feature (see the
-- Edge Function's own comment on why the quota isn't shared).

create table if not exists public.sports_bet_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sport text not null,
  participants text not null,
  bet_type text not null,
  selection text not null,
  bookmaker_odds text not null,
  ai_probability numeric not null,
  bookmaker_implied_probability numeric not null,
  edge numeric not null,
  confidence text not null check (confidence in ('Faible', 'Moyenne', 'Élevée')),
  explanation text not null,
  favorable_factors jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  what_could_change text not null,
  created_at timestamptz not null default now()
);

create index if not exists sports_bet_analyses_user_id_created_at_idx
  on public.sports_bet_analyses (user_id, created_at desc);

alter table public.sports_bet_analyses enable row level security;

create policy "Users can view their own sports bet analyses"
  on public.sports_bet_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sports bet analyses"
  on public.sports_bet_analyses for insert
  with check (auth.uid() = user_id);
