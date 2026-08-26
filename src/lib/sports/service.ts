/**
 * Service layer for the Sports module — every Sports page/component reads
 * through here, never through Supabase directly. Backed by real data from
 * two independent providers:
 *   - team sports (football/basketball/rugby/baseball) via API-Sports:
 *     sports_competitions_cache / sports_teams_cache / sports_fixtures_cache,
 *     populated by sync-sports-data (see that function's file comment, and
 *     _shared/api-sports.ts, for the source itself and its caveats).
 *   - individual-athlete sports (tennis/boxing/MMA) via The Odds API:
 *     odds_api_competitions_cache / odds_api_matches_cache, populated by
 *     sync-individual-sports-data (see that function's file comment, and
 *     _shared/odds-api.ts). No separate teams cache exists for these —
 *     there's no team to follow independently of a match, so player names
 *     live directly on each match row and get mapped into the same Team
 *     shape a team-sport player uses (no logoUrl, same as a team with a
 *     missing crest). These competitions also have no country — they're
 *     grouped by circuit (ATP/WTA/ITF/Boxe/MMA) instead, stored directly in
 *     Competition.country so every country-grouping call site (Compétitions
 *     browser, a competition's own match list) works unchanged; nav.ts's
 *     circuitEmoji() renders a circuit badge there instead of a flag.
 *
 * Every exported function here branches on isIndividualSport(sport) (see
 * nav.ts) to pick the right backing tables — the frontend components never
 * know or care which provider a given sport comes from.
 *
 * IDs handed out to callers (Competition.id, Match.id, Team.id) are
 * constructed strings — `${sport}-comp-${externalId}`,
 * `${sport}-match-${externalId}`, `${sport}-team-${externalId}` — never a
 * cache table's own row uuid, since fixtures/matches are deleted and
 * reinserted wholesale on every sync run (fresh uuids each time) and a
 * follow row (sports_match_follows.match_id / sports_team_follows.team_id,
 * both plain text) that stored a row uuid would silently point at nothing
 * after the next sync. externalId is a plain string here (not a number):
 * API-Sports hands out stable numeric ids, but The Odds API's ids
 * (sport_key strings like "tennis_atp_french_open", event ids like
 * "6c7c164...") are opaque strings — parseEntityId no longer assumes
 * digits-only, and each provider's own code converts to a number where its
 * own bigint-typed columns need one.
 *
 * Every analytical field (probabilities, score, opportunities, comparison
 * stats, form, H2H, lineups, odds, model accuracy...) is still honestly
 * empty here — emptyMatchAnalysis() below is unchanged. Only the
 * fixture/team/competition scheduling data below it is now real.
 */
import { createClient } from "@/lib/supabase/server";
import { getCountryCode } from "./country-codes";
import { isIndividualSport } from "./nav";
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
): { sport: string; externalId: string } | null {
  const marker = `-${kind}-`;
  const idx = id.indexOf(marker);
  if (idx === -1) return null;
  const sport = id.slice(0, idx);
  const externalId = id.slice(idx + marker.length);
  if (!sport || !externalId) return null;
  return { sport, externalId };
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

type IndividualCompetitionRow = {
  sport: string;
  odds_api_sport_key: string;
  circuit: string;
  title: string;
};

/** The Odds API never provides a crest for a tournament — logoUrl/flagUrl
 * stay undefined, exactly like a team-sport Competition with no resolved
 * logo yet. circuit (ATP/WTA/ITF/Boxe/MMA) is stored in Competition.country
 * — see this file's header comment for why. */
function toIndividualCompetition(row: IndividualCompetitionRow): Competition {
  return {
    id: `${row.sport}-comp-${row.odds_api_sport_key}`,
    name: row.title,
    country: row.circuit,
    sport: row.sport as SportKey,
    logoUrl: undefined,
    flagUrl: undefined,
  };
}

async function listIndividualCompetitions(sport?: SportKey): Promise<Competition[]> {
  const supabase = await createClient();
  let query = supabase
    .from("odds_api_competitions_cache")
    .select("sport, odds_api_sport_key, circuit, title")
    .eq("active", true)
    .order("title", { ascending: true });
  if (sport) query = query.eq("sport", sport);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as IndividualCompetitionRow[]).map(toIndividualCompetition);
}

export async function listCompetitions(sport?: SportKey): Promise<Competition[]> {
  if (sport && isIndividualSport(sport)) {
    return listIndividualCompetitions(sport);
  }
  if (sport) {
    return listTeamCompetitions(sport);
  }
  // No sport filter (the global Compétitions picker): every real
  // competition across both providers, sorted together by name.
  const [teamCompetitions, individualCompetitions] = await Promise.all([
    listTeamCompetitions(),
    listIndividualCompetitions(),
  ]);
  return [...teamCompetitions, ...individualCompetitions].sort((a, b) => a.name.localeCompare(b.name));
}

async function listTeamCompetitions(sport?: SportKey): Promise<Competition[]> {
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

  if (isIndividualSport(parsed.sport as SportKey)) {
    const { data, error } = await supabase
      .from("odds_api_competitions_cache")
      .select("sport, odds_api_sport_key, circuit, title")
      .eq("sport", parsed.sport)
      .eq("odds_api_sport_key", parsed.externalId)
      .maybeSingle();
    if (error || !data) return null;
    return toIndividualCompetition(data as IndividualCompetitionRow);
  }

  const externalLeagueId = Number(parsed.externalId);
  if (!Number.isFinite(externalLeagueId)) return null;

  const { data, error } = await supabase
    .from("sports_competitions_cache")
    .select("sport, search_term, external_league_id, name, country, logo_url, flag_url")
    .eq("sport", parsed.sport)
    .eq("external_league_id", externalLeagueId)
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

/** Resolves a single Team.id back to a Team — the counterpart to
 * getMatchById, and the reason "Mes équipes" reads through this instead of
 * listTeams()+filter. listTeams() only ever returns rows from
 * sports_teams_cache, which by design has no concept of an individual-sport
 * "team" at all (see this file's header comment — a tennis/boxing/MMA
 * player only ever exists as a name on a match row, via
 * teamFromPlayerName). A follow written for one of those ids would
 * therefore never match anything listTeams() returns, silently vanishing
 * from "Mes équipes" no matter how many times the page reloads. Resolving
 * by id directly sidesteps that: for an individual sport there's nothing to
 * query — the player's name is the externalId itself — and for a team
 * sport this is exactly listTeams()'s one-row equivalent. Returns null
 * (not a throw) when nothing matches, exactly like getMatchById. */
export async function getTeamById(id: string): Promise<Team | null> {
  const parsed = parseEntityId(id, "team");
  if (!parsed) return null;

  if (isIndividualSport(parsed.sport as SportKey)) {
    return teamFromPlayerName(parsed.sport, parsed.externalId);
  }

  const externalTeamId = Number(parsed.externalId);
  if (!Number.isFinite(externalTeamId)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sports_teams_cache")
    .select("sport, external_team_id, name, country, logo_url")
    .eq("sport", parsed.sport)
    .eq("external_team_id", externalTeamId)
    .maybeSingle();
  if (error || !data) return null;
  return toTeam(data as TeamRow);
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

type IndividualMatchRow = {
  sport: string;
  competition_id: string;
  odds_api_event_id: string;
  player_home: string;
  player_away: string;
  commence_at: string;
  status: string;
  competition: {
    odds_api_sport_key: string | null;
    circuit: string | null;
    title: string | null;
  } | null;
};

/** A player mapped into the same Team shape a team-sport player uses — no
 * logoUrl (The Odds API never provides one), country left as "—" since a
 * player's own nationality isn't something this API exposes either (the
 * tournament's circuit already appears on the Competition, not per-team). */
function teamFromPlayerName(sport: string, name: string): Team {
  return {
    id: `${sport}-team-${name}`,
    name,
    shortName: name,
    initials: initialsFromName(name),
    country: "—",
    logoUrl: undefined,
  };
}

function toIndividualMatch(row: IndividualMatchRow): Match {
  const sport = row.sport as SportKey;
  const competition: Competition = {
    id: `${sport}-comp-${row.competition?.odds_api_sport_key ?? "inconnue"}`,
    name: row.competition?.title ?? "Compétition",
    country: row.competition?.circuit ?? "—",
    sport,
    logoUrl: undefined,
    flagUrl: undefined,
  };

  return {
    id: `${sport}-match-${row.odds_api_event_id}`,
    sport,
    competition,
    homeTeam: teamFromPlayerName(sport, row.player_home),
    awayTeam: teamFromPlayerName(sport, row.player_away),
    kickoffAt: row.commence_at,
    status: row.status as MatchStatus,
  };
}

const INDIVIDUAL_MATCH_SELECT =
  "sport, competition_id, odds_api_event_id, player_home, player_away, commence_at, status, competition:odds_api_competitions_cache(odds_api_sport_key, circuit, title)";

async function listIndividualMatches(filters?: {
  sport?: SportKey;
  competitionId?: string;
  teamId?: string;
  window?: MatchWindow;
}): Promise<Match[]> {
  const supabase = await createClient();
  let query = supabase
    .from("odds_api_matches_cache")
    .select(INDIVIDUAL_MATCH_SELECT)
    .order("commence_at", { ascending: true });
  if (filters?.sport) query = query.eq("sport", filters.sport);

  const { data, error } = await query;
  if (error || !data) return [];

  let matches = (data as unknown as IndividualMatchRow[]).map(toIndividualMatch);

  if (filters?.competitionId) {
    matches = matches.filter((m) => m.competition.id === filters.competitionId);
  }
  if (filters?.teamId) {
    matches = matches.filter((m) => m.homeTeam.id === filters.teamId || m.awayTeam.id === filters.teamId);
  }
  matches = matches.filter((m) => matchesWindow(m.kickoffAt, filters?.window));

  return matches;
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
  // competitionId already encodes its sport (`${sport}-comp-${...}`) — a
  // caller that only passes competitionId (every per-competition match-list
  // page) still gets routed to the right table without needing to also
  // pass sport explicitly.
  const derivedSport =
    filters?.sport ??
    (filters?.competitionId ? (parseEntityId(filters.competitionId, "comp")?.sport as SportKey | undefined) : undefined);

  if (derivedSport && isIndividualSport(derivedSport)) {
    return listIndividualMatches({ ...filters, sport: derivedSport });
  }

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

  if (isIndividualSport(parsed.sport as SportKey)) {
    const { data, error } = await supabase
      .from("odds_api_matches_cache")
      .select(INDIVIDUAL_MATCH_SELECT)
      .eq("sport", parsed.sport)
      .eq("odds_api_event_id", parsed.externalId)
      .maybeSingle();
    if (error || !data) return null;
    return toIndividualMatch(data as unknown as IndividualMatchRow);
  }

  const externalFixtureId = Number(parsed.externalId);
  if (!Number.isFinite(externalFixtureId)) return null;

  const { data, error } = await supabase
    .from("sports_fixtures_cache")
    .select(FIXTURE_SELECT)
    .eq("sport", parsed.sport)
    .eq("external_fixture_id", externalFixtureId)
    .maybeSingle();
  if (error || !data) return null;
  return toMatch(data as unknown as FixtureRow);
}

/** Real upcoming (and recently played) fixtures between two named
 * teams/players — the Overview page's "Rechercher un match" box. Matches
 * by substring, case-insensitive, in either home/away order, across both
 * providers (team sports via sports_fixtures_cache, individual sports via
 * odds_api_matches_cache — a search for two player names works exactly the
 * same way). Four separate `.ilike()`-filtered queries rather than one
 * `.or()` string: PostgREST's `.or()` takes a single raw filter expression
 * you'd have to hand-assemble from the two team names, which is exactly
 * the kind of string-building that's easy to get subtly wrong; four
 * parameterized queries have no such risk. Returns [] (never throws) for a
 * blank team name — nothing to search for yet, not an error. */
export async function searchMatchesByTeams(teamA: string, teamB: string): Promise<Match[]> {
  const a = teamA.trim();
  const b = teamB.trim();
  if (!a || !b) return [];

  const supabase = await createClient();

  const [
    { data: fixturesAB },
    { data: fixturesBA },
    { data: individualAB },
    { data: individualBA },
  ] = await Promise.all([
    supabase.from("sports_fixtures_cache").select(FIXTURE_SELECT).ilike("home_team_name", `%${a}%`).ilike("away_team_name", `%${b}%`),
    supabase.from("sports_fixtures_cache").select(FIXTURE_SELECT).ilike("home_team_name", `%${b}%`).ilike("away_team_name", `%${a}%`),
    supabase.from("odds_api_matches_cache").select(INDIVIDUAL_MATCH_SELECT).ilike("player_home", `%${a}%`).ilike("player_away", `%${b}%`),
    supabase.from("odds_api_matches_cache").select(INDIVIDUAL_MATCH_SELECT).ilike("player_home", `%${b}%`).ilike("player_away", `%${a}%`),
  ]);

  const fixtureRows = [...(fixturesAB ?? []), ...(fixturesBA ?? [])] as unknown as FixtureRow[];
  const individualRows = [...(individualAB ?? []), ...(individualBA ?? [])] as unknown as IndividualMatchRow[];

  const seen = new Set<string>();
  const matches: Match[] = [];
  for (const match of fixtureRows.map(toMatch).concat(individualRows.map(toIndividualMatch))) {
    if (seen.has(match.id)) continue;
    seen.add(match.id);
    matches.push(match);
  }

  return matches.sort((m1, m2) => new Date(m1.kickoffAt).getTime() - new Date(m2.kickoffAt).getTime());
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
