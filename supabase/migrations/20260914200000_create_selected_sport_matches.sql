-- The Sport universe's "Sélection du jour" (see the scan-sport-matches
-- Edge Function) — same shared/global, no-user_id shape as
-- selected_markets (Polymarket's own "Marchés sélectionnés"): this is the
-- AI's own periodic scan of Football/Basketball/Tennis fixtures, not any
-- individual user's analysis history (that stays in sports_bet_analyses).
create table if not exists public.selected_sport_matches (
  id uuid primary key default gen_random_uuid(),
  sport text not null check (sport in ('football', 'basketball', 'tennis')),
  home_team_name text not null,
  away_team_name text not null,
  competition text,
  kickoff_at timestamptz not null,
  predicted_winner text not null,
  ai_probability numeric not null,
  confidence text not null check (confidence in ('Faible', 'Moyenne', 'Élevée')),
  explanation text not null,
  favorable_factors jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  what_could_change text not null,
  secondary_markets jsonb not null default '[]'::jsonb,
  scanned_at timestamptz not null default now()
);

create index if not exists selected_sport_matches_scanned_at_idx
  on public.selected_sport_matches (scanned_at desc);

create index if not exists selected_sport_matches_kickoff_at_idx
  on public.selected_sport_matches (kickoff_at asc);

alter table public.selected_sport_matches enable row level security;

create policy "Authenticated users can view selected sport matches"
  on public.selected_sport_matches for select
  to authenticated
  using (true);

-- Deliberately no insert/update/delete policy for anon/authenticated: this
-- table only ever changes from the scan-sport-matches Edge Function's
-- periodic run, which uses the service role key (bypasses RLS) — see that
-- function's own Authorization check for who may trigger it.
