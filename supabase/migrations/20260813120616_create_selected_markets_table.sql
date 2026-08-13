-- Shared across all users (no user_id) — this is the AI's own periodic
-- scan of Polymarket, not any individual user's analysis history.
create table if not exists public.selected_markets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  market_url text not null,
  question text not null,
  category text not null default 'Marché',
  decision text not null check (decision in ('YES', 'NO')),
  ai_probability numeric not null,
  market_probability numeric not null,
  edge numeric not null,
  opportunity_score numeric not null,
  confidence text not null check (confidence in ('Faible', 'Moyenne', 'Élevée')),
  explanation text not null,
  favorable_factors jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  what_could_change text not null,
  sources jsonb not null default '[]'::jsonb,
  scanned_at timestamptz not null default now()
);

create index if not exists selected_markets_scanned_at_idx
  on public.selected_markets (scanned_at desc);

create index if not exists selected_markets_opportunity_score_idx
  on public.selected_markets (opportunity_score desc);

alter table public.selected_markets enable row level security;

create policy "Authenticated users can view selected markets"
  on public.selected_markets for select
  to authenticated
  using (true);

-- Deliberately no insert/update/delete policy for anon/authenticated: this
-- table only ever changes from the scan-markets Edge Function's periodic
-- run, which uses the service role key (bypasses RLS) — see that
-- function's own Authorization check for who may trigger it.
