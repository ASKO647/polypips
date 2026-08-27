/**
 * Client for The Odds API (the-odds-api.com) — covers individual-athlete
 * sports (tennis, boxing, MMA) that API-Sports (_shared/api-sports.ts)
 * doesn't have a product for at all, AND (as of the football-odds
 * complement) bookmaker odds for the subset of football leagues this
 * account's plan covers, layered on top of API-Sports' own football
 * fixtures — API-Sports stays the only source for the football fixtures
 * themselves (calendar, teams, logos, competitions); this file only ever
 * adds odds to fixtures that already exist there.
 *
 * IMPORTANT — unverified against a live response: this sandbox's network
 * egress blocks the-odds-api.com outright, so nothing in this file could
 * be exercised against a real request here. The shapes below come from
 * The Odds API's own published docs and real example responses quoted in
 * third-party client libraries (not guesswork) — but if a run comes back
 * consistently empty after a real deploy, check this run's Edge Function
 * logs against a manual curl of the same endpoint first. This also means
 * the exact list of soccer_* sport_keys this account's plan actually
 * covers has never been confirmed live either — see
 * fetchOddsApiOddsForSport's caller (sync-individual-sports-data) for why
 * that isn't hardcoded here.
 *
 * Auth: the API key is a query parameter (?apiKey=...), NOT a header —
 * different from API-Sports' x-apisports-key header convention.
 *
 * /v4/sports and /v4/sports/{key}/events (schedule only — id,
 * commence_time, home_team, away_team, no odds) are confirmed free, no
 * quota cost. /v4/sports/{key}/odds (fetchOddsApiOddsForSport) is the one
 * paid call here — priced per region × market, one charge per sport_key
 * regardless of how many events/bookmakers it returns — used only for the
 * football-odds complement, gated by the response's own
 * x-requests-remaining header rather than an assumed budget. Tennis/boxing/
 * MMA still never call it: PolyPips doesn't show bookmaker odds there yet,
 * so paying that cost would buy nothing.
 */

export class OddsApiUnavailableError extends Error {}

const HOST = "api.the-odds-api.com";

/** Every response carries these (even error responses, when the key itself
 * is valid) — the one way to know the account's actual remaining quota
 * without guessing at its plan size. Football odds fetching uses this to
 * self-throttle (see fetchOddsApiOddsForSport) instead of assuming a fixed
 * budget. Null when a header is missing (free /sports and /events calls on
 * some plans don't always return them). */
type OddsApiQuota = {
  requestsRemaining: number | null;
  requestsUsed: number | null;
};

function readQuota(response: Response): OddsApiQuota {
  const remaining = response.headers.get("x-requests-remaining");
  const used = response.headers.get("x-requests-used");
  return {
    requestsRemaining: remaining !== null ? Number(remaining) : null,
    requestsUsed: used !== null ? Number(used) : null,
  };
}

async function oddsApiFetch(path: string, apiKey: string): Promise<unknown> {
  const { json } = await oddsApiFetchWithQuota(path, apiKey);
  return json;
}

async function oddsApiFetchWithQuota(
  path: string,
  apiKey: string
): Promise<{ json: unknown; quota: OddsApiQuota }> {
  const separator = path.includes("?") ? "&" : "?";
  let response: Response;
  try {
    response = await fetch(`https://${HOST}${path}${separator}apiKey=${encodeURIComponent(apiKey)}`);
  } catch (error) {
    throw new OddsApiUnavailableError(`Impossible de contacter ${path} : ${(error as Error).message}`);
  }
  const quota = readQuota(response);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new OddsApiUnavailableError(
      `${path} a répondu avec le statut ${response.status}${body ? ` : ${body}` : ""}`
    );
  }
  return { json: await response.json(), quota };
}

export type OddsApiSportInfo = {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  hasOutrights: boolean;
};

/** GET /v4/sports — the live catalog of every sport_key available on this
 * API key's plan, confirmed free (no quota cost) regardless of plan tier.
 * Used to discover which tennis_* tournament keys are currently active,
 * and to confirm boxing_boxing/mma_mixed_martial_arts are actually on this
 * account rather than assuming it. */
export async function fetchOddsApiSports(apiKey: string): Promise<OddsApiSportInfo[]> {
  const json = await oddsApiFetch("/v4/sports/", apiKey);
  const items = Array.isArray(json) ? json : [];
  const sports: OddsApiSportInfo[] = [];
  for (const raw of items) {
    const row = raw as Record<string, unknown>;
    if (typeof row.key !== "string" || typeof row.title !== "string") continue;
    sports.push({
      key: row.key,
      group: typeof row.group === "string" ? row.group : "",
      title: row.title,
      description: typeof row.description === "string" ? row.description : "",
      active: row.active === true,
      hasOutrights: row.has_outrights === true,
    });
  }
  return sports;
}

export type OddsApiEvent = {
  id: string;
  commenceAt: string;
  /** Player/participant name — The Odds API reuses the generic
   * home_team/away_team field names for individual-athlete sports too,
   * there is no separate "player" field. */
  homeParticipant: string;
  awayParticipant: string;
};

/** GET /v4/sports/{sportKey}/events — this sport_key's near-term schedule,
 * no odds included. One request per sport_key regardless of how many
 * events come back. */
export async function fetchOddsApiEvents(sportKey: string, apiKey: string): Promise<OddsApiEvent[]> {
  const json = await oddsApiFetch(`/v4/sports/${encodeURIComponent(sportKey)}/events/`, apiKey);
  const items = Array.isArray(json) ? json : [];
  const events: OddsApiEvent[] = [];
  for (const raw of items) {
    const row = raw as Record<string, unknown>;
    const id = row.id;
    const commenceTime = row.commence_time;
    const home = row.home_team;
    const away = row.away_team;
    if (
      typeof id !== "string" ||
      typeof commenceTime !== "string" ||
      typeof home !== "string" ||
      typeof away !== "string"
    ) {
      continue;
    }
    events.push({ id, commenceAt: commenceTime, homeParticipant: home, awayParticipant: away });
  }
  return events;
}

export type OddsApiBookmakerOdds = {
  key: string;
  title: string;
  home: number;
  draw: number;
  away: number;
};

export type OddsApiOddsEvent = {
  id: string;
  commenceAt: string;
  homeTeam: string;
  awayTeam: string;
  bookmakers: OddsApiBookmakerOdds[];
};

/** GET /v4/sports/{sportKey}/odds — the only endpoint here that actually
 * costs quota: 1 region × 1 market (h2h, i.e. 1X2/moneyline) = 1 credit,
 * charged once for the whole sport_key regardless of how many events or
 * bookmakers come back in the response. Used only for football (see
 * sync-individual-sports-data's football-odds step) — tennis/boxing/MMA
 * still never call this (see this file's header comment), since PolyPips
 * doesn't show bookmaker odds anywhere in those sports yet.
 *
 * Returns both the parsed events and the account's remaining-quota count
 * straight from the response headers, so the caller can stop requesting
 * more sport_keys once quota runs low instead of assuming a fixed budget
 * for an account whose real plan size isn't known from inside this
 * function. */
export async function fetchOddsApiOddsForSport(
  sportKey: string,
  apiKey: string,
  options: { regions: string; markets: string }
): Promise<{ events: OddsApiOddsEvent[]; requestsRemaining: number | null }> {
  const query = `regions=${encodeURIComponent(options.regions)}&markets=${encodeURIComponent(options.markets)}&oddsFormat=decimal`;
  const { json, quota } = await oddsApiFetchWithQuota(
    `/v4/sports/${encodeURIComponent(sportKey)}/odds/?${query}`,
    apiKey
  );
  const items = Array.isArray(json) ? json : [];
  const events: OddsApiOddsEvent[] = [];

  for (const raw of items) {
    const row = raw as Record<string, unknown>;
    const id = row.id;
    const commenceTime = row.commence_time;
    const home = row.home_team;
    const away = row.away_team;
    if (
      typeof id !== "string" ||
      typeof commenceTime !== "string" ||
      typeof home !== "string" ||
      typeof away !== "string" ||
      !Array.isArray(row.bookmakers)
    ) {
      continue;
    }

    const bookmakers: OddsApiBookmakerOdds[] = [];
    for (const rawBookmaker of row.bookmakers) {
      const bookmakerRow = rawBookmaker as Record<string, unknown>;
      const bookmakerKey = bookmakerRow.key;
      const bookmakerTitle = bookmakerRow.title;
      const markets = bookmakerRow.markets;
      if (typeof bookmakerKey !== "string" || typeof bookmakerTitle !== "string" || !Array.isArray(markets)) {
        continue;
      }
      const h2h = (markets as Record<string, unknown>[]).find((m) => m.key === "h2h");
      const outcomes = h2h?.outcomes;
      if (!Array.isArray(outcomes)) continue;

      let homePrice: number | null = null;
      let awayPrice: number | null = null;
      let drawPrice: number | null = null;
      for (const rawOutcome of outcomes) {
        const outcome = rawOutcome as Record<string, unknown>;
        const name = outcome.name;
        const price = outcome.price;
        if (typeof name !== "string" || typeof price !== "number") continue;
        if (name === home) homePrice = price;
        else if (name === away) awayPrice = price;
        else if (name.toLowerCase() === "draw") drawPrice = price;
      }
      if (homePrice === null || awayPrice === null || drawPrice === null) continue;
      bookmakers.push({ key: bookmakerKey, title: bookmakerTitle, home: homePrice, draw: drawPrice, away: awayPrice });
    }

    if (bookmakers.length > 0) {
      events.push({ id, commenceAt: commenceTime, homeTeam: home, awayTeam: away, bookmakers });
    }
  }

  return { events, requestsRemaining: quota.requestsRemaining };
}
