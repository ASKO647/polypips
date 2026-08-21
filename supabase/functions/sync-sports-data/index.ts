import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  ApiSportsUnavailableError,
  fetchSchedule,
  resolveLeague,
  type ApiSportsKey,
} from "../_shared/api-sports.ts";

/**
 * Keeps sports_competitions_cache and sports_fixtures_cache (see the
 * migration's own comment) in sync with real API-Sports data, replacing
 * what lib/sports/mock-data.ts used to hand-author. Two phases per run:
 *
 * 1. Resolve each curated competition's real league ID/name/logo/season
 *    via a name search — but only if unresolved or stale (see
 *    RESOLVE_STALE_DAYS), so a healthy competition doesn't cost a request
 *    on every run. League metadata barely changes.
 * 2. For every competition with a resolved league ID, fetch its full
 *    schedule and replace that competition's cached fixtures with the
 *    near-term window (see FIXTURE_WINDOW_DAYS/MAX_FIXTURES_PER_COMPETITION)
 *    — a clear-then-reinsert per competition, safe because match_id in
 *    sports_match_follows is the app-level `${sport}-${externalFixtureId}`
 *    string, not a foreign key to this table's own row id.
 *
 * Every competition is processed independently inside its own try/catch —
 * one sport's API being down, quota-exhausted, or shaped differently than
 * expected must never take down the rest of the run. See
 * _shared/api-sports.ts's file-level comment for why these shapes are
 * unverified against a live response.
 */

/** The competitions this module covers today — deliberately curated (not
 * "every league API-Sports has"), but per-country coverage for football
 * now goes beyond just the top flight to match how the Compétitions
 * browser (Sport → Pays → Compétition) actually reads: a country groups
 * ALL of its real competitions, not just its headline league, so France
 * needs Ligue 1 *and* Ligue 2 *and* Coupe de France to render the way the
 * feature is meant to. The other sports stay at one entry per country —
 * unlike football, none of NBA/NHL/MLB/NFL/Top 14 has a real second-tier
 * league or domestic cup on API-Sports to add, so one competition per
 * country is already complete there, not an arbitrary scope cut. Add a
 * row here (plus flip that sport to active: true in src/lib/sports/nav.ts
 * once real data is confirmed flowing) to extend coverage — no other code
 * change needed.
 *
 * Quota note: each sport has its own separate 100/day free quota (a
 * different API-Sports host per sport — see SPORT_API_CONFIG), and each
 * row costs at most 1 request/run once resolved (search only re-runs
 * every RESOLVE_STALE_DAYS). Football is the dense one at 16 rows: a
 * 6-hour cron (4 runs/day) costs ~64 requests/day against its 100/day
 * quota — comfortable headroom. Every other sport here has at most 2
 * rows, nowhere near its own quota at that same cadence. Don't drop below
 * 6h without trimming football's list first. */
const SPORT_COMPETITIONS: { sport: ApiSportsKey; searchTerm: string }[] = [
  // France
  { sport: "football", searchTerm: "Ligue 1" },
  { sport: "football", searchTerm: "Ligue 2" },
  { sport: "football", searchTerm: "Coupe de France" },
  // England
  { sport: "football", searchTerm: "Premier League" },
  { sport: "football", searchTerm: "Championship" },
  { sport: "football", searchTerm: "FA Cup" },
  // Spain
  { sport: "football", searchTerm: "La Liga" },
  { sport: "football", searchTerm: "Copa del Rey" },
  // Italy
  { sport: "football", searchTerm: "Serie A" },
  { sport: "football", searchTerm: "Serie B" },
  { sport: "football", searchTerm: "Coppa Italia" },
  // Germany
  { sport: "football", searchTerm: "Bundesliga" },
  { sport: "football", searchTerm: "2. Bundesliga" },
  { sport: "football", searchTerm: "DFB Pokal" },
  // Europe
  { sport: "football", searchTerm: "UEFA Champions League" },
  { sport: "football", searchTerm: "UEFA Europa League" },
  { sport: "basketball", searchTerm: "NBA" },
  { sport: "basketball", searchTerm: "EuroLeague" },
  { sport: "hockey", searchTerm: "NHL" },
  { sport: "rugby", searchTerm: "Top 14" },
  { sport: "rugby", searchTerm: "Premiership Rugby" },
  { sport: "baseball", searchTerm: "MLB" },
  { sport: "nfl", searchTerm: "NFL" },
];

/** A resolved competition's league ID/name/logo/season is only re-fetched
 * after this many days — that metadata barely changes, so re-searching it
 * every run would be a pure quota cost for no benefit. */
const RESOLVE_STALE_DAYS = 7;
/** Only fixtures/games kicking off within this many days from now are kept
 * cached — a fixture further out isn't "upcoming" in any useful sense for
 * the Overview/Opportunités screens, and dropping it keeps the cache from
 * growing to a full season's worth of rows per competition. */
const FIXTURE_WINDOW_DAYS = 21;
/** Hard cap per competition regardless of how many fall inside the window
 * — protects the Overview/Opportunités screens from an unbounded list on
 * a competition with an unusually dense fixture list. */
const MAX_FIXTURES_PER_COMPETITION = 30;

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

  const staleCutoff = new Date(Date.now() - RESOLVE_STALE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(Date.now() + FIXTURE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const results: Array<{
    sport: string;
    searchTerm: string;
    resolved: boolean;
    resolveSkipped: boolean;
    fixturesCached: number;
    error: string | null;
  }> = [];

  for (const { sport, searchTerm } of SPORT_COMPETITIONS) {
    let resolved = false;
    let resolveSkipped = false;
    let fixturesCached = 0;
    let errorMessage: string | null = null;

    try {
      const { data: existing, error: fetchError } = await supabase
        .from("sports_competitions_cache")
        .select("id, external_league_id, season, resolved_at")
        .eq("sport", sport)
        .eq("search_term", searchTerm)
        .maybeSingle();

      if (fetchError) throw new Error(`lecture cache compétition échouée : ${fetchError.message}`);

      const needsResolve =
        !existing?.external_league_id ||
        !existing?.resolved_at ||
        (existing.resolved_at as string) < staleCutoff;

      let competitionId = existing?.id as string | undefined;
      let externalLeagueId = existing?.external_league_id as number | null | undefined;
      let season = existing?.season as string | null | undefined;

      if (needsResolve) {
        const league = await resolveLeague(sport, searchTerm, apiKey);
        if (league) {
          const { data: upserted, error: upsertError } = await supabase
            .from("sports_competitions_cache")
            .upsert(
              {
                sport,
                search_term: searchTerm,
                external_league_id: league.externalId,
                name: league.name,
                country: league.country,
                logo_url: league.logoUrl,
                flag_url: league.flagUrl,
                season: league.season,
                resolved_at: new Date().toISOString(),
                synced_at: new Date().toISOString(),
              },
              { onConflict: "sport,search_term" }
            )
            .select("id, external_league_id, season")
            .single();

          if (upsertError) throw new Error(`écriture cache compétition échouée : ${upsertError.message}`);

          competitionId = upserted.id as string;
          externalLeagueId = upserted.external_league_id as number;
          season = upserted.season as string | null;
          resolved = true;
        } else {
          console.error(
            `[sync-sports-data] aucune compétition trouvée pour ${sport} / "${searchTerm}" — nouvelle tentative au prochain run`
          );
        }
      } else {
        resolveSkipped = true;
      }

      if (competitionId && externalLeagueId && season) {
        const schedule = await fetchSchedule(sport, externalLeagueId, season, apiKey);
        const upcoming = schedule
          .filter((item) => {
            const kickoff = new Date(item.kickoffAt);
            return kickoff <= windowEnd;
          })
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
              sport,
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

          // sports_teams_cache is upserted (never purged) so a followed
          // team stays listable on "Mes équipes" even once its fixture
          // rotates out of the near-term window above — see the
          // migration's comment on that table for why country here is
          // only a heuristic.
          const competitionCountry = (
            await supabase
              .from("sports_competitions_cache")
              .select("country")
              .eq("id", competitionId)
              .maybeSingle()
          ).data?.country as string | null | undefined;

          const teamsSeen = new Map<number, { name: string; logoUrl: string | null }>();
          for (const item of upcoming) {
            teamsSeen.set(item.homeTeamExternalId, { name: item.homeTeamName, logoUrl: item.homeTeamLogoUrl });
            teamsSeen.set(item.awayTeamExternalId, { name: item.awayTeamName, logoUrl: item.awayTeamLogoUrl });
          }
          const { error: teamsError } = await supabase.from("sports_teams_cache").upsert(
            Array.from(teamsSeen.entries()).map(([externalTeamId, team]) => ({
              sport,
              external_team_id: externalTeamId,
              name: team.name,
              country: competitionCountry ?? null,
              logo_url: team.logoUrl,
              synced_at: new Date().toISOString(),
            })),
            { onConflict: "sport,external_team_id" }
          );
          if (teamsError) {
            console.error(`[sync-sports-data] mise à jour équipes échouée pour ${sport}/"${searchTerm}"`, teamsError.message);
          }
        }

        fixturesCached = upcoming.length;
      }
    } catch (error) {
      errorMessage =
        error instanceof ApiSportsUnavailableError || error instanceof Error
          ? error.message
          : "Erreur inconnue";
      console.error(`[sync-sports-data] échec pour ${sport} / "${searchTerm}"`, errorMessage);
    }

    results.push({ sport, searchTerm, resolved, resolveSkipped, fixturesCached, error: errorMessage });
  }

  const summary = {
    ranAt: new Date().toISOString(),
    competitions: results.length,
    resolvedThisRun: results.filter((r) => r.resolved).length,
    failed: results.filter((r) => r.error !== null).length,
    totalFixturesCached: results.reduce((sum, r) => sum + r.fixturesCached, 0),
    details: results,
  };
  console.log("[sync-sports-data] run complete", summary);

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
