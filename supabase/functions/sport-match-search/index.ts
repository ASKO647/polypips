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

/**
 * The Sport universe's "Analyse IA", step 1: the user types two team names
 * — this resolves each to a real API-Sports team record, fetches every
 * fixture ever recorded between the two, and returns the next 3 upcoming
 * ones (for the user to pick from) plus the 5 most recent finished
 * meetings (real context, handed straight to analyze-sport-match once a
 * fixture is picked — no second API call needed for that).
 *
 * Deliberately on-demand/live rather than reading from a pre-synced cache
 * (sports_competitions_cache/sports_fixtures_cache, built for the old
 * browse-everything Sport UI this replaces): a user-driven lookup of
 * exactly the two teams asked about costs at most 3 API-Sports requests
 * (search × 2 + one h2h call) against the daily quota, versus continuously
 * syncing catalogs nobody may ever look up.
 */

const AUTH_HEADER = "Authorization";

type SearchRequest = { sport: ApiSportsKey; team1: string; team2: string };

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

  if (body.sport !== "football" && body.sport !== "basketball") {
    return new Response(
      JSON.stringify({
        error: "invalid_input",
        message: "Sport non pris en charge pour l'instant — football et basketball uniquement.",
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

  const apiKey = Deno.env.get("API_SPORTS_KEY");
  if (!apiKey) {
    console.error("[sport-match-search] API_SPORTS_KEY is not configured");
    return new Response(
      JSON.stringify({
        error: "sports_api_unavailable",
        message: "La source de données sportives est momentanément indisponible.",
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const [team1Candidates, team2Candidates] = await Promise.all([
      searchTeams(body.sport, team1Query, apiKey),
      searchTeams(body.sport, team2Query, apiKey),
    ]);

    const team1 = bestTeamMatch(team1Query, team1Candidates);
    const team2 = bestTeamMatch(team2Query, team2Candidates);

    if (!team1 || !team2) {
      const missing = !team1 && !team2 ? `"${team1Query}" et "${team2Query}"` : !team1 ? `"${team1Query}"` : `"${team2Query}"`;
      return new Response(
        JSON.stringify({
          error: "team_not_found",
          message: `Équipe introuvable : ${missing}. Vérifiez l'orthographe et réessayez.`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const h2h = await fetchHeadToHead(body.sport, team1.externalId, team2.externalId, apiKey);
    const now = Date.now();

    const upcoming = h2h
      .filter((f) => f.status === "scheduled" && new Date(f.kickoffAt).getTime() > now)
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, MAX_UPCOMING_FIXTURES);

    const recentMeetings = h2h
      .filter((f) => f.status === "finished")
      .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime())
      .slice(0, MAX_RECENT_MEETINGS);

    return new Response(
      JSON.stringify({
        team1: { name: team1.name, logoUrl: team1.logoUrl },
        team2: { name: team2.name, logoUrl: team2.logoUrl },
        upcomingFixtures: upcoming.map(toPublicFixture),
        recentMeetings: recentMeetings.map(toPublicFixture),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(
      "[sport-match-search] échec de la recherche",
      error instanceof ApiSportsUnavailableError ? error.message : error
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
