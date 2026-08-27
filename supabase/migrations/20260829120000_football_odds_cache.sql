-- Bookmaker odds for football matches, sourced from The Odds API as a
-- COMPLEMENT to API-Sports (never a replacement — sports_fixtures_cache,
-- sports_competitions_cache and sports_teams_cache stay exactly as they
-- are, populated by sync-sports-data as before). API-Sports has no odds
-- product on this account's plan; The Odds API is already integrated for
-- individual sports (see odds_api_*_cache) and also happens to cover a
-- couple dozen of the biggest football leagues — a small, genuinely
-- useful complement for the football fixtures we already show.
--
-- Keyed by external_fixture_id alone (not a foreign key to
-- sports_fixtures_cache.id): that table's own rows are deleted and
-- reinserted wholesale on every sync-sports-data run (see that function's
-- delete-then-insert per competition), so their internal uuids are not
-- stable across syncs. external_fixture_id (the API-Sports fixture id) is
-- the one identifier that IS stable, and is already how every other
-- lookup in lib/sports/service.ts addresses a football match — matching
-- that convention here means the odds-sync step never needs to know
-- sports_fixtures_cache's internal uuids at all, and losing/regaining a
-- fixture row on a resync doesn't orphan or cascade-delete its odds.
--
-- One row per fixture (a fixture with no The Odds API match simply has no
-- row here — never a row with invented numbers). bookmakers is a JSONB
-- array of { key, title, home, draw, away } (decimal odds), populated
-- from The Odds API's own bookmakers list for that event — never
-- synthesized or averaged.
create table if not exists public.football_odds_cache (
  id uuid primary key default gen_random_uuid(),
  external_fixture_id bigint not null unique,
  odds_api_event_id text not null,
  odds_api_sport_key text not null,
  commence_at timestamptz not null,
  bookmakers jsonb not null default '[]'::jsonb,
  synced_at timestamptz not null default now()
);

create index if not exists football_odds_cache_commence_at_idx
  on public.football_odds_cache (commence_at);

alter table public.football_odds_cache enable row level security;

create policy "Authenticated users can view cached football odds"
  on public.football_odds_cache for select
  to authenticated
  using (true);

-- No insert/update/delete policy for anon/authenticated: only
-- sync-individual-sports-data, via the service role key, ever writes here.
