import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  resolveLeague,
  fetchSchedule,
  fetchHeadToHead,
  ApiSportsUnavailableError,
  type ApiSportsKey,
} from "../_shared/api-sports.ts";
import {
  fetchOddsApiSports,
  fetchOddsApiEvents,
  OddsApiUnavailableError,
} from "../_shared/odds-api.ts";
import {
  analyzeSportMatch,
  type RecentMeeting,
  type SportMatchInput,
} from "../analyze-sport-match/anthropic-sport-match-analysis.ts";
import { AiServiceError } from "../analyze-market/anthropic-analysis.ts";

/**
 * The Sport universe's "Sélection du jour" — same automated-scan concept
 * as scan-markets (Polymarket), applied to Football/Basketball/Tennis:
 * find real near-term fixtures automatically (no user-typed team names,
 * unlike sport-match-search), run the same analyzeSportMatch used by the
 * on-demand flow on each pick, and persist the full result so every user
 * sees fresh, already-analyzed matches without spending their own daily
 * quota.
 *
 * Cost-conscious by construction, unlike scan-markets: scan-markets scans
 * up to 30 candidates through the AI just to *qualify* 9, because
 * Polymarket markets have no equivalent of "obviously a fixture worth
 * showing." Here there's no such large scan — the fixture list itself
 * (soonest kickoff, curated top competitions) is already a short,
 * reasonable pool, so every fixture that makes it into `picks` gets
 * exactly one Anthropic call, never more.
 */

const SELECTION_SIZE_PER_SPORT = 2;
/** Only fixtures kicking off within this window are worth surfacing as
 * "today's picks" — mirrors scan-markets' MAX_HOURS_TO_RESOLUTION, same
 * reasoning: a match three weeks out isn't "check back shortly" content. */
const MAX_HOURS_AHEAD = 48;

/** Curated, well-known top-tier competitions to scan for football and
 * basketball — resolved live via resolveLeague (name → real API-Sports
 * league id + current season) rather than hardcoded numeric ids, so this
 * never goes stale season-to-season. Deliberately a short, recognizable
 * list: the goal is "content worth sharing," not exhaustive coverage. */
const FOOTBALL_COMPETITIONS = [
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "UEFA Champions League",
];
const BASKETBALL_COMPETITIONS = ["NBA"];

type PickedFixture = {
  sport: "football" | "basketball" | "tennis";
  externalFixtureId: number | string;
  homeTeamExternalId: number | null;
  awayTeamExternalId: number | null;
  homeTeamName: string;
  awayTeamName: string;
  competitionName: string | null;
  kickoffAt: string;
};

function confidenceLabel(value: string): "Faible" | "Moyenne" | "Élevée" {
  if (value === "Faible" || value === "Moyenne" || value === "Élevée") return value;
  return "Moyenne";
}

async function collectApiSportsFixtures(
  sport: ApiSportsKey,
  competitions: string[],
  apiKey: string,
  now: number
): Promise<PickedFixture[]> {
  const fixtures: PickedFixture[] = [];

  await Promise.all(
    competitions.map(async (name) => {
      try {
        const league = await resolveLeague(sport, name, apiKey);
        if (!league || !league.season) return;

        const schedule = await fetchSchedule(sport, league.externalId, league.season, apiKey);
        for (const item of schedule) {
          if (item.status !== "scheduled") continue;
          const kickoffMs = Date.parse(item.kickoffAt);
          if (!Number.isFinite(kickoffMs)) continue;
          const hoursAhead = (kickoffMs - now) / (1000 * 60 * 60);
          if (hoursAhead <= 0 || hoursAhead > MAX_HOURS_AHEAD) continue;

          fixtures.push({
            sport,
            externalFixtureId: item.externalFixtureId,
            homeTeamExternalId: item.homeTeamExternalId,
            awayTeamExternalId: item.awayTeamExternalId,
            homeTeamName: item.homeTeamName,
            awayTeamName: item.awayTeamName,
            competitionName: item.competitionName ?? name,
            kickoffAt: item.kickoffAt,
          });
        }
      } catch (error) {
        console.error(
          `[scan-sport-matches] ${sport} schedule fetch failed for "${name}"`,
          error instanceof ApiSportsUnavailableError ? error.message : error
        );
      }
    })
  );

  // Dedupe (a fixture can theoretically surface via more than one
  // resolved competition name) and keep the soonest kickoffs first.
  const bySeen = new Map<string, PickedFixture>();
  for (const f of fixtures) {
    bySeen.set(`${f.sport}:${f.externalFixtureId}`, f);
  }
  return Array.from(bySeen.values()).sort(
    (a, b) => Date.parse(a.kickoffAt) - Date.parse(b.kickoffAt)
  );
}

async function collectTennisFixtures(apiKey: string, now: number): Promise<PickedFixture[]> {
  const sports = await fetchOddsApiSports(apiKey);
  const tennisSports = sports.filter(
    (s) => s.active && (s.group === "Tennis" || s.key.startsWith("tennis_"))
  );

  const fixtures: PickedFixture[] = [];

  await Promise.all(
    tennisSports.map(async (sportInfo) => {
      try {
        const events = await fetchOddsApiEvents(sportInfo.key, apiKey);
        for (const event of events) {
          const kickoffMs = Date.parse(event.commenceAt);
          if (!Number.isFinite(kickoffMs)) continue;
          const hoursAhead = (kickoffMs - now) / (1000 * 60 * 60);
          if (hoursAhead <= 0 || hoursAhead > MAX_HOURS_AHEAD) continue;

          fixtures.push({
            sport: "tennis",
            externalFixtureId: event.id,
            homeTeamExternalId: null,
            awayTeamExternalId: null,
            homeTeamName: event.homeParticipant,
            awayTeamName: event.awayParticipant,
            competitionName: sportInfo.title,
            kickoffAt: event.commenceAt,
          });
        }
      } catch (error) {
        console.error(`[scan-sport-matches] tennis events fetch failed for "${sportInfo.key}"`, error);
      }
    })
  );

  fixtures.sort((a, b) => Date.parse(a.kickoffAt) - Date.parse(b.kickoffAt));

  // Dedupe by participant pair — the same matchup can appear under more
  // than one tennis_* key in rare cases.
  const seen = new Set<string>();
  const deduped: PickedFixture[] = [];
  for (const f of fixtures) {
    const key = [f.homeTeamName, f.awayTeamName].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(f);
  }
  return deduped;
}

async function toRecentMeetings(
  sport: ApiSportsKey,
  homeId: number,
  awayId: number,
  apiKey: string
): Promise<RecentMeeting[]> {
  try {
    const h2h = await fetchHeadToHead(sport, homeId, awayId, apiKey);
    return h2h
      .filter((f) => f.status === "finished")
      .sort((a, b) => Date.parse(b.kickoffAt) - Date.parse(a.kickoffAt))
      .slice(0, 5)
      .map((f) => ({
        kickoffAt: f.kickoffAt,
        homeTeamName: f.homeTeamName,
        awayTeamName: f.awayTeamName,
        homeScore: f.homeScore,
        awayScore: f.awayScore,
        competitionName: f.competitionName,
      }));
  } catch (error) {
    // A missing head-to-head history is not fatal — analyzeSportMatch's
    // own prompt already handles "no history provided" honestly (see its
    // system prompt). Losing this context degrades the analysis slightly,
    // it never blocks the pick.
    console.error(`[scan-sport-matches] head-to-head fetch failed`, error);
    return [];
  }
}

type SelectedSportMatchRow = {
  sport: "football" | "basketball" | "tennis";
  home_team_name: string;
  away_team_name: string;
  competition: string | null;
  kickoff_at: string;
  predicted_winner: string;
  ai_probability: number;
  confidence: "Faible" | "Moyenne" | "Élevée";
  explanation: string;
  favorable_factors: string[];
  risks: string[];
  what_could_change: string;
  secondary_markets: unknown[];
  scanned_at: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Cron-only, same posture as scan-markets — never meant to be callable
  // by a regular user.
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

  const apiSportsKey = Deno.env.get("API_SPORTS_KEY");
  const oddsApiKey = Deno.env.get("ODDS_API_KEY");
  if (!apiSportsKey || !oddsApiKey) {
    console.error("[scan-sport-matches] API_SPORTS_KEY or ODDS_API_KEY is not configured");
    return new Response(
      JSON.stringify({ error: "sports_api_unavailable", message: "Clés API sportives manquantes." }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
  const now = Date.now();

  let footballFixtures: PickedFixture[] = [];
  let basketballFixtures: PickedFixture[] = [];
  let tennisFixtures: PickedFixture[] = [];
  try {
    [footballFixtures, basketballFixtures, tennisFixtures] = await Promise.all([
      collectApiSportsFixtures("football", FOOTBALL_COMPETITIONS, apiSportsKey, now),
      collectApiSportsFixtures("basketball", BASKETBALL_COMPETITIONS, apiSportsKey, now),
      collectTennisFixtures(oddsApiKey, now),
    ]);
  } catch (error) {
    console.error(
      "[scan-sport-matches] fixture discovery failed",
      error instanceof ApiSportsUnavailableError || error instanceof OddsApiUnavailableError
        ? error.message
        : error
    );
    return new Response(
      JSON.stringify({ error: "sports_api_unavailable", message: "Impossible de récupérer les rencontres à venir." }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const picks: PickedFixture[] = [
    ...footballFixtures.slice(0, SELECTION_SIZE_PER_SPORT),
    ...basketballFixtures.slice(0, SELECTION_SIZE_PER_SPORT),
    ...tennisFixtures.slice(0, SELECTION_SIZE_PER_SPORT),
  ];

  const scannedAt = new Date().toISOString();

  const rows: SelectedSportMatchRow[] = [];
  let failed = 0;

  for (const pick of picks) {
    const recentMeetings: RecentMeeting[] =
      pick.sport !== "tennis" && pick.homeTeamExternalId !== null && pick.awayTeamExternalId !== null
        ? await toRecentMeetings(pick.sport, pick.homeTeamExternalId, pick.awayTeamExternalId, apiSportsKey)
        : [];

    const input: SportMatchInput = {
      sport: pick.sport,
      homeTeamName: pick.homeTeamName,
      awayTeamName: pick.awayTeamName,
      competitionName: pick.competitionName,
      kickoffAt: pick.kickoffAt,
      recentMeetings,
    };

    try {
      const verdict = await analyzeSportMatch(input);
      rows.push({
        sport: pick.sport,
        home_team_name: pick.homeTeamName,
        away_team_name: pick.awayTeamName,
        competition: pick.competitionName,
        kickoff_at: pick.kickoffAt,
        predicted_winner: verdict.predictedWinner,
        ai_probability: Math.max(0, Math.min(100, Math.round(verdict.aiProbability))),
        confidence: confidenceLabel(verdict.confidence),
        explanation: verdict.explanation,
        favorable_factors: verdict.favorableFactors,
        risks: verdict.risks,
        what_could_change: verdict.whatCouldChange,
        secondary_markets: verdict.secondaryMarkets,
        scanned_at: scannedAt,
      });
    } catch (error) {
      failed++;
      console.error(
        `[scan-sport-matches] analysis failed for ${pick.homeTeamName} vs ${pick.awayTeamName}`,
        error instanceof AiServiceError ? error.message : error
      );
    }
  }

  // Full replace, same reasoning as scan-markets: this run's picks become
  // the entire table rather than a cumulative history.
  const { error: deleteError } = await supabase
    .from("selected_sport_matches")
    .delete()
    .not("id", "is", null);
  if (deleteError) {
    console.error("[scan-sport-matches] failed to clear previous selection", deleteError);
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("selected_sport_matches").insert(rows);
    if (insertError) {
      console.error("[scan-sport-matches] failed to insert new selection", insertError);
    }
  }

  const summary = {
    footballCandidates: footballFixtures.length,
    basketballCandidates: basketballFixtures.length,
    tennisCandidates: tennisFixtures.length,
    picked: picks.length,
    selected: rows.length,
    failed,
  };
  console.log("[scan-sport-matches] run complete", summary);

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
