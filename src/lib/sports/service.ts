/**
 * Service layer for the Sports module — every Sports page/component reads
 * through here, never through Supabase directly. Backed by real data:
 * sports_competitions_cache / sports_teams_cache / sports_fixtures_cache,
 * populated by the sync-sports-data Edge Function from API-Sports (see
 * that function's own file-level comment, and _shared/api-sports.ts, for
 * the data source itself and its caveats).
 *
 * IDs handed out to callers (Competition.id, Match.id, Team.id) are
 * constructed strings — `${sport}-comp-${externalLeagueId}`,
 * `${sport}-match-${externalFixtureId}`, `${sport}-team-${externalTeamId}`
 * — never a cache table's own row uuid. sports_fixtures_cache rows are
 * deleted and reinserted wholesale on every sync run (fresh uuids each
 * time), so a follow row (sports_match_follows.match_id /
 * sports_team_follows.team_id, both plain text) that stored a row uuid
 * would silently point at nothing after the next sync. The external
 * API-Sports numeric ID is what's actually stable across syncs, so that's
 * what gets persisted.
 *
 * Every analytical field (probabilities, score, opportunities, comparison
 * stats, form, H2H, lineups, odds, model accuracy...) is still honestly
 * empty here — emptyMatchAnalysis() below is unchanged. Only the
 * fixture/team/competition scheduling data below it is now real.
 */
import { createClient } from "@/lib/supabase/server";
import { getCountryCode } from "./country-codes";
import type {
  Competition,
  Country,
  Match,
  MatchAnalysis,
  MatchStatus,
  ModelAccuracyStats,
  OpportunityFilters,
  OpportunityWithMatch,
  SportKey,
  SportsOverviewStats,
  Team,
} from "./types";

function parseEntityId(
  id: string,
  kind: "comp" | "match" | "team"
): { sport: string; externalId: number } | null {
  const match = id.match(new RegExp(`^([a-z-]+)-${kind}-(\\d+)$`));
  if (!match) return null;
  return { sport: match[1], externalId: Number(match[2]) };
}

/** Re-exported so every existing `import { getCountryCode } from
 * "@/lib/sports/service"` (Server Component callers) keeps working
 * unchanged — see country-codes.ts for the actual implementation, split
 * out because Client Component callers can't import this file (it pulls
 * in lib/supabase/server.ts). */
export { getCountryCode } from "./country-codes";

type CompetitionRow = {
  sport: string;
  search_term: string | null;
  external_league_id: number | null;
  name: string | null;
  country: string | null;
  logo_url: string | null;
  flag_url: string | null;
};

function toCompetition(row: CompetitionRow): Competition {
  return {
    id: `${row.sport}-comp-${row.external_league_id}`,
    name: row.name ?? row.search_term ?? "Compétition",
    country: row.country ?? "—",
    sport: row.sport as SportKey,
    logoUrl: row.logo_url ?? undefined,
    flagUrl: row.flag_url ?? undefined,
  };
}

export async function listCompetitions(sport?: SportKey): Promise<Competition[]> {
  const supabase = await createClient();
  let query = supabase
    .from("sports_competitions_cache")
    .select("sport, search_term, external_league_id, name, country, logo_url, flag_url")
    .not("external_league_id", "is", null)
    .order("name", { ascending: true });
  if (sport) query = query.eq("sport", sport);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as CompetitionRow[]).map(toCompetition);
}

/** Distinct countries actually represented among resolved competitions —
 * computed from real cached data instead of a hardcoded list, so it grows
 * on its own as more sports/competitions get added to sync-sports-data. */
export async function listCountries(): Promise<Country[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sports_competitions_cache")
    .select("country")
    .not("country", "is", null)
    .not("external_league_id", "is", null);
  if (error || !data) return [];

  const seen = new Map<string, Country>();
  for (const row of data as { country: string }[]) {
    if (seen.has(row.country)) continue;
    const code = getCountryCode(row.country);
    if (code) seen.set(row.country, { code, name: row.country });
  }
  return Array.from(seen.values());
}

export async function listCompetitionsByCountry(
  sport: SportKey
): Promise<{ country: string; competitions: Competition[] }[]> {
  const competitions = await listCompetitions(sport);
  const countries = Array.from(new Set(competitions.map((c) => c.country)));
  return countries.map((country) => ({
    country,
    competitions: competitions.filter((c) => c.country === country),
  }));
}

export async function getCompetitionById(id: string): Promise<Competition | null> {
  const parsed = parseEntityId(id, "comp");
  if (!parsed) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sports_competitions_cache")
    .select("sport, search_term, external_league_id, name, country, logo_url, flag_url")
    .eq("sport", parsed.sport)
    .eq("external_league_id", parsed.externalId)
    .maybeSingle();
  if (error || !data) return null;
  return toCompetition(data as CompetitionRow);
}

type TeamRow = {
  sport: string;
  external_team_id: number;
  name: string;
  country: string | null;
  logo_url: string | null;
};

function initialsFromName(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  return initials || "?";
}

function toTeam(row: TeamRow): Team {
  return {
    id: `${row.sport}-team-${row.external_team_id}`,
    name: row.name,
    // API-Sports' fixtures/games responses only carry a team's full name,
    // no separate short/nickname field — shortName mirrors name until a
    // source for that exists.
    shortName: row.name,
    initials: initialsFromName(row.name),
    country: row.country ?? "—",
    logoUrl: row.logo_url ?? undefined,
  };
}

export async function listTeams(): Promise<Team[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sports_teams_cache")
    .select("sport, external_team_id, name, country, logo_url")
    .order("name", { ascending: true });
  if (error || !data) return [];
  return (data as TeamRow[]).map(toTeam);
}

type FixtureRow = {
  sport: string;
  external_fixture_id: number;
  competition_id: string;
  home_team_external_id: number;
  home_team_name: string;
  home_team_logo_url: string | null;
  away_team_external_id: number;
  away_team_name: string;
  away_team_logo_url: string | null;
  kickoff_at: string;
  status: string;
  competition: {
    name: string | null;
    country: string | null;
    logo_url: string | null;
    flag_url: string | null;
    external_league_id: number | null;
  } | null;
};

function teamFromFixtureSide(sport: string, externalId: number, name: string, logoUrl: string | null): Team {
  return {
    id: `${sport}-team-${externalId}`,
    name,
    shortName: name,
    initials: initialsFromName(name),
    country: "—",
    logoUrl: logoUrl ?? undefined,
  };
}

function toMatch(row: FixtureRow): Match {
  const sport = row.sport as SportKey;
  const competition: Competition = {
    id: `${sport}-comp-${row.competition?.external_league_id ?? "inconnue"}`,
    name: row.competition?.name ?? "Compétition",
    country: row.competition?.country ?? "—",
    sport,
    logoUrl: row.competition?.logo_url ?? undefined,
    flagUrl: row.competition?.flag_url ?? undefined,
  };

  return {
    id: `${sport}-match-${row.external_fixture_id}`,
    sport,
    competition,
    homeTeam: teamFromFixtureSide(sport, row.home_team_external_id, row.home_team_name, row.home_team_logo_url),
    awayTeam: teamFromFixtureSide(sport, row.away_team_external_id, row.away_team_name, row.away_team_logo_url),
    kickoffAt: row.kickoff_at,
    status: row.status as MatchStatus,
  };
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
  return kickoff >= startOfDay(0) && kickoff < startOfDay(7);
}

const FIXTURE_SELECT =
  "sport, external_fixture_id, competition_id, home_team_external_id, home_team_name, home_team_logo_url, away_team_external_id, away_team_name, away_team_logo_url, kickoff_at, status, competition:sports_competitions_cache(name, country, logo_url, flag_url, external_league_id)";

export async function listUpcomingMatches(filters?: {
  sport?: SportKey;
  competitionId?: string;
  teamId?: string;
  window?: MatchWindow;
}): Promise<Match[]> {
  const supabase = await createClient();
  let query = supabase.from("sports_fixtures_cache").select(FIXTURE_SELECT).order("kickoff_at", { ascending: true });
  if (filters?.sport) query = query.eq("sport", filters.sport);

  const { data, error } = await query;
  if (error || !data) return [];

  let matches = (data as unknown as FixtureRow[]).map(toMatch);

  if (filters?.competitionId) {
    matches = matches.filter((m) => m.competition.id === filters.competitionId);
  }
  if (filters?.teamId) {
    matches = matches.filter((m) => m.homeTeam.id === filters.teamId || m.awayTeam.id === filters.teamId);
  }
  matches = matches.filter((m) => matchesWindow(m.kickoffAt, filters?.window));

  return matches;
}

export async function getMatchById(id: string): Promise<Match | null> {
  const parsed = parseEntityId(id, "match");
  if (!parsed) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sports_fixtures_cache")
    .select(FIXTURE_SELECT)
    .eq("sport", parsed.sport)
    .eq("external_fixture_id", parsed.externalId)
    .maybeSingle();
  if (error || !data) return null;
  return toMatch(data as unknown as FixtureRow);
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
 * plausible-looking mock opportunities. Real fixtures now flow through
 * listUpcomingMatches; this stays empty because computing "opportunities"
 * out of them needs a real odds/prediction model, which is a separate,
 * not-yet-built piece — not something an API-Sports fixtures sync alone
 * can honestly provide. */
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
