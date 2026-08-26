-- Real cache for individual-athlete sports (tennis, boxing, MMA) sourced
-- from The Odds API — the counterpart to sports_competitions_cache /
-- sports_fixtures_cache, which cover team-vs-team sports from API-Sports.
--
-- Kept as separate tables rather than widening the existing sports_*_cache
-- ones: The Odds API's ids (a competition's sport_key like
-- "tennis_atp_french_open", an event's id like "6c7c164...") are opaque
-- strings, not the stable numeric ids the existing schema's
-- external_league_id/external_fixture_id/external_team_id columns are
-- typed bigint for. Retyping those columns to fit a second, unrelated
-- provider would touch a working system (football/basketball/rugby/
-- baseball) for no benefit to it. See _shared/odds-api.ts and
-- sync-individual-sports-data/index.ts for the sync logic itself.
--
-- There is no separate "teams" cache here: an individual sport has no
-- team to follow independently of a match, so player names are stored
-- directly on each match row (player_home/player_away) — lib/sports/
-- service.ts maps them into the same Team shape team sports use (no
-- logoUrl, exactly like a team-sport Team with a missing crest).

create table if not exists public.odds_api_competitions_cache (
  id uuid primary key default gen_random_uuid(),
  -- 'tennis' | 'boxing' | 'mma' — see lib/sports/types.ts's SportKey.
  sport text not null,
  -- The Odds API's own sport key: one per tournament for tennis (e.g.
  -- "tennis_atp_french_open"), a single fixed key for boxing/MMA (e.g.
  -- "boxing_boxing") since that API doesn't split those by promotion.
  odds_api_sport_key text not null,
  -- Grouping label shown where sports_competitions_cache.country would be
  -- for a team sport (ATP / WTA / ITF / Boxe / MMA) — tennis doesn't
  -- organize by country, so lib/sports/service.ts deliberately reuses the
  -- Competition.country slot for this instead of adding a UI-only field.
  circuit text not null,
  -- The Odds API's own "title" for this sport_key — never invented.
  title text not null,
  active boolean not null default true,
  synced_at timestamptz not null default now(),
  unique (sport, odds_api_sport_key)
);

create index if not exists odds_api_competitions_cache_sport_idx
  on public.odds_api_competitions_cache (sport);

alter table public.odds_api_competitions_cache enable row level security;

create policy "Authenticated users can view cached odds-api competitions"
  on public.odds_api_competitions_cache for select
  to authenticated
  using (true);

-- No insert/update/delete policy for anon/authenticated: only
-- sync-individual-sports-data, via the service role key, ever writes this
-- table.

create table if not exists public.odds_api_matches_cache (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  competition_id uuid not null references public.odds_api_competitions_cache (id) on delete cascade,
  -- The Odds API's own event id — opaque string, not a number.
  odds_api_event_id text not null,
  player_home text not null,
  player_away text not null,
  commence_at timestamptz not null,
  -- Derived from commence_at vs now() at sync time (The Odds API's free
  -- /events endpoint carries no live status) — never a fabricated score
  -- or outcome, purely "has this started yet or not".
  status text not null default 'scheduled' check (status in ('scheduled', 'finished')),
  synced_at timestamptz not null default now(),
  unique (sport, odds_api_event_id)
);

create index if not exists odds_api_matches_cache_sport_commence_idx
  on public.odds_api_matches_cache (sport, commence_at);
create index if not exists odds_api_matches_cache_competition_idx
  on public.odds_api_matches_cache (competition_id);

alter table public.odds_api_matches_cache enable row level security;

create policy "Authenticated users can view cached odds-api matches"
  on public.odds_api_matches_cache for select
  to authenticated
  using (true);

-- No insert/update/delete policy for anon/authenticated: only
-- sync-individual-sports-data, via the service role key, ever writes this
-- table.
