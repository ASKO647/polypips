import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  OddsApiUnavailableError,
  fetchOddsApiEvents,
  fetchOddsApiOddsForSport,
  fetchOddsApiSports,
  type OddsApiOddsEvent,
  type OddsApiSportInfo,
} from "../_shared/odds-api.ts";

/**
 * The individual-athlete counterpart to sync-sports-data — covers tennis,
 * boxing and MMA via The Odds API, kept as its own function (and its own
 * odds_api_*_cache tables, see that migration's file comment) rather than
 * folded into sync-sports-data, because:
 *   - different provider, different auth scheme (query param vs header),
 *     different quota (100 req/hour, reset hourly, vs API-Sports' 100/day
 *     per sport host) — mixing the two inside one function would make
 *     neither's quota reasoning legible;
 *   - different id shapes (opaque strings here vs API-Sports' stable
 *     numeric ids) that the existing sports_*_cache columns are typed for;
 *   - tennis has no country/league structure to sync — it's discovered by
 *     sport_key prefix (tennis_atp_*, tennis_wta_*), not resolved by name
 *     search like sync-sports-data's featured competitions.
 *
 * Three things happen per run:
 * 1. Discover every currently-active competition this account's plan
 *    covers: every tennis_* sport_key (one per tournament — Roland-Garros,
 *    Wimbledon, etc., real and dynamic, never hardcoded) plus the two
 *    fixed boxing/MMA sport_keys, IF they're actually present and active
 *    in this account's own /v4/sports response — confirmed, never assumed.
 * 2. For each, fetch its near-term schedule (/events — no odds, see
 *    _shared/odds-api.ts) and cache it.
 * 3. Football-odds complement: reusing the same /v4/sports catalog from
 *    step 1 (no extra request), discover every active soccer_* sport_key
 *    and — throttled separately from the hourly cron itself, see the
 *    FOOTBALL_ODDS_* constants below — fetch bookmaker odds for each and
 *    rapproche them against API-Sports' own football fixtures
 *    (sports_fixtures_cache, populated by sync-sports-data, untouched by
 *    this function otherwise) by team name + kickoff date. API-Sports
 *    stays the only source for the fixtures themselves; this only adds
 *    odds on top of fixtures that already exist there. A fixture with no
 *    confident match simply gets no odds row — never an invented price.
 *
 * Every competition (and every football league in step 3) is processed
 * independently inside its own try/catch — one tournament's or one
 * league's fetch failing must never take down the rest of the run.
 */

type IndividualSport = "tennis" | "boxing" | "mma";

/** boxing_boxing and mma_mixed_martial_arts aren't split by promotion/
 * tournament on The Odds API — one fixed sport_key covers all boxing (or
 * all MMA) events, confirmed present and active on this account's plan
 * before being added here (2026-08-27). If either ever disappears from
 * /v4/sports, the discovery loop below simply stops finding it — no error,
 * no fixture wipe of what's already cached. */
const STATIC_SPORTS: { sportKey: string; sport: IndividualSport; circuit: string }[] = [
  { sportKey: "boxing_boxing", sport: "boxing", circuit: "Boxe" },
  { sportKey: "mma_mixed_martial_arts", sport: "mma", circuit: "MMA" },
];

function tennisCircuit(sportKey: string): string {
  if (sportKey.startsWith("tennis_atp_")) return "ATP";
  if (sportKey.startsWith("tennis_wta_")) return "WTA";
  if (sportKey.startsWith("tennis_itf_")) return "ITF";
  return "Tennis";
}

/** Only fixtures/events kicking off within this many days from now are
 * kept cached — same reasoning as sync-sports-data's FIXTURE_WINDOW_DAYS. */
const EVENT_WINDOW_DAYS = 21;
/** Hard cap per competition regardless of how many fall inside the window. */
const MAX_EVENTS_PER_COMPETITION = 30;
/** Safety cap on how many competitions get an /events call in one run —
 * tennis can have many tournaments active at once (multiple ATP/WTA/ITF
 * events run concurrently through most of the season). At 1 request/sport
 * (free) + 1 request/competition, this cap plus an hourly cron (matching
 * the quota's hourly reset) stays comfortably inside 100 requests/hour
 * even with boxing/MMA's 2 extra requests included. */
const MAX_COMPETITIONS_PER_RUN = 40;

/** Football-odds complement (see _shared/odds-api.ts's header comment) —
 * fused into this same hourly cron rather than a separate function/cron,
 * per product decision: one Edge Function keeps one place that reasons
 * about this account's Odds API quota, instead of two crons each guessing
 * how much budget the other has already spent this hour.
 *
 * Unlike the free tennis/boxing/MMA discovery above, /v4/sports/{key}/odds
 * costs 1 credit per sport_key per call (1 region × 1 market) regardless
 * of event count — real money-shaped cost, not just a request-count
 * concern. Two independent safeguards keep it cheap without needing to
 * know this account's actual plan size:
 *   1. Throttled to once every FOOTBALL_ODDS_THROTTLE_HOURS, checked
 *      against football_odds_cache's own newest synced_at — the cheap
 *      tennis/boxing/MMA discovery above still runs every hour as before,
 *      only the paid odds step is rate-limited.
 *   2. Self-stopping mid-run via the response's own x-requests-remaining
 *      header (see fetchOddsApiOddsForSport) — processing stops the
 *      moment remaining quota drops under FOOTBALL_ODDS_QUOTA_FLOOR,
 *      rather than assuming every league in MAX_FOOTBALL_LEAGUES_PER_RUN
 *      is affordable.
 * Region "eu" (Pinnacle, Betclic, Unibet, Betsson, 1xBet, …) and market
 * "h2h" (1X2/moneyline) — the cheapest possible combination (1 region ×
 * 1 market) and the one the product actually asked to show. */
const FOOTBALL_ODDS_THROTTLE_HOURS = 3;
const MAX_FOOTBALL_LEAGUES_PER_RUN = 20;
const FOOTBALL_ODDS_QUOTA_FLOOR = 20;
const FOOTBALL_ODDS_REGIONS = "eu";
const FOOTBALL_ODDS_MARKETS = "h2h";
/** Only ever compare against fixtures inside this window — matches
 * sync-sports-data's own near-term fixtures cache horizon, so there's no
 * point asking The Odds API about a league whose only cached fixtures are
 * further out than this. */
const FOOTBALL_FIXTURE_WINDOW_DAYS = 21;
/** Two fixtures with the same two team names on the same day but hours
 * apart practically never happens in football (unlike, say, a
 * doubleheader) — a generous window absorbs the two providers reporting
 * kickoff time slightly differently without risking a same-day
 * same-teams-different-fixture mismatch. */
const KICKOFF_MATCH_WINDOW_HOURS = 6;
/** Jaccard similarity (word-set overlap) floor for two team names to be
 * considered the same team after normalization — see teamNameSimilarity.
 * Both home AND away must clear this independently, plus the kickoff
 * window above, before a fixture/event pair is accepted — false negatives
 * (a real match The Odds API covers that we fail to link) are the safe
 * failure mode per product decision; a false positive (wrong odds shown
 * against a real fixture) is not, so this stays conservative. */
const TEAM_NAME_MATCH_THRESHOLD = 0.5;
/** Bookmakers are already ordered as The Odds API returns them for a
 * region; capping keeps football_odds_cache rows small and the eventual
 * "Comparateur de cotes" table from needing to scroll through a dozen
 * near-identical rows. */
const MAX_BOOKMAKERS_PER_FIXTURE = 6;

const COMBINING_DIACRITICS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeTeamName(name: string): string {
  return name
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_PATTERN, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(fc|cf|afc|sc|ac|ss|ud|cd|sd|cfc|club)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function teamNameSimilarity(a: string, b: string): number {
  const na = normalizeTeamName(a);
  const nb = normalizeTeamName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const wordsA = new Set(na.split(" ").filter(Boolean));
  const wordsB = new Set(nb.split(" ").filter(Boolean));
  const intersectionSize = [...wordsA].filter((w) => wordsB.has(w)).length;
  const unionSize = new Set([...wordsA, ...wordsB]).size;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

type FootballFixtureCandidate = {
  externalFixtureId: number;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: string;
};

/** Best-effort rapprochement by team names + kickoff date — the two
 * providers don't share an id scheme, so this is the only join key
 * available. Returns null (never a low-confidence guess) when nothing
 * clears both the team-name and kickoff-window thresholds — that fixture
 * simply gets no odds this run, exactly as the "no fabricated data" rule
 * requires everywhere else in this codebase. */
function findMatchingFixture(
  event: OddsApiOddsEvent,
  candidates: FootballFixtureCandidate[]
): FootballFixtureCandidate | null {
  const eventTime = new Date(event.commenceAt).getTime();
  const windowMs = KICKOFF_MATCH_WINDOW_HOURS * 60 * 60 * 1000;

  let best: { candidate: FootballFixtureCandidate; score: number } | null = null;
  for (const candidate of candidates) {
    const kickoffTime = new Date(candidate.kickoffAt).getTime();
    if (Math.abs(kickoffTime - eventTime) > windowMs) continue;

    const homeScore = teamNameSimilarity(event.homeTeam, candidate.homeTeamName);
    const awayScore = teamNameSimilarity(event.awayTeam, candidate.awayTeamName);
    if (homeScore < TEAM_NAME_MATCH_THRESHOLD || awayScore < TEAM_NAME_MATCH_THRESHOLD) continue;

    const score = homeScore + awayScore;
    if (!best || score > best.score) {
      best = { candidate, score };
    }
  }
  return best?.candidate ?? null;
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

  // Edge Function secret (Dashboard → Edge Functions → Secrets, or
  // `supabase secrets set ODDS_API_KEY=...`) — same store as
  // API_SPORTS_KEY, never the Vault.
  const apiKey = Deno.env.get("ODDS_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "missing_api_key",
        message:
          "ODDS_API_KEY est introuvable comme secret de Edge Function. Vérifie Project Settings → Edge Functions → Secrets (ou `supabase secrets set ODDS_API_KEY=...`).",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
  const windowEnd = new Date(Date.now() + EVENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  let catalog: OddsApiSportInfo[];
  try {
    catalog = await fetchOddsApiSports(apiKey);
  } catch (error) {
    const message =
      error instanceof OddsApiUnavailableError || error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ error: "odds_api_unavailable", message }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const discovered: { sportKey: string; sport: IndividualSport; circuit: string; title: string }[] = [];
  for (const entry of catalog) {
    if (!entry.active) continue;
    if (entry.key.startsWith("tennis_")) {
      discovered.push({ sportKey: entry.key, sport: "tennis", circuit: tennisCircuit(entry.key), title: entry.title });
    }
  }
  for (const staticEntry of STATIC_SPORTS) {
    const match = catalog.find((s) => s.key === staticEntry.sportKey && s.active);
    if (match) {
      discovered.push({ sportKey: staticEntry.sportKey, sport: staticEntry.sport, circuit: staticEntry.circuit, title: match.title });
    }
  }

  const toProcess = discovered.slice(0, MAX_COMPETITIONS_PER_RUN);

  const results: Array<{ sportKey: string; sport: string; eventsCached: number; error: string | null }> = [];

  for (const competition of toProcess) {
    let eventsCached = 0;
    let errorMessage: string | null = null;

    try {
      const { data: upserted, error: upsertError } = await supabase
        .from("odds_api_competitions_cache")
        .upsert(
          {
            sport: competition.sport,
            odds_api_sport_key: competition.sportKey,
            circuit: competition.circuit,
            title: competition.title,
            active: true,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "sport,odds_api_sport_key" }
        )
        .select("id")
        .single();
      if (upsertError || !upserted) {
        throw new Error(`écriture compétition échouée : ${upsertError?.message ?? "réponse vide"}`);
      }
      const competitionId = upserted.id as string;

      const events = await fetchOddsApiEvents(competition.sportKey, apiKey);
      const now = new Date();
      const upcoming = events
        .filter((event) => new Date(event.commenceAt) <= windowEnd)
        .sort((a, b) => a.commenceAt.localeCompare(b.commenceAt))
        .slice(0, MAX_EVENTS_PER_COMPETITION);

      const { error: deleteError } = await supabase
        .from("odds_api_matches_cache")
        .delete()
        .eq("competition_id", competitionId);
      if (deleteError) throw new Error(`purge matchs échouée : ${deleteError.message}`);

      if (upcoming.length > 0) {
        const { error: insertError } = await supabase.from("odds_api_matches_cache").insert(
          upcoming.map((event) => ({
            sport: competition.sport,
            competition_id: competitionId,
            odds_api_event_id: event.id,
            player_home: event.homeParticipant,
            player_away: event.awayParticipant,
            commence_at: event.commenceAt,
            status: new Date(event.commenceAt) < now ? "finished" : "scheduled",
            synced_at: new Date().toISOString(),
          }))
        );
        if (insertError) throw new Error(`insertion matchs échouée : ${insertError.message}`);
      }

      eventsCached = upcoming.length;
    } catch (error) {
      errorMessage =
        error instanceof OddsApiUnavailableError || error instanceof Error ? error.message : "Erreur inconnue";
      console.error(`[sync-individual-sports-data] échec pour ${competition.sportKey}`, errorMessage);
    }

    results.push({ sportKey: competition.sportKey, sport: competition.sport, eventsCached, error: errorMessage });
  }

  // ---- Football-odds complement (see the constants block above) ----
  const footballOdds = {
    ranThisRun: false,
    skippedReason: null as string | null,
    leaguesDiscovered: 0,
    leaguesProcessed: 0,
    eventsSeen: 0,
    matched: 0,
    unmatched: 0,
    quotaStoppedEarly: false,
    requestsRemainingAtEnd: null as number | null,
    errors: [] as { sportKey: string; message: string }[],
  };

  try {
    const { data: lastSync } = await supabase
      .from("football_odds_cache")
      .select("synced_at")
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const throttleMs = FOOTBALL_ODDS_THROTTLE_HOURS * 60 * 60 * 1000;
    const dueForSync =
      !lastSync?.synced_at || Date.now() - new Date(lastSync.synced_at as string).getTime() >= throttleMs;

    if (!dueForSync) {
      footballOdds.skippedReason = `dernière synchro de cotes foot il y a moins de ${FOOTBALL_ODDS_THROTTLE_HOURS}h`;
    } else {
      footballOdds.ranThisRun = true;

      const soccerKeys = catalog
        .filter((entry) => entry.active && entry.key.startsWith("soccer_"))
        .map((entry) => entry.key);
      footballOdds.leaguesDiscovered = soccerKeys.length;

      const footballWindowEnd = new Date(Date.now() + FOOTBALL_FIXTURE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const { data: fixtureRows, error: fixturesError } = await supabase
        .from("sports_fixtures_cache")
        .select("external_fixture_id, home_team_name, away_team_name, kickoff_at")
        .eq("sport", "football")
        .eq("status", "scheduled")
        .lte("kickoff_at", footballWindowEnd.toISOString());
      if (fixturesError) throw new Error(`lecture fixtures foot échouée : ${fixturesError.message}`);

      const candidates: FootballFixtureCandidate[] = (fixtureRows ?? []).map((row) => ({
        externalFixtureId: row.external_fixture_id as number,
        homeTeamName: row.home_team_name as string,
        awayTeamName: row.away_team_name as string,
        kickoffAt: row.kickoff_at as string,
      }));

      let quotaStopped = false;
      for (const sportKey of soccerKeys.slice(0, MAX_FOOTBALL_LEAGUES_PER_RUN)) {
        if (quotaStopped) break;
        try {
          const { events, requestsRemaining } = await fetchOddsApiOddsForSport(sportKey, apiKey, {
            regions: FOOTBALL_ODDS_REGIONS,
            markets: FOOTBALL_ODDS_MARKETS,
          });
          footballOdds.leaguesProcessed += 1;
          footballOdds.eventsSeen += events.length;
          footballOdds.requestsRemainingAtEnd = requestsRemaining;

          for (const event of events) {
            const fixture = findMatchingFixture(event, candidates);
            if (!fixture) {
              footballOdds.unmatched += 1;
              continue;
            }
            const { error: upsertError } = await supabase.from("football_odds_cache").upsert(
              {
                external_fixture_id: fixture.externalFixtureId,
                odds_api_event_id: event.id,
                odds_api_sport_key: sportKey,
                commence_at: event.commenceAt,
                bookmakers: event.bookmakers.slice(0, MAX_BOOKMAKERS_PER_FIXTURE),
                synced_at: new Date().toISOString(),
              },
              { onConflict: "external_fixture_id" }
            );
            if (upsertError) {
              footballOdds.errors.push({ sportKey, message: `upsert cotes échoué : ${upsertError.message}` });
              continue;
            }
            footballOdds.matched += 1;
          }

          if (requestsRemaining !== null && requestsRemaining < FOOTBALL_ODDS_QUOTA_FLOOR) {
            footballOdds.quotaStoppedEarly = true;
            quotaStopped = true;
          }
        } catch (error) {
          const message =
            error instanceof OddsApiUnavailableError || error instanceof Error ? error.message : "Erreur inconnue";
          footballOdds.errors.push({ sportKey, message });
          console.error(`[sync-individual-sports-data] cotes foot échouées pour ${sportKey}`, message);
        }
      }

      // Past fixtures don't need odds anymore — keeps the table from
      // growing unbounded across weeks of runs.
      await supabase.from("football_odds_cache").delete().lt("commence_at", new Date().toISOString());
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    footballOdds.errors.push({ sportKey: "*", message });
    console.error("[sync-individual-sports-data] étape cotes foot échouée", message);
  }

  const summary = {
    ranAt: new Date().toISOString(),
    discovered: discovered.length,
    processed: toProcess.length,
    failed: results.filter((r) => r.error !== null).length,
    totalEventsCached: results.reduce((sum, r) => sum + r.eventsCached, 0),
    details: results,
    footballOdds,
  };
  console.log("[sync-individual-sports-data] run complete", summary);

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
