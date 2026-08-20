/**
 * Service layer for the Sports module — every Sports page/component reads
 * through here, never through mock-data.ts directly. Every function is
 * already async, even though the mock implementation resolves
 * synchronously, so swapping the body for a real sports-data API call (and,
 * for match analysis, a real Anthropic call mirroring analyze-market's
 * analyzeMarket) later is a body-only change — no caller needs to be
 * touched.
 *
 * Fixture data (teams/competitions/matches) is mock-data.ts, clearly
 * isolated there. Every analytical field (probabilities, score,
 * opportunities, comparison stats, form, H2H, lineups, odds, model
 * accuracy...) is honestly empty here — emptyMatchAnalysis() below is the
 * one place that shape gets built, so wiring a real source later is a
 * matter of populating that bundle for real instead of leaving it null.
 */
import {
  getCountryFlag,
  MOCK_COMPETITIONS,
  MOCK_MATCHES,
  MOCK_TEAMS,
  POPULAR_COUNTRIES,
} from "./mock-data";
import type {
  Competition,
  Country,
  Match,
  MatchAnalysis,
  ModelAccuracyStats,
  OpportunityFilters,
  OpportunityWithMatch,
  SportKey,
  SportsOverviewStats,
  Team,
} from "./types";

export async function listCompetitions(sport?: SportKey): Promise<Competition[]> {
  return sport ? MOCK_COMPETITIONS.filter((c) => c.sport === sport) : MOCK_COMPETITIONS;
}

export async function listCountries(): Promise<Country[]> {
  return POPULAR_COUNTRIES;
}

/** Pure lookup, not a network-backed fetch — re-exported here (rather than
 * imported from mock-data.ts directly) purely to keep the module's "go
 * through service.ts" convention consistent for every component. */
export { getCountryFlag };

/** Competitions for a given sport, grouped by country — the shape the
 * "Football" drilldown screen's country/competition picker needs. */
export async function listCompetitionsByCountry(
  sport: SportKey
): Promise<{ country: string; competitions: Competition[] }[]> {
  const bySport = MOCK_COMPETITIONS.filter((c) => c.sport === sport);
  const countries = Array.from(new Set(bySport.map((c) => c.country)));
  return countries.map((country) => ({
    country,
    competitions: bySport.filter((c) => c.country === country),
  }));
}

export async function getCompetitionById(id: string): Promise<Competition | null> {
  return MOCK_COMPETITIONS.find((c) => c.id === id) ?? null;
}

export async function listTeams(): Promise<Team[]> {
  return MOCK_TEAMS;
}

export type MatchWindow = "today" | "tomorrow" | "week" | "all";

function matchesWindow(kickoffAt: string, window: MatchWindow | undefined): boolean {
  if (!window || window === "all") return true;
  const now = new Date();
  const kickoff = new Date(kickoffAt);
  const startOfDay = (offsetDays: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  if (window === "today") {
    return kickoff >= startOfDay(0) && kickoff < startOfDay(1);
  }
  if (window === "tomorrow") {
    return kickoff >= startOfDay(1) && kickoff < startOfDay(2);
  }
  // week
  return kickoff >= startOfDay(0) && kickoff < startOfDay(7);
}

export async function listUpcomingMatches(filters?: {
  sport?: SportKey;
  competitionId?: string;
  teamId?: string;
  window?: MatchWindow;
}): Promise<Match[]> {
  return MOCK_MATCHES.filter((m) => {
    if (filters?.sport && m.sport !== filters.sport) return false;
    if (filters?.competitionId && m.competition.id !== filters.competitionId) return false;
    if (
      filters?.teamId &&
      m.homeTeam.id !== filters.teamId &&
      m.awayTeam.id !== filters.teamId
    ) {
      return false;
    }
    if (!matchesWindow(m.kickoffAt, filters?.window)) return false;
    return true;
  }).sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
}

export async function getMatchById(id: string): Promise<Match | null> {
  return MOCK_MATCHES.find((m) => m.id === id) ?? null;
}

/** The one place the "no invented numbers" rule is enforced structurally:
 * every analytical field starts null/empty. A real implementation swaps
 * this function's body for actual model output — the type shape (and every
 * component reading it) doesn't change. */
function emptyMatchAnalysis(match: Match): MatchAnalysis {
  return {
    match,
    polypipsScore: null,
    probabilities: null,
    verdict: null,
    analysisFactors: [],
    opportunities: [],
    form: {
      home: { teamId: match.homeTeam.id, lastFive: [], goalsPerMatch: null },
      away: { teamId: match.awayTeam.id, lastFive: [], goalsPerMatch: null },
    },
    recentResults: { home: [], away: [] },
    comparison: [],
    h2h: [],
    aiSummary: null,
    info: {
      venue: "Non disponible",
      weather: null,
      referee: null,
      attendanceEstimate: null,
    },
    odds: [],
    popularMarkets: [],
    marketEdges: [],
    lineups: null,
    injuries: [],
  };
}

export async function getMatchAnalysis(id: string): Promise<MatchAnalysis | null> {
  const match = await getMatchById(id);
  if (!match) return null;
  return emptyMatchAnalysis(match);
}

/** Every match/opportunity/confidence detection surface across the module
 * (Overview's "Top opportunités", the global Opportunités page, a match's
 * "Opportunités détectées" panel) reads from here. Empty until a real
 * detection pipeline runs against real stats — never backfilled with
 * plausible-looking mock opportunities. */
export async function listOpportunities(
  filters?: OpportunityFilters
): Promise<OpportunityWithMatch[]> {
  void filters;
  return [];
}

/** No live sports-results feed exists yet to resolve predictions against
 * (unlike Polymarket/Gamma, which resolve-markets already uses for
 * Analyse IA's own accuracy tracking) — so this honestly reports "no data"
 * rather than fabricating a percentage. Once real predictions + real
 * results exist, this becomes a query over resolved sports predictions,
 * the same shape as lib/supabase/performance.ts's win-rate computation. */
export async function getModelAccuracy(): Promise<ModelAccuracyStats> {
  return { precisionPercent: null, sampleSize: 0, windowDays: 7 };
}

export async function getOverviewStats(): Promise<SportsOverviewStats> {
  const accuracy = await getModelAccuracy();
  return {
    matchesAnalyzedToday: 0,
    opportunitiesDetectedToday: 0,
    highConvictionCount: 0,
    modelAccuracy: accuracy,
  };
}
