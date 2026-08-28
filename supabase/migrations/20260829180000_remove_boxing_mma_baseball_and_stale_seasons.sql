-- Product decision (2026-08-28): Boxe, MMA and Baseball are removed from
-- the Sports module entirely — not deactivated. SportKey itself was
-- narrowed in src/lib/sports/types.ts, sync-individual-sports-data no
-- longer discovers boxing_boxing/mma_mixed_martial_arts, and
-- sync-sports-data's ACTIVE_SPORTS no longer includes baseball (see those
-- files). Application code alone won't make already-cached rows for these
-- three sports disappear — the next sync run never touches a row it no
-- longer asks for — so purge them here rather than waiting for a manual
-- cleanup that would never happen on its own.
delete from public.sports_fixtures_cache where sport = 'baseball';
delete from public.sports_teams_cache where sport = 'baseball';
delete from public.sports_competitions_cache where sport = 'baseball';

delete from public.odds_api_matches_cache
  where competition_id in (
    select id from public.odds_api_competitions_cache where sport in ('boxing', 'mma')
  );
delete from public.odds_api_competitions_cache where sport in ('boxing', 'mma');

-- Separately: a periodic/one-off competition (Euro, World Cup, Copa
-- América...) that's stale by more than two years now gets excluded from
-- future syncs by pickCurrentSeasonEntry (_shared/api-sports.ts) instead
-- of being cached with a defunct season — see that function's comment.
-- That only stops it from being written *going forward*; a row already
-- sitting in the cache from before this fix (the exact "Euro 2024 still
-- shows in 2026" bug report) stays until something removes it. Rather
-- than guess which specific rows those are without live data, purge any
-- competition whose cached season is unambiguously stale by the same
-- two-year rule the sync now applies — the next run recaches every
-- competition that's genuinely still current, and simply leaves out
-- whichever ones aren't.
--
-- season is a bare identifier (a 4-digit year for football, "YYYY-YYYY"
-- for most sibling sports), not a date range, so this can only compare
-- year numbers rather than real start/end dates the way
-- pickCurrentSeasonEntry does live from the API. Takes the *first*
-- 4-digit run in the string as that season's start year (correct for
-- both "2024" and "2024-2025") and drops the row if that year is more
-- than two full years behind the current one — deliberately conservative
-- (a two-years-behind season is stale under any reasonable calendar,
-- never a false positive against a competition whose season merely
-- hasn't been resynced yet this run).
delete from public.sports_competitions_cache
where season is not null
  and substring(season from '\d{4}') is not null
  and substring(season from '\d{4}')::int <= extract(year from now())::int - 2;
