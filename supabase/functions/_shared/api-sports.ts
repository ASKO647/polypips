/**
 * Client for the API-Sports ecosystem (api-football.com's direct account
 * also unlocks the sibling per-sport APIs — basketball, hockey, rugby,
 * baseball, american-football — under the same account/key, each on its
 * own host). Used on-demand by sport-match-search/index.ts (team search +
 * head-to-head lookup), not by any background sync anymore — the old
 * browse-everything Sport module (and its sync-sports-data Edge Function)
 * was replaced by the current search-driven "Analyse IA" (2026-09).
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
 * this run's Edge Function logs against a manual curl of the same
 * endpoint.
 *
 * Auth: a direct (non-RapidAPI) api-football.com/api-sports.io account
 * uses the `x-apisports-key` header — NOT `x-rapidapi-key` +
 * `x-rapidapi-host`, which is only for RapidAPI-issued keys.
 *
 * Tennis is NOT part of the API-Sports ecosystem at all (no v1.tennis host
 * exists there) — not included below. It's covered instead via
 * _shared/odds-api.ts (The Odds API), a structurally different query
 * shape (no player search, no real match history — see that file's own
 * header comment) that sport-match-search/index.ts branches to
 * separately. Rugby was covered before the Sport universe's "Analyse IA"
 * rebuild (2026-09, product decision: Football/Basketball/Tennis only) —
 * removed here along with it, not deactivated. Hockey and NFL/american
 * football products do exist on API-Sports but PolyPips doesn't cover them
 * (product decision, not a data-availability one) — also not included.
 */

export class ApiSportsUnavailableError extends Error {}

export type ApiSportsKey = "football" | "basketball";

export const SPORT_API_CONFIG: Record<
  ApiSportsKey,
  {
    host: string;
    scheduleEndpoint: "fixtures" | "games";
    /** Path (relative to host) for the head-to-head lookup between two
     * team IDs — football's API-Sports product exposes a dedicated
     * /fixtures/headtohead endpoint; basketball's sibling product instead
     * filters the base /games endpoint with an h2h= query param rather
     * than having its own sub-path. Both ultimately return the same
     * fixture/game array shape fetchSchedule already parses. */
    h2hPath: (team1Id: number, team2Id: number) => string;
  }
> = {
  football: {
    host: "v3.football.api-sports.io",
    scheduleEndpoint: "fixtures",
    h2hPath: (a, b) => `/fixtures/headtohead?h2h=${a}-${b}`,
  },
  basketball: {
    host: "v1.basketball.api-sports.io",
    scheduleEndpoint: "games",
    h2hPath: (a, b) => `/games?h2h=${a}-${b}`,
  },
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

/** A past season whose end (or start, absent an end) is older than this is
 * no longer "the best available fallback" — it's a stale, already-finished
 * edition that shouldn't keep resurfacing as if it were current. This is
 * what fixes the "Euro 2024 still shows in 2026" bug: a one-off tournament
 * (Euro, World Cup, Copa América...) that only recurs every 2-4 years has
 * no in-progress and no near-future season between editions, so it used to
 * fall all the way back to "most recently finished" — correct for a
 * regular annual league waiting for its next season to be published (a gap
 * of at most a few months), completely wrong for a quadrennial event
 * that's stale for years. 730 days (2 years) is comfortably longer than
 * any real annual league's close season, yet always shorter than the gap
 * between two editions of any periodic tournament — so this one
 * sport/competition-agnostic threshold resolves both cases correctly
 * without needing to classify competition "type" (unreliable/unverified
 * API field) or hand-code a per-competition calendar. */
const MAX_STALE_PAST_DAYS = 730;
/** Symmetric near-future bound for the "upcoming" branch — an entry whose
 * season hasn't started is only "à venir prochainement" if it starts
 * within this horizon. Guards the same theoretical case (a far-future
 * season entry resolving as if it were the current one) without needing to
 * assume how far in advance any given sport typically publishes its next
 * season. */
const MAX_FUTURE_HORIZON_DAYS = 400;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Picks whichever entry in a league's raw `seasons` array (as API-Sports
 * returns it — each entry roughly `{ year, start, end, current, coverage }`,
 * though not every field is guaranteed present on every sport/host) is
 * actually current as of `now`.
 *
 * Deliberately does NOT trust the API's own `current` boolean as the sole
 * source of truth, and deliberately does NOT hand-code a per-sport calendar
 * rule (European football = Aug-May, MLB = Mar-Oct, NBA = Oct-June, etc.):
 * both would need updating by hand every year or every time a competition
 * doesn't fit the assumed pattern, and a `current` flag that lags for even
 * a few days around a season turnover is exactly what makes a synced
 * catalog look stuck on last year's season indefinitely. Every league
 * already tells us its own real season window via `start`/`end` — using
 * those against `now` is correct for football's split-year seasons AND
 * calendar-year sports (MLB) AND everything in between, with one same
 * rule, recomputed fresh on every call from the actual current date.
 *
 * Priority: a season actually in progress today > the soonest season that
 * starts within MAX_FUTURE_HORIZON_DAYS (the close-season gap once the
 * previous one already finished, and next season's fixtures are typically
 * published ahead of its start) > the most recently finished one, but only
 * if it ended within MAX_STALE_PAST_DAYS (nothing newer published yet —
 * the honest "best available" fallback for a competition that runs every
 * year). When real dated entries exist but none of the three qualifies —
 * every dated entry is either too far in the future or, more commonly, too
 * long in the past — this returns undefined rather than resurrecting a
 * stale edition: there is nothing currently viable to show, so callers
 * (see fetchAllLeagues / sync-sports-data) leave this competition out of
 * the catalog entirely instead of displaying a defunct season as if it
 * were live. Only when no entry has a parseable `start` date at all
 * (`dated` stays empty — a different, much rarer condition than "found
 * dates but they're all stale") does this fall back to the API's own
 * `current` flag, then to the last array entry, since at that point
 * there's no date left to reason about and no risk of the staleness bug
 * either. */
export function pickCurrentSeasonEntry(
  seasons: unknown[],
  now: Date
): Record<string, unknown> | string | number | undefined {
  const entries = seasons.filter((s) => s !== null && s !== undefined) as Array<
    Record<string, unknown> | string | number
  >;
  if (entries.length === 0) return undefined;

  const dated: Array<{ entry: Record<string, unknown>; start: Date; end: Date | null }> = [];
  for (const raw of entries) {
    if (!raw || typeof raw !== "object") continue;
    const startRaw = (raw as Record<string, unknown>).start;
    if (typeof startRaw !== "string") continue;
    const start = new Date(startRaw);
    if (Number.isNaN(start.getTime())) continue;
    const endRaw = (raw as Record<string, unknown>).end;
    const end = typeof endRaw === "string" ? new Date(endRaw) : null;
    dated.push({ entry: raw as Record<string, unknown>, start, end: end && !Number.isNaN(end.getTime()) ? end : null });
  }

  if (dated.length > 0) {
    const inProgress = dated.find((d) => d.start <= now && (!d.end || now <= d.end));
    if (inProgress) return inProgress.entry;

    const upcoming = dated
      .filter((d) => d.start > now && d.start.getTime() - now.getTime() <= MAX_FUTURE_HORIZON_DAYS * DAY_MS)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    if (upcoming.length > 0) return upcoming[0].entry;

    const past = dated
      .filter((d) => d.start <= now && now.getTime() - (d.end ?? d.start).getTime() <= MAX_STALE_PAST_DAYS * DAY_MS)
      .sort((a, b) => b.start.getTime() - a.start.getTime());
    if (past.length > 0) return past[0].entry;

    // Real dated entries exist, but every single one is either years in
    // the past or too far in the future to count as "current" — a
    // periodic/one-off tournament between editions. Deliberately does NOT
    // fall through to the current-flag/last-entry fallback below, which
    // exists for the unrelated "no usable dates at all" case — falling
    // through here would just resurrect the same stale entry this
    // function exists to exclude.
    return undefined;
  }

  const currentFlag = entries.find(
    (s) => s && typeof s === "object" && (s as Record<string, unknown>).current === true
  );
  return currentFlag ?? entries[entries.length - 1];
}

/** Parses one /leagues response item into a ResolvedLeague — shared by
 * resolveLeague (a single search-term lookup) and fetchAllLeagues (the
 * full per-sport catalog), since both hit the same endpoint shape.
 * Football's /leagues nests league info under `league` + a sibling
 * `country` object; several sibling-sport APIs return the same fields flat
 * on the item itself — both paths are tried. Returns null when the item
 * has no usable numeric league id, which the caller skips rather than
 * treats as fatal (one malformed row must never drop the rest of a
 * catalog). `now` defaults to the real current time and only exists as a
 * parameter so pickCurrentSeasonEntry's date logic can be exercised
 * deterministically in tests. */
function parseLeagueItem(
  item: Record<string, unknown>,
  fallbackName?: string,
  now: Date = new Date()
): ResolvedLeague | null {
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
    const pick = pickCurrentSeasonEntry(seasons, now);
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
  apiKey: string,
  now: Date = new Date()
): Promise<ResolvedLeague | null> {
  const config = SPORT_API_CONFIG[sport];
  const json = await apiSportsFetch(config.host, `/leagues?search=${encodeURIComponent(searchTerm)}`, apiKey);
  const response = Array.isArray(json.response) ? json.response : [];
  if (response.length === 0) return null;
  return parseLeagueItem(response[0] as Record<string, unknown>, searchTerm, now);
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
export async function fetchAllLeagues(
  sport: ApiSportsKey,
  apiKey: string,
  now: Date = new Date()
): Promise<ResolvedLeague[]> {
  const config = SPORT_API_CONFIG[sport];
  const json = await apiSportsFetch(config.host, `/leagues`, apiKey);
  const response = Array.isArray(json.response) ? json.response : [];
  const leagues: ResolvedLeague[] = [];
  for (const raw of response) {
    const parsed = parseLeagueItem(raw as Record<string, unknown>, undefined, now);
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
  /** Every fixture in a football/basketball response carries its own
   * league object (a head-to-head pair can have met across several
   * competitions, e.g. league play AND a cup) — null only when the row's
   * own shape didn't include one. */
  competitionName: string | null;
  /** Present on a finished item — the score fetchHeadToHead's recent-
   * meetings callers need for real context; always null for a scheduled
   * (not yet played) item. */
  homeScore: number | null;
  awayScore: number | null;
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

/** Shared by fetchSchedule and fetchHeadToHead — both hit an endpoint that
 * returns the same fixture/game array shape (either `{fixture, teams}` for
 * football, or the fields flat on the row itself for basketball). A row
 * missing an id, date, or either team is skipped rather than fabricated;
 * one malformed row must never drop the rest of the response. */
function parseScheduleItems(response: unknown[]): ScheduleItem[] {
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

    const league = row.league as Record<string, unknown> | undefined;
    const goals = row.goals as Record<string, unknown> | undefined;
    const scores = row.scores as Record<string, unknown> | undefined;
    const homeScoreRaw = goals?.home ?? (scores?.home as Record<string, unknown> | undefined)?.total;
    const awayScoreRaw = goals?.away ?? (scores?.away as Record<string, unknown> | undefined)?.total;

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
      competitionName: typeof league?.name === "string" ? (league.name as string) : null,
      homeScore: typeof homeScoreRaw === "number" ? homeScoreRaw : null,
      awayScore: typeof awayScoreRaw === "number" ? awayScoreRaw : null,
    });
  }

  return items;
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
  return parseScheduleItems(Array.isArray(json.response) ? json.response : []);
}

export type ResolvedTeam = {
  externalId: number;
  name: string;
  logoUrl: string | null;
  country: string | null;
};

/** Resolves a free-text team name (as typed by a user, e.g. "Real Madrid")
 * to API-Sports' own team records via /teams?search= — one request,
 * returns every match the search turns up (rarely more than a handful) so
 * the caller can pick the best one (see analyzeIA's team-name matching in
 * sport-match-search/index.ts) rather than trusting result order. */
export async function searchTeams(
  sport: ApiSportsKey,
  searchTerm: string,
  apiKey: string
): Promise<ResolvedTeam[]> {
  const config = SPORT_API_CONFIG[sport];
  const json = await apiSportsFetch(config.host, `/teams?search=${encodeURIComponent(searchTerm)}`, apiKey);
  const response = Array.isArray(json.response) ? json.response : [];
  const teams: ResolvedTeam[] = [];
  for (const raw of response) {
    const row = raw as Record<string, unknown>;
    const team = (row.team ?? row) as Record<string, unknown>;
    const externalId = Number(team.id);
    if (!Number.isFinite(externalId)) continue;
    const countryRaw = row.country ?? team.country;
    const country =
      typeof countryRaw === "string"
        ? countryRaw
        : countryRaw && typeof countryRaw === "object"
          ? ((countryRaw as Record<string, unknown>).name as string | undefined) ?? null
          : null;
    teams.push({
      externalId,
      name: typeof team.name === "string" ? team.name : `Équipe ${externalId}`,
      logoUrl: typeof team.logo === "string" ? (team.logo as string) : null,
      country,
    });
  }
  return teams;
}

/** Every fixture/game API-Sports has ever recorded between these two exact
 * teams — past AND future, whatever the endpoint returns, with no status
 * filter server-side (unverified availability per sport, same reasoning as
 * fetchSchedule) — callers split it into "next 3 upcoming" and "recent
 * meetings for context" themselves (see sport-match-search/index.ts). */
export async function fetchHeadToHead(
  sport: ApiSportsKey,
  team1ExternalId: number,
  team2ExternalId: number,
  apiKey: string
): Promise<ScheduleItem[]> {
  const config = SPORT_API_CONFIG[sport];
  const json = await apiSportsFetch(config.host, config.h2hPath(team1ExternalId, team2ExternalId), apiKey);
  return parseScheduleItems(Array.isArray(json.response) ? json.response : []);
}
