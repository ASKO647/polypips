import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  searchTeams,
  fetchHeadToHead,
  ApiSportsUnavailableError,
  type ApiSportsKey,
  type ResolvedTeam,
  type ScheduleItem,
} from "../_shared/api-sports.ts";
import {
  fetchOddsApiSports,
  fetchOddsApiEvents,
  OddsApiUnavailableError,
} from "../_shared/odds-api.ts";

/**
 * The Sport universe's "Analyse IA", step 1: the user types two names — this
 * resolves them to real upcoming (and, for football/basketball, past)
 * fixtures and returns the next 3 for the user to pick from.
 *
 * Deliberately on-demand/live rather than reading from a pre-synced cache
 * (sports_competitions_cache/sports_fixtures_cache, built for the old
 * browse-everything Sport UI this replaces): a user-driven lookup of
 * exactly the two names asked about costs at most a handful of requests
 * against the daily quota, versus continuously syncing catalogs nobody may
 * ever look up.
 *
 * Football/basketball (API-Sports) and tennis (The Odds API) are two
 * genuinely different shapes of query, not just two different API keys —
 * see searchTennisMatchup's own comment for exactly why, and
 * _shared/odds-api.ts's header for the underlying data-source limits that
 * forces that difference (no player search, no real head-to-head history).
 */

const AUTH_HEADER = "Authorization";

type SearchSport = ApiSportsKey | "tennis";
type SearchRequest = { sport: SearchSport; team1: string; team2: string };

const MAX_UPCOMING_FIXTURES = 3;
const MAX_RECENT_MEETINGS = 5;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents so "Atlético" matches "Atletico"
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1);
}

/** Picks the best-scoring team from a search's results against the query
 * the user actually typed — API-Sports' own search endpoint already does
 * fuzzy matching server-side, but returns every partial match it finds
 * (e.g. searching "Madrid" returns both Real Madrid and Atlético Madrid),
 * so this re-ranks by real token overlap rather than trusting result
 * order blindly. Returns null (not a throw) when nothing scores above
 * zero — the caller reports "équipe introuvable" rather than guessing. */
function bestTeamMatch(query: string, candidates: ResolvedTeam[]): ResolvedTeam | null {
  if (candidates.length === 0) return null;
  const queryWords = tokenize(query);
  let best: { team: ResolvedTeam; score: number } | null = null;
  for (const team of candidates) {
    const nameWords = tokenize(team.name);
    const score = queryWords.filter((w) => nameWords.includes(w)).length;
    if (!best || score > best.score) best = { team, score };
  }
  return best && best.score > 0 ? best.team : candidates[0];
}

function toPublicFixture(item: ScheduleItem) {
  return {
    externalFixtureId: item.externalFixtureId,
    kickoffAt: item.kickoffAt,
    competitionName: item.competitionName,
    homeTeamName: item.homeTeamName,
    homeTeamLogoUrl: item.homeTeamLogoUrl,
    awayTeamName: item.awayTeamName,
    awayTeamLogoUrl: item.awayTeamLogoUrl,
    homeScore: item.homeScore,
    awayScore: item.awayScore,
  };
}

type SearchResult = {
  team1: { name: string; logoUrl: string | null };
  team2: { name: string; logoUrl: string | null };
  upcomingFixtures: ReturnType<typeof toPublicFixture>[];
  recentMeetings: ReturnType<typeof toPublicFixture>[];
};

class TeamNotFoundError extends Error {}

async function searchApiSportsMatchup(
  sport: ApiSportsKey,
  team1Query: string,
  team2Query: string,
  apiKey: string
): Promise<SearchResult> {
  const [team1Candidates, team2Candidates] = await Promise.all([
    searchTeams(sport, team1Query, apiKey),
    searchTeams(sport, team2Query, apiKey),
  ]);

  const team1 = bestTeamMatch(team1Query, team1Candidates);
  const team2 = bestTeamMatch(team2Query, team2Candidates);

  if (!team1 || !team2) {
    const missing =
      !team1 && !team2 ? `"${team1Query}" et "${team2Query}"` : !team1 ? `"${team1Query}"` : `"${team2Query}"`;
    throw new TeamNotFoundError(`Équipe introuvable : ${missing}. Vérifiez l'orthographe et réessayez.`);
  }

  const h2h = await fetchHeadToHead(sport, team1.externalId, team2.externalId, apiKey);
  const now = Date.now();

  const upcoming = h2h
    .filter((f) => f.status === "scheduled" && new Date(f.kickoffAt).getTime() > now)
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
    .slice(0, MAX_UPCOMING_FIXTURES);

  const recentMeetings = h2h
    .filter((f) => f.status === "finished")
    .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime())
    .slice(0, MAX_RECENT_MEETINGS);

  return {
    team1: { name: team1.name, logoUrl: team1.logoUrl },
    team2: { name: team2.name, logoUrl: team2.logoUrl },
    upcomingFixtures: upcoming.map(toPublicFixture),
    recentMeetings: recentMeetings.map(toPublicFixture),
  };
}

/**
 * Tennis, via The Odds API, is structurally a different query than
 * football/basketball's team search + head-to-head — there is no player-
 * search endpoint and no real match-history endpoint at all (see
 * _shared/odds-api.ts's header comment), so this can't reuse
 * searchApiSportsMatchup's shape:
 *
 * - No separate "resolve player name" step exists — instead this fans out
 *   across every currently active tennis_* sport_key's /events (both
 *   confirmed free, no quota cost) and matches the two typed names
 *   directly against each event's home/away participant strings.
 * - upcomingFixtures will usually hold 0 or 1 entry, essentially never 3 —
 *   a specific matchup only appears here once that tournament's draw is
 *   published (typically 1-3 days out), so "the next 3 meetings" the way
 *   two football clubs replay every season simply isn't a real thing two
 *   individual players have scheduled in advance.
 * - recentMeetings is always empty — there is no head-to-head history
 *   endpoint on this data source (the closest thing, /scores, only looks
 *   back 3 days and isn't a real archive). Never fabricated to look
 *   populated; the frontend shows this honestly rather than hiding it.
 */
async function searchTennisMatchup(
  player1Query: string,
  player2Query: string,
  apiKey: string
): Promise<SearchResult> {
  const sports = await fetchOddsApiSports(apiKey);
  const tennisSports = sports.filter(
    (s) => s.active && (s.group === "Tennis" || s.key.startsWith("tennis_"))
  );

  const player1Words = tokenize(player1Query);
  const player2Words = tokenize(player2Query);
  if (player1Words.length === 0 || player2Words.length === 0) {
    throw new TeamNotFoundError("Merci de renseigner un nom de joueur valide pour chaque camp.");
  }

  const matchedFixtures: Array<{ fixture: ScheduleItem; resolvedNames: [string, string] }> = [];

  await Promise.all(
    tennisSports.map(async (sportInfo) => {
      let events;
      try {
        events = await fetchOddsApiEvents(sportInfo.key, apiKey);
      } catch (error) {
        console.error(`[sport-match-search] tennis events lookup failed for "${sportInfo.key}"`, error);
        return;
      }
      for (const event of events) {
        const homeWords = tokenize(event.homeParticipant);
        const awayWords = tokenize(event.awayParticipant);
        // Every typed token must appear in the participant's own name —
        // stricter than "some" on purpose, since a single shared token
        // (a common surname, say) must never wrongly pair two different
        // players.
        const homeIsPlayer1 = player1Words.every((w) => homeWords.includes(w));
        const homeIsPlayer2 = player2Words.every((w) => homeWords.includes(w));
        const awayIsPlayer1 = player1Words.every((w) => awayWords.includes(w));
        const awayIsPlayer2 = player2Words.every((w) => awayWords.includes(w));

        if (!((homeIsPlayer1 && awayIsPlayer2) || (homeIsPlayer2 && awayIsPlayer1))) continue;

        const resolvedNames: [string, string] = homeIsPlayer1
          ? [event.homeParticipant, event.awayParticipant]
          : [event.awayParticipant, event.homeParticipant];

        matchedFixtures.push({
          resolvedNames,
          fixture: {
            externalFixtureId: event.id,
            kickoffAt: event.commenceAt,
            status: "scheduled",
            homeTeamExternalId: 0,
            homeTeamName: event.homeParticipant,
            homeTeamLogoUrl: null,
            awayTeamExternalId: 0,
            awayTeamName: event.awayParticipant,
            awayTeamLogoUrl: null,
            competitionName: sportInfo.title,
            homeScore: null,
            awayScore: null,
          },
        });
      }
    })
  );

  matchedFixtures.sort(
    (a, b) => new Date(a.fixture.kickoffAt).getTime() - new Date(b.fixture.kickoffAt).getTime()
  );

  const resolvedName1 = matchedFixtures[0]?.resolvedNames[0] ?? player1Query.trim();
  const resolvedName2 = matchedFixtures[0]?.resolvedNames[1] ?? player2Query.trim();

  return {
    team1: { name: resolvedName1, logoUrl: null },
    team2: { name: resolvedName2, logoUrl: null },
    upcomingFixtures: matchedFixtures.slice(0, MAX_UPCOMING_FIXTURES).map((m) => toPublicFixture(m.fixture)),
    // Never populated for tennis — see this function's own comment.
    recentMeetings: [],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "method_not_allowed", message: "Méthode non supportée." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const authHeader = req.headers.get(AUTH_HEADER);
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "unauthorized", message: "Authentification requise." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "unauthorized", message: "Session invalide ou expirée." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: SearchRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_input", message: "Corps de requête JSON invalide." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (body.sport !== "football" && body.sport !== "basketball" && body.sport !== "tennis") {
    return new Response(
      JSON.stringify({
        error: "invalid_input",
        message: "Sport non pris en charge — football, basketball ou tennis uniquement.",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  const team1Query = (body.team1 ?? "").trim();
  const team2Query = (body.team2 ?? "").trim();
  if (!team1Query || !team2Query) {
    return new Response(
      JSON.stringify({ error: "invalid_input", message: "Merci de renseigner les deux équipes." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const apiKeyEnvName = body.sport === "tennis" ? "ODDS_API_KEY" : "API_SPORTS_KEY";
  const apiKey = Deno.env.get(apiKeyEnvName);
  if (!apiKey) {
    console.error(`[sport-match-search] ${apiKeyEnvName} is not configured`);
    return new Response(
      JSON.stringify({
        error: "sports_api_unavailable",
        message: "La source de données sportives est momentanément indisponible.",
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const result =
      body.sport === "tennis"
        ? await searchTennisMatchup(team1Query, team2Query, apiKey)
        : await searchApiSportsMatchup(body.sport, team1Query, team2Query, apiKey);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof TeamNotFoundError) {
      return new Response(
        JSON.stringify({ error: "team_not_found", message: error.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.error(
      "[sport-match-search] échec de la recherche",
      error instanceof ApiSportsUnavailableError || error instanceof OddsApiUnavailableError
        ? error.message
        : error
    );
    return new Response(
      JSON.stringify({
        error: "sports_api_unavailable",
        message: "La source de données sportives est momentanément indisponible. Réessayez dans quelques instants.",
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
