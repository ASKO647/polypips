import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  ApiSportsUnavailableError,
  fetchAllLeagues,
  fetchSchedule,
  type ApiSportsKey,
  type ResolvedLeague,
} from "../_shared/api-sports.ts";

/**
 * Keeps sports_competitions_cache and sports_fixtures_cache (see the
 * migration's own comment) in sync with real API-Sports data, replacing
 * what lib/sports/mock-data.ts used to hand-author. Two phases per run:
 *
 * 1. syncCatalog — for every active sport, fetch API-Sports' FULL league
 *    catalog (fetchAllLeagues: one request, no search/country filter) and
 *    upsert every real competition it returns into
 *    sports_competitions_cache, keyed by (sport, external_league_id). This
 *    is what makes the Sports → Pays → Compétition browser show every real
 *    competition API-Sports has for that sport, not a curated subset —
 *    "toutes les compétitions disponibles" is satisfied by caching the
 *    catalog, never by hand-authoring names. Not quite verbatim: a league
 *    whose season data resolves to nothing currently viable (see
 *    pickCurrentSeasonEntry in _shared/api-sports.ts — a periodic
 *    tournament like the Euro between editions) is left out rather than
 *    cached with a stale season. Deduped by external_league_id and written
 *    with a per-batch-then-per-row fallback on write failure, so one bad or
 *    duplicate row can never silently truncate the rest of the catalog —
 *    see the loop below.
 * 2. syncFeaturedFixtures — a small curated FEATURED_COMPETITIONS list
 *    (the biggest leagues/cups per sport) gets its near-term schedule
 *    eagerly fetched and cached every run, matched against the catalog
 *    from phase 1 by name (not a hardcoded ID). Every other real
 *    competition still appears in the browser with its real name/logo/
 *    country, just without cached fixtures yet — its own page renders the
 *    honest "Aucun match disponible actuellement" empty state rather than
 *    disappearing or showing invented matches. Eagerly fetching schedules
 *    for every league in the full catalog isn't possible on a 100/day
 *    quota (football alone has hundreds of indexed competitions) — this
 *    two-tier split is what keeps the catalog genuinely complete while
 *    keeping fixture fetching inside quota.
 *
 * Every sport/competition is processed independently inside its own
 * try/catch — one sport's API being down, quota-exhausted, or shaped
 * differently than expected must never take down the rest of the run. See
 * _shared/api-sports.ts's file-level comment for why these shapes are
 * unverified against a live response.
 */

/** The sports this module covers — see src/lib/sports/nav.ts's
 * SPORT_CATEGORIES for the matching frontend list. Tennis isn't here:
 * API-Sports has no tennis product at all (no v1.tennis host), so there's
 * nothing to sync — the frontend shows it as "bientôt disponible" instead
 * of pretending to cover it. Baseball was removed (2026-08-28, product
 * decision) — not deactivated: see nav.ts's SPORT_CATEGORIES comment. */
const ACTIVE_SPORTS: ApiSportsKey[] = ["football", "basketball", "rugby"];

/** The competitions eagerly synced for fixtures every run — deliberately
 * curated (the biggest leagues/cups per sport), not "every league in the
 * catalog" (see the file comment above for why). Matched against the
 * catalog by name — country disambiguates a name that could otherwise
 * recur (e.g. a generic "Cup") across countries; omit it for a
 * competition whose name is already unambiguous (continental/
 * international ones). Add a row here (plus flip that sport to
 * active: true in src/lib/sports/nav.ts once real data is confirmed
 * flowing) to eagerly cover a new competition's fixtures — no other code
 * change needed, since the catalog itself already covers every sport's
 * full competition list independently of this array.
 *
 * Quota note: each sport has its own separate 100/day free quota (a
 * different API-Sports host per sport — see SPORT_API_CONFIG). The catalog
 * fetch costs exactly 1 request/sport/run regardless of run frequency.
 * Each featured row below costs at most 1 fixtures request/run. Football
 * is the dense one at 23 rows + 1 catalog request = 24/run: a 6-hour cron
 * (4 runs/day) costs ~96 requests/day against its 100/day quota — still
 * inside it, but with far less headroom than before this list grew (was
 * 17/run, ~68/day). Move football to an 8-hour cadence (3 runs/day, ~72/
 * day) before adding more rows here, rather than pushing the 6-hour
 * schedule any closer to the ceiling. Every other sport here has at most 5
 * rows, nowhere near its own quota at any of these cadences.
 *
 * Names below for competitions this file didn't already cover (Brazil,
 * the international football tournaments, WNBA, French basketball, the
 * international rugby tournaments, NPB/KBO) are the most likely real
 * API-Sports catalog names, not confirmed against a live response — this
 * sandbox has no network access to api-sports.io and no real API key (see
 * _shared/api-sports.ts's file comment). matchesFeatured()'s substring
 * matching tolerates a slightly different official name; a row that
 * doesn't match anything real just reports matched:false and caches no
 * fixtures — the catalog phase above it is unaffected either way, so a
 * wrong guess here degrades gracefully instead of breaking the sync. */
const FEATURED_COMPETITIONS: { sport: ApiSportsKey; name: string; country?: string }[] = [
  // France
  { sport: "football", name: "Ligue 1", country: "France" },
  { sport: "football", name: "Ligue 2", country: "France" },
  { sport: "football", name: "Coupe de France", country: "France" },
  // England
  { sport: "football", name: "Premier League", country: "England" },
  { sport: "football", name: "Championship", country: "England" },
  { sport: "football", name: "FA Cup", country: "England" },
  // Spain
  { sport: "football", name: "La Liga", country: "Spain" },
  { sport: "football", name: "Copa del Rey", country: "Spain" },
  // Italy
  { sport: "football", name: "Serie A", country: "Italy" },
  { sport: "football", name: "Serie B", country: "Italy" },
  { sport: "football", name: "Coppa Italia", country: "Italy" },
  // Germany
  { sport: "football", name: "Bundesliga", country: "Germany" },
  { sport: "football", name: "2. Bundesliga", country: "Germany" },
  { sport: "football", name: "DFB Pokal", country: "Germany" },
  // Brazil
  { sport: "football", name: "Serie A", country: "Brazil" },
  // Europe / international football
  { sport: "football", name: "UEFA Champions League" },
  { sport: "football", name: "UEFA Europa League" },
  { sport: "football", name: "UEFA Europa Conference League" },
  { sport: "football", name: "UEFA Nations League" },
  { sport: "football", name: "Euro Championship" },
  { sport: "football", name: "World Cup" },
  { sport: "football", name: "Copa America" },
  { sport: "football", name: "FIFA Club World Cup" },
  // Basketball
  { sport: "basketball", name: "NBA", country: "USA" },
  { sport: "basketball", name: "WNBA", country: "USA" },
  { sport: "basketball", name: "EuroLeague" },
  { sport: "basketball", name: "Betclic Élite", country: "France" },
  { sport: "basketball", name: "Pro A", country: "France" },
  { sport: "basketball", name: "Coupe de France", country: "France" },
  // Rugby
  { sport: "rugby", name: "Top 14", country: "France" },
  { sport: "rugby", name: "Premiership Rugby", country: "England" },
  { sport: "rugby", name: "Six Nations" },
  { sport: "rugby", name: "Rugby Championship" },
  { sport: "rugby", name: "World Cup" },
];

/** Only fixtures/games kicking off within this many days from now are kept
 * cached — a fixture further out isn't "upcoming" in any useful sense for
 * the Overview/Opportunités screens, and dropping it keeps the cache from
 * growing to a full season's worth of rows per competition. */
const FIXTURE_WINDOW_DAYS = 21;
/** Hard cap per competition regardless of how many fall inside the window
 * — protects the Overview/Opportunités screens from an unbounded list on
 * a competition with an unusually dense fixture list. */
const MAX_FIXTURES_PER_COMPETITION = 30;
/** Supabase upsert payload size stays comfortable in chunks this size even
 * for football's catalog (hundreds of leagues/cups in one /leagues
 * response). */
const CATALOG_UPSERT_BATCH_SIZE = 200;

function normalizeForMatch(value: string): string {
  return value.trim().toLowerCase();
}

/** True when a catalog row is the real competition a FEATURED_COMPETITIONS
 * entry refers to — name match first (exact, then substring either way to
 * tolerate a slightly different official name), country match second (only
 * when the featured entry specifies one, to disambiguate a name that
 * recurs across countries). */
function matchesFeatured(
  row: ResolvedLeague,
  featured: { name: string; country?: string }
): boolean {
  const rowName = normalizeForMatch(row.name);
  const wantName = normalizeForMatch(featured.name);
  const nameMatches = rowName === wantName || rowName.includes(wantName) || wantName.includes(rowName);
  if (!nameMatches) return false;
  if (!featured.country) return true;
  return normalizeForMatch(row.country ?? "") === normalizeForMatch(featured.country);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "Cette fonction ne peut être déclenchée qu'avec la clé service role.",
      }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Deno.env.get() reads Edge Function secrets (Dashboard → Edge Functions
  // → Secrets, or `supabase secrets set`) — a completely different store
  // from the Vault (vault.decrypted_secrets), which only SQL/pg_cron/pg_net
  // can read and which this runtime never touches. A key added to the
  // Vault will never show up here; it has to be an Edge Function secret.
  const apiKey = Deno.env.get("API_SPORTS_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "missing_api_key",
        message:
          "API_SPORTS_KEY est introuvable comme secret de Edge Function. Vérifie Project Settings → Edge Functions → Secrets (ou `supabase secrets set API_SPORTS_KEY=...`) — PAS le Vault (Project Settings → Vault), qui est un système séparé que cette fonction ne lit jamais.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
  const windowEnd = new Date(Date.now() + FIXTURE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // Phase 1 — full competitions catalog per sport, real and dynamic.
  const catalogsBySport = new Map<ApiSportsKey, ResolvedLeague[]>();
  const catalogResults: Array<{
    sport: string;
    leaguesFetched: number;
    leaguesSkippedNoCurrentSeason: number;
    leaguesCached: number;
    rowsFailed: number;
    error: string | null;
  }> = [];

  for (const sport of ACTIVE_SPORTS) {
    let leaguesFetched = 0;
    let leaguesSkippedNoCurrentSeason = 0;
    let leaguesCached = 0;
    let rowsFailed = 0;

    try {
      const fetched = await fetchAllLeagues(sport, apiKey);
      leaguesFetched = fetched.length;
      // Kept in full (including season-less ones below) for phase 2's
      // name matching — a season-less league just reports matched:false
      // there, same as it always has.
      catalogsBySport.set(sport, fetched);

      // Two defensive steps before writing, both aimed at the same class
      // of bug: one bad/duplicate row silently truncating everything
      // after it in a batch (see the per-batch/per-row fallback below for
      // the other half of this defense).
      //  1. Dedupe by externalId — the upsert's ON CONFLICT target is
      //     (sport, external_league_id); if API-Sports' /leagues response
      //     ever contains the same league id twice (seen on some
      //     sibling-sport hosts that return one row per league+season
      //     instead of nesting seasons), Postgres raises "ON CONFLICT DO
      //     UPDATE command cannot affect row a second time" for that
      //     whole batch — keep only the last occurrence.
      //  2. Drop leagues with no viable current/near-term season
      //     (pickCurrentSeasonEntry returned undefined — see that
      //     function's comment) — this is what makes a one-off tournament
      //     between editions (Euro, World Cup...) simply not show up
      //     rather than displaying its last, now-stale edition. A league
      //     with real season data just never published (never had any
      //     dated entries at all) is unaffected and still gets cached, as
      //     before.
      const dedupedById = new Map<number, ResolvedLeague>();
      for (const league of fetched) dedupedById.set(league.externalId, league);
      const withCurrentSeason: ResolvedLeague[] = [];
      for (const league of dedupedById.values()) {
        if (league.season === null) {
          leaguesSkippedNoCurrentSeason += 1;
          continue;
        }
        withCurrentSeason.push(league);
      }

      for (let i = 0; i < withCurrentSeason.length; i += CATALOG_UPSERT_BATCH_SIZE) {
        const batch = withCurrentSeason.slice(i, i + CATALOG_UPSERT_BATCH_SIZE);
        const rows = batch.map((league) => ({
          sport,
          external_league_id: league.externalId,
          name: league.name,
          country: league.country,
          logo_url: league.logoUrl,
          flag_url: league.flagUrl,
          season: league.season,
          resolved_at: new Date().toISOString(),
          synced_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("sports_competitions_cache")
          .upsert(rows, { onConflict: "sport,external_league_id" });

        if (!error) {
          leaguesCached += batch.length;
          continue;
        }

        // A whole-batch failure must never take the rest of the catalog
        // down with it (this was the actual bug behind real competitions
        // — Italy's Serie A, UEFA Europa Conference League — silently
        // never making it into the cache while others from the same
        // catalog did): fall back to one upsert per row so only the
        // genuinely bad row(s) get dropped, logged individually, while
        // every good row in the batch still gets written.
        console.error(
          `[sync-sports-data] échec du batch catalogue pour ${sport} (${batch.length} lignes) — reprise ligne par ligne`,
          error.message
        );
        for (const row of rows) {
          const { error: rowError } = await supabase
            .from("sports_competitions_cache")
            .upsert(row, { onConflict: "sport,external_league_id" });
          if (rowError) {
            rowsFailed += 1;
            console.error(
              `[sync-sports-data] ligne catalogue rejetée pour ${sport} / external_league_id=${row.external_league_id} ("${row.name}")`,
              rowError.message
            );
          } else {
            leaguesCached += 1;
          }
        }
      }

      catalogResults.push({ sport, leaguesFetched, leaguesSkippedNoCurrentSeason, leaguesCached, rowsFailed, error: null });
    } catch (error) {
      const message =
        error instanceof ApiSportsUnavailableError || error instanceof Error ? error.message : "Erreur inconnue";
      console.error(`[sync-sports-data] échec catalogue pour ${sport}`, message);
      catalogResults.push({
        sport,
        leaguesFetched,
        leaguesSkippedNoCurrentSeason,
        leaguesCached,
        rowsFailed,
        error: message,
      });
    }
  }

  // Phase 2 — eager fixtures for the curated "featured" subset only (see
  // the file comment for why the full catalog can't all get this).
  const fixtureResults: Array<{
    sport: string;
    name: string;
    matched: boolean;
    fixturesCached: number;
    error: string | null;
  }> = [];

  for (const featured of FEATURED_COMPETITIONS) {
    let matched = false;
    let fixturesCached = 0;
    let errorMessage: string | null = null;

    try {
      const catalog = catalogsBySport.get(featured.sport) ?? [];
      const match = catalog.find((row) => matchesFeatured(row, featured));

      if (!match || !match.season) {
        fixtureResults.push({ sport: featured.sport, name: featured.name, matched: false, fixturesCached: 0, error: null });
        continue;
      }
      matched = true;

      const { data: competitionRow, error: competitionError } = await supabase
        .from("sports_competitions_cache")
        .select("id")
        .eq("sport", featured.sport)
        .eq("external_league_id", match.externalId)
        .maybeSingle();
      if (competitionError || !competitionRow) {
        throw new Error("compétition introuvable dans le cache après synchronisation du catalogue");
      }
      const competitionId = competitionRow.id as string;

      // Bookkeeping only (which curated name this row also satisfies) —
      // the row's real identity is (sport, external_league_id), not this.
      await supabase
        .from("sports_competitions_cache")
        .update({ search_term: featured.name })
        .eq("id", competitionId);

      const schedule = await fetchSchedule(featured.sport, match.externalId, match.season, apiKey);
      const upcoming = schedule
        .filter((item) => new Date(item.kickoffAt) <= windowEnd)
        .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))
        .slice(0, MAX_FIXTURES_PER_COMPETITION);

      const { error: deleteError } = await supabase
        .from("sports_fixtures_cache")
        .delete()
        .eq("competition_id", competitionId);
      if (deleteError) throw new Error(`purge fixtures échouée : ${deleteError.message}`);

      if (upcoming.length > 0) {
        const { error: insertError } = await supabase.from("sports_fixtures_cache").insert(
          upcoming.map((item) => ({
            sport: featured.sport,
            external_fixture_id: item.externalFixtureId,
            competition_id: competitionId,
            home_team_external_id: item.homeTeamExternalId,
            home_team_name: item.homeTeamName,
            home_team_logo_url: item.homeTeamLogoUrl,
            away_team_external_id: item.awayTeamExternalId,
            away_team_name: item.awayTeamName,
            away_team_logo_url: item.awayTeamLogoUrl,
            kickoff_at: item.kickoffAt,
            status: item.status,
            synced_at: new Date().toISOString(),
          }))
        );
        if (insertError) throw new Error(`insertion fixtures échouée : ${insertError.message}`);

        // sports_teams_cache is upserted (never purged) so a followed team
        // stays listable on "Mes équipes" even once its fixture rotates out
        // of the near-term window above — see the migration's comment on
        // that table for why country here is only a heuristic.
        const teamsSeen = new Map<number, { name: string; logoUrl: string | null }>();
        for (const item of upcoming) {
          teamsSeen.set(item.homeTeamExternalId, { name: item.homeTeamName, logoUrl: item.homeTeamLogoUrl });
          teamsSeen.set(item.awayTeamExternalId, { name: item.awayTeamName, logoUrl: item.awayTeamLogoUrl });
        }
        const { error: teamsError } = await supabase.from("sports_teams_cache").upsert(
          Array.from(teamsSeen.entries()).map(([externalTeamId, team]) => ({
            sport: featured.sport,
            external_team_id: externalTeamId,
            name: team.name,
            country: match.country ?? null,
            logo_url: team.logoUrl,
            synced_at: new Date().toISOString(),
          })),
          { onConflict: "sport,external_team_id" }
        );
        if (teamsError) {
          console.error(`[sync-sports-data] mise à jour équipes échouée pour ${featured.sport}/"${featured.name}"`, teamsError.message);
        }
      }

      fixturesCached = upcoming.length;
    } catch (error) {
      errorMessage =
        error instanceof ApiSportsUnavailableError || error instanceof Error ? error.message : "Erreur inconnue";
      console.error(`[sync-sports-data] échec fixtures pour ${featured.sport} / "${featured.name}"`, errorMessage);
    }

    fixtureResults.push({ sport: featured.sport, name: featured.name, matched, fixturesCached, error: errorMessage });
  }

  const summary = {
    ranAt: new Date().toISOString(),
    catalog: {
      sports: catalogResults.length,
      totalLeaguesFetched: catalogResults.reduce((sum, r) => sum + r.leaguesFetched, 0),
      totalLeaguesSkippedNoCurrentSeason: catalogResults.reduce((sum, r) => sum + r.leaguesSkippedNoCurrentSeason, 0),
      totalLeaguesCached: catalogResults.reduce((sum, r) => sum + r.leaguesCached, 0),
      totalRowsFailed: catalogResults.reduce((sum, r) => sum + r.rowsFailed, 0),
      failed: catalogResults.filter((r) => r.error !== null).length,
      details: catalogResults,
    },
    featuredFixtures: {
      competitions: fixtureResults.length,
      matched: fixtureResults.filter((r) => r.matched).length,
      failed: fixtureResults.filter((r) => r.error !== null).length,
      totalFixturesCached: fixtureResults.reduce((sum, r) => sum + r.fixturesCached, 0),
      details: fixtureResults,
    },
  };
  console.log("[sync-sports-data] run complete", summary);

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
