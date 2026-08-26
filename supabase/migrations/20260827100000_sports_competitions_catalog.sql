-- sports_competitions_cache used to be keyed by (sport, search_term): one
-- row per curated "biggest competitions" entry, resolved to a real league
-- via a name search. The Sports module now caches API-Sports' FULL league
-- catalog per sport (every championship, cup, and tournament it has
-- indexed — see fetchAllLeagues() in _shared/api-sports.ts and
-- sync-sports-data/index.ts's syncCatalog), so the real identity of a row
-- is (sport, external_league_id), not a curated search term. This makes
-- search_term optional bookkeeping (still set when a row also happens to
-- be one of the small "featured" set eagerly synced for fixtures) rather
-- than the primary key.

alter table public.sports_competitions_cache
  drop constraint if exists sports_competitions_cache_sport_search_term_key;

alter table public.sports_competitions_cache
  alter column search_term drop not null;

-- One row per real external league, regardless of whether it's featured.
-- Partial (external_league_id is not null) so multiple not-yet-resolved
-- rows (a state that no longer really occurs post-catalog-sync, but kept
-- safe) don't collide on a shared null.
create unique index if not exists sports_competitions_cache_sport_league_key
  on public.sports_competitions_cache (sport, external_league_id)
  where external_league_id is not null;
