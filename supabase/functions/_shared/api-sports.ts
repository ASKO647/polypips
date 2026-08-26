/**
 * Client for the API-Sports ecosystem (api-football.com's direct account
 * also unlocks the sibling per-sport APIs — basketball, hockey, rugby,
 * baseball, american-football — under the same account/key, each on its
 * own host).
 *
 * IMPORTANT — unverified against a live response: this sandbox's network
 * egress blocks api-sports.io/api-football.com outright, and no real
 * API_SPORTS_KEY was available here either, so nothing in this file could
 * be exercised against a real request. Every shape below is the best
 * available understanding from documentation knowledge, not a confirmed
 * live shape. Every parsing function here is deliberately defensive (tries
 * a couple of plausible field paths, coerces types, skips a row it can't
 * make sense of instead of throwing) so a wrong assumption about one
 * sport's exact response shape degrades that one sport's sync to "found
 * nothing this run" rather than crashing the whole function. If a sport
 * comes back consistently empty after a real deploy, start by checking
 * this run's Edge Function logs — see the console.log calls in
 * sync-sports-data/index.ts — against a manual curl of the same endpoint.
 *
 * Auth: a direct (non-RapidAPI) api-football.com/api-sports.io account
 * uses the `x-apisports-key` header — NOT `x-rapidapi-key` +
 * `x-rapidapi-host`, which is only for RapidAPI-issued keys.
 *
 * Tennis is NOT part of the API-Sports ecosystem at all (no v1.tennis host
 * exists there) — not included below, and not selectable anywhere in the
 * Sports module until a real tennis data source is connected (see
 * src/lib/sports/nav.ts's SPORT_CATEGORIES comment). Hockey and NFL/american
 * football products do exist on API-Sports but PolyPips doesn't cover them
 * (product decision, not a data-availability one) — also not included.
 */

export class ApiSportsUnavailableError extends Error {}

export type ApiSportsKey = "football" | "basketball" | "rugby" | "baseball";

export const SPORT_API_CONFIG: Record<
  ApiSportsKey,
  { host: string; scheduleEndpoint: "fixtures" | "games" }
> = {
  football: { host: "v3.football.api-sports.io", scheduleEndpoint: "fixtures" },
  basketball: { host: "v1.basketball.api-sports.io", scheduleEndpoint: "games" },
  rugby: { host: "v1.rugby.api-sports.io", scheduleEndpoint: "games" },
  baseball: { host: "v1.baseball.api-sports.io", scheduleEndpoint: "games" },
};

function hasRealErrors(errors: unknown): boolean {
  if (Array.isArray(errors)) return errors.length > 0;
  if (errors && typeof errors === "object") return Object.keys(errors).length > 0;
  return false;
}

async function apiSportsFetch(
  host: string,
  path: string,
  apiKey: string
): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(`https://${host}${path}`, {
      headers: { "x-apisports-key": apiKey, Accept: "application/json" },
    });
  } catch (error) {
    throw new ApiSportsUnavailableError(
      `Impossible de contacter ${host}${path} : ${(error as Error).message}`
    );
  }
  if (!response.ok) {
    throw new ApiSportsUnavailableError(`${host}${path} a répondu avec le statut ${response.status}`);
  }
  const json = (await response.json()) as Record<string, unknown>;
  if (hasRealErrors(json.errors)) {
    throw new ApiSportsUnavailableError(`${host}${path} : ${JSON.stringify(json.errors)}`);
  }
  return json;
}

/** Remaining/limit daily quota, when the API reports it (varies by
 * product — logged, never enforced client-side beyond this visibility). */
export function extractQuotaHeaders(): void {
  // Placeholder kept intentionally minimal: response headers aren't
  // exposed by apiSportsFetch's return shape today. If quota needs to be
  // read precisely later, switch apiSportsFetch to return the raw
  // Response and read response.headers.get("x-ratelimit-requests-remaining").
}

export type ResolvedLeague = {
  externalId: number;
  name: string;
  country: string | null;
  logoUrl: string | null;
  flagUrl: string | null;
  /** Verbatim season identifier as API-Sports returns it — a 4-digit year
   * for football, a "YYYY-YYYY" string for most sibling sports. Passed
   * straight back as the `season` query param, never reformatted. */
  season: string | null;
};

/** Parses one /leagues response item into a ResolvedLeague — shared by
 * resolveLeague (a single search-term lookup) and fetchAllLeagues (the
 * full per-sport catalog), since both hit the same endpoint shape.
 * Football's /leagues nests league info under `league` + a sibling
 * `country` object; several sibling-sport APIs return the same fields flat
 * on the item itself — both paths are tried. Returns null when the item
 * has no usable numeric league id, which the caller skips rather than
 * treats as fatal (one malformed row must never drop the rest of a
 * catalog). */
function parseLeagueItem(item: Record<string, unknown>, fallbackName?: string): ResolvedLeague | null {
  const league = (item.league ?? item) as Record<string, unknown>;
  const countryRaw = item.country ?? league.country;
  const country =
    typeof countryRaw === "string"
      ? countryRaw
      : countryRaw && typeof countryRaw === "object"
        ? ((countryRaw as Record<string, unknown>).name as string | undefined) ?? null
        : null;
  const flagUrl =
    countryRaw && typeof countryRaw === "object"
      ? ((countryRaw as Record<string, unknown>).flag as string | undefined) ?? null
      : null;

  const externalId = Number(league.id ?? item.id);
  if (!Number.isFinite(externalId)) return null;

  let season: string | null = null;
  const seasons = (item.seasons ?? league.seasons) as unknown;
  if (Array.isArray(seasons) && seasons.length > 0) {
    const currentEntry = seasons.find(
      (s) => s && typeof s === "object" && (s as Record<string, unknown>).current === true
    ) as Record<string, unknown> | undefined;
    const pick = currentEntry ?? seasons[seasons.length - 1];
    if (pick && typeof pick === "object") {
      const year = (pick as Record<string, unknown>).year ?? (pick as Record<string, unknown>).season;
      season = year !== undefined ? String(year) : null;
    } else if (pick !== undefined) {
      season = String(pick);
    }
  }

  return {
    externalId,
    name: String(league.name ?? item.name ?? fallbackName ?? `Compétition ${externalId}`),
    country,
    logoUrl: typeof league.logo === "string" ? (league.logo as string) : typeof item.logo === "string" ? (item.logo as string) : null,
    flagUrl,
    season,
  };
}

/** Resolves a single competition name (e.g. "Premier League") to a real
 * API-Sports league ID via that sport's /leagues search — used to find a
 * featured competition's ID inside the freshly-synced catalog when name
 * matching against the catalog itself isn't enough (see
 * sync-sports-data/index.ts). Returns null (not a throw) when nothing
 * matches — callers treat that as "try again next sync," not an error. */
export async function resolveLeague(
  sport: ApiSportsKey,
  searchTerm: string,
  apiKey: string
): Promise<ResolvedLeague | null> {
  const config = SPORT_API_CONFIG[sport];
  const json = await apiSportsFetch(config.host, `/leagues?search=${encodeURIComponent(searchTerm)}`, apiKey);
  const response = Array.isArray(json.response) ? json.response : [];
  if (response.length === 0) return null;
  return parseLeagueItem(response[0] as Record<string, unknown>, searchTerm);
}

/** Fetches every league/competition API-Sports has indexed for this sport —
 * no search/country filter — via a single request to /leagues. This is
 * the real, complete competition catalog (championships, national cups,
 * continental and international cups, tournaments — whatever API-Sports
 * itself has for the sport), not a curated subset: the Sports module's
 * "toutes les compétitions disponibles, organisées par pays" requirement
 * is satisfied by caching this verbatim rather than hand-authoring a
 * competitions list. One request regardless of how many leagues come
 * back, so this is cheap enough to run on every sync (see
 * sync-sports-data/index.ts's syncCatalog). A row with no usable id is
 * skipped, never fabricated. */
export async function fetchAllLeagues(sport: ApiSportsKey, apiKey: string): Promise<ResolvedLeague[]> {
  const config = SPORT_API_CONFIG[sport];
  const json = await apiSportsFetch(config.host, `/leagues`, apiKey);
  const response = Array.isArray(json.response) ? json.response : [];
  const leagues: ResolvedLeague[] = [];
  for (const raw of response) {
    const parsed = parseLeagueItem(raw as Record<string, unknown>);
    if (parsed) leagues.push(parsed);
  }
  return leagues;
}

export type ScheduleItem = {
  externalFixtureId: number;
  kickoffAt: string;
  status: "scheduled" | "live" | "finished";
  homeTeamExternalId: number;
  homeTeamName: string;
  homeTeamLogoUrl: string | null;
  awayTeamExternalId: number;
  awayTeamName: string;
  awayTeamLogoUrl: string | null;
};

/** Rows whose status falls in here are dropped from the sync entirely —
 * postponed/cancelled/awarded fixtures aren't a real "scheduled match" and
 * showing them as one would be more misleading than just omitting them
 * until (if) they get rescheduled with a fresh status. */
const SKIP_STATUS_CODES = new Set(["CANC", "PST", "ABD", "AWD", "WO", "SUSP"]);
const SCHEDULED_STATUS_CODES = new Set(["NS", "TBD"]);
const FINISHED_STATUS_CODES = new Set(["FT", "AET", "PEN", "AOT", "END", "FINISHED"]);

function normalizeStatus(shortCode: string | undefined | null): "scheduled" | "live" | "finished" | "skip" {
  const code = (shortCode ?? "").toUpperCase();
  if (SKIP_STATUS_CODES.has(code)) return "skip";
  if (SCHEDULED_STATUS_CODES.has(code) || code === "") return "scheduled";
  if (FINISHED_STATUS_CODES.has(code)) return "finished";
  // Anything else (1H, 2H, HT, Q1-Q4, OT, P1-P3, LIVE, INT...) is treated
  // as in-progress — the safe default for an unrecognized "not NS, not a
  // known finished code" status is "currently live", not "scheduled"
  // (which would wrongly imply it hasn't started).
  return "live";
}

/** Fetches every fixture/game API-Sports has for this league+season (no
 * `next=`/`date=` filtering server-side — that parameter's exact
 * availability per sport couldn't be verified live), then callers filter
 * to the near-term window themselves. One request per competition either
 * way, so this doesn't cost more against the daily quota. */
export async function fetchSchedule(
  sport: ApiSportsKey,
  leagueExternalId: number,
  season: string,
  apiKey: string
): Promise<ScheduleItem[]> {
  const config = SPORT_API_CONFIG[sport];
  const json = await apiSportsFetch(
    config.host,
    `/${config.scheduleEndpoint}?league=${leagueExternalId}&season=${encodeURIComponent(season)}`,
    apiKey
  );
  const response = Array.isArray(json.response) ? json.response : [];
  const items: ScheduleItem[] = [];

  for (const raw of response) {
    const row = raw as Record<string, unknown>;
    const fixture = (row.fixture ?? row) as Record<string, unknown>;
    const fixtureId = fixture.id;
    const dateStr = fixture.date;
    const statusObj = fixture.status as Record<string, unknown> | undefined;
    const statusShort = statusObj?.short as string | undefined;
    const teams = row.teams as Record<string, unknown> | undefined;
    const home = teams?.home as Record<string, unknown> | undefined;
    const away = teams?.away as Record<string, unknown> | undefined;

    if (fixtureId === undefined || typeof dateStr !== "string" || !home?.id || !away?.id) continue;

    const status = normalizeStatus(statusShort);
    if (status === "skip") continue;

    const kickoff = new Date(dateStr);
    if (Number.isNaN(kickoff.getTime())) continue;

    items.push({
      externalFixtureId: Number(fixtureId),
      kickoffAt: kickoff.toISOString(),
      status,
      homeTeamExternalId: Number(home.id),
      homeTeamName: typeof home.name === "string" ? home.name : "Équipe inconnue",
      homeTeamLogoUrl: typeof home.logo === "string" ? (home.logo as string) : null,
      awayTeamExternalId: Number(away.id),
      awayTeamName: typeof away.name === "string" ? away.name : "Équipe inconnue",
      awayTeamLogoUrl: typeof away.logo === "string" ? (away.logo as string) : null,
    });
  }

  return items;
}
