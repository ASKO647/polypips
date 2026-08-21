-- Real sports data cache, populated by the sync-sports-data Edge Function
-- from API-Sports (api-football.com + sibling sport APIs on the same
-- account/key). Replaces lib/sports/mock-data.ts as the source behind
-- lib/sports/service.ts.
--
-- Two tables, not a normalized teams/leagues/fixtures trio: API-Sports'
-- fixtures/games responses already embed full league + both teams' names
-- and logos inline (that's genuinely how the API is shaped — see
-- supabase/functions/_shared/api-sports.ts), so a fixture row IS the
-- complete record needed to render a match card. The one thing fixtures
-- alone can't give the Compétitions page is a competition that currently
-- has no near-term fixture — hence a small separate competitions cache,
-- resolved once (by name search) and refreshed rarely since league
-- metadata barely changes.
--
-- Both tables are a shared read-only cache (like tracked_wallets), not
-- user-scoped data: any authenticated user can select, only the service
-- role (sync-sports-data, bypassing RLS) ever writes.

create table if not exists public.sports_competitions_cache (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  -- The curated "biggest competitions" search term this row was resolved
  -- from (e.g. "Premier League") — see SPORT_COMPETITIONS in
  -- sync-sports-data/index.ts. One row per (sport, search_term); the
  -- external_league_id/name/logo/country columns are filled in once the
  -- API-Sports /leagues search resolves a match, and stay null until then
  -- (a failed resolution is a safe empty row, not a missing one — the next
  -- sync run retries it).
  search_term text not null,
  external_league_id bigint,
  name text,
  country text,
  logo_url text,
  flag_url text,
  -- Season identifier as returned by API-Sports: a 4-digit year for
  -- football (e.g. "2025"), a "YYYY-YYYY" string for most other sports.
  -- Whatever shape it is, it's passed back verbatim as the `season` query
  -- param when fetching this competition's fixtures/games.
  season text,
  resolved_at timestamptz,
  synced_at timestamptz not null default now(),
  unique (sport, search_term)
);

create index if not exists sports_competitions_cache_sport_idx
  on public.sports_competitions_cache (sport);

alter table public.sports_competitions_cache enable row level security;

create policy "Authenticated users can view cached competitions"
  on public.sports_competitions_cache for select
  to authenticated
  using (true);

-- No insert/update/delete policy for anon/authenticated: only
-- sync-sports-data, via the service role key, ever writes this table.

-- Every team ever seen in a synced fixture, kept indefinitely (upserted,
-- never purged) — unlike sports_fixtures_cache, which only holds the
-- near-term window and is cleared/rebuilt every run. This is what makes
-- "Mes équipes" reliable: a followed team stays listable even when its
-- next fixture is further out than the fixtures cache's own window, or
-- between sync runs. country is a heuristic (the competition's own
-- country at the time this team was first seen), not verified per-team —
-- accurate for domestic leagues, approximate for international
-- competitions (e.g. a French club in the Champions League may show
-- "Europe") — fetching each team's real federation would cost one extra
-- API request per team, far beyond the free daily quota for no real
-- benefit over this heuristic.
create table if not exists public.sports_teams_cache (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  external_team_id bigint not null,
  name text not null,
  country text,
  logo_url text,
  synced_at timestamptz not null default now(),
  unique (sport, external_team_id)
);

create index if not exists sports_teams_cache_sport_idx
  on public.sports_teams_cache (sport);

alter table public.sports_teams_cache enable row level security;

create policy "Authenticated users can view cached teams"
  on public.sports_teams_cache for select
  to authenticated
  using (true);

-- No insert/update/delete policy for anon/authenticated: only
-- sync-sports-data, via the service role key, ever writes this table.

create table if not exists public.sports_fixtures_cache (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  external_fixture_id bigint not null,
  competition_id uuid not null references public.sports_competitions_cache (id) on delete cascade,
  home_team_external_id bigint not null,
  home_team_name text not null,
  home_team_logo_url text,
  away_team_external_id bigint not null,
  away_team_name text not null,
  away_team_logo_url text,
  kickoff_at timestamptz not null,
  -- Normalized to the app's own MatchStatus ('scheduled' | 'live' |
  -- 'finished') by the sync function — never the raw API-Sports status
  -- code, so lib/sports/service.ts never needs to know that vocabulary.
  status text not null default 'scheduled',
  synced_at timestamptz not null default now(),
  unique (sport, external_fixture_id)
);

create index if not exists sports_fixtures_cache_sport_kickoff_idx
  on public.sports_fixtures_cache (sport, kickoff_at);
create index if not exists sports_fixtures_cache_competition_idx
  on public.sports_fixtures_cache (competition_id);

alter table public.sports_fixtures_cache enable row level security;

create policy "Authenticated users can view cached fixtures"
  on public.sports_fixtures_cache for select
  to authenticated
  using (true);

-- No insert/update/delete policy for anon/authenticated: only
-- sync-sports-data, via the service role key, ever writes this table.
