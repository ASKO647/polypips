/**
 * Client for The Odds API (the-odds-api.com) — covers individual-athlete
 * sports (tennis, boxing, MMA) that API-Sports (_shared/api-sports.ts)
 * doesn't have a product for at all.
 *
 * IMPORTANT — unverified against a live response: this sandbox's network
 * egress blocks the-odds-api.com outright, so nothing in this file could
 * be exercised against a real request here. The shapes below come from
 * The Odds API's own published docs and real example responses quoted in
 * third-party client libraries (not guesswork) — but if a run comes back
 * consistently empty after a real deploy, check this run's Edge Function
 * logs against a manual curl of the same endpoint first.
 *
 * Auth: the API key is a query parameter (?apiKey=...), NOT a header —
 * different from API-Sports' x-apisports-key header convention.
 *
 * Deliberately only ever calls /v4/sports (confirmed free, no quota cost)
 * and /v4/sports/{key}/events (schedule only — id, commence_time,
 * home_team, away_team, no odds). /v4/sports/{key}/odds is never called:
 * it's priced per region × market and PolyPips doesn't display bookmaker
 * odds anywhere in the Sports module yet, so paying that cost would buy
 * nothing.
 */

export class OddsApiUnavailableError extends Error {}

const HOST = "api.the-odds-api.com";

async function oddsApiFetch(path: string, apiKey: string): Promise<unknown> {
  const separator = path.includes("?") ? "&" : "?";
  let response: Response;
  try {
    response = await fetch(`https://${HOST}${path}${separator}apiKey=${encodeURIComponent(apiKey)}`);
  } catch (error) {
    throw new OddsApiUnavailableError(`Impossible de contacter ${path} : ${(error as Error).message}`);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new OddsApiUnavailableError(
      `${path} a répondu avec le statut ${response.status}${body ? ` : ${body}` : ""}`
    );
  }
  return response.json();
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
