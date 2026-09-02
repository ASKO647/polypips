/**
 * Client for The Odds API (the-odds-api.com) — covers tennis, the
 * individual-athlete sport that API-Sports (_shared/api-sports.ts) doesn't
 * have a product for at all (see that file's own header comment).
 *
 * Deliberately minimal: only the two confirmed-free, quota-safe endpoints
 * this session's Sport Analyse IA actually needs (list sports, list a
 * sport's near-term schedule). The bookmaker-odds endpoint that used to
 * live here (fetchOddsApiOddsForSport, for the old football-odds
 * complement) is NOT restored — nothing in the current fixture-prediction
 * flow shows bookmaker odds at all, so that paid call would buy nothing.
 * If it's ever needed again, see git history for this file before the
 * Sport universe rebuild (2026-09).
 *
 * IMPORTANT — unverified against a live response: this sandbox's network
 * egress blocks the-odds-api.com outright, so nothing in this file could
 * be exercised against a real request here. The shapes below come from
 * The Odds API's own published docs (confirmed via a research pass, not
 * guessed) — but if a run comes back consistently empty after a real
 * deploy, check this run's Edge Function logs against a manual curl of
 * the same endpoint first.
 *
 * Auth: the API key is a query parameter (?apiKey=...), NOT a header —
 * different from API-Sports' x-apisports-key header convention.
 *
 * Structural limits confirmed for tennis specifically (not a bug in this
 * file — an inherent shape of the data source, surfaced honestly in the
 * UI rather than hidden): there is no player-search endpoint (the caller
 * must fan out across every active tennis_* sport_key's /events and
 * match client-side — see sport-match-search/index.ts's
 * searchTennisMatchup), a specific matchup only appears here once that
 * tournament's draw is published (typically 1-3 days before it's played,
 * never weeks ahead the way a league fixture list works), and there is no
 * real head-to-head history endpoint at all (the closest thing, /scores,
 * only looks back 3 days).
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
  active: boolean;
};

/** GET /v4/sports — the live catalog of every sport_key available on this
 * API key's plan, confirmed free (no quota cost) regardless of plan tier.
 * Used to discover which tennis_* tournament keys are currently active —
 * there is no dedicated "list active tennis tournaments" endpoint, this
 * is the only source for that. */
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
      active: row.active === true,
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
 * no odds included. Confirmed free (no quota cost), regardless of plan
 * tier. One request per sport_key regardless of how many events come
 * back — see this file's header comment for why a tennis search still
 * needs one call per active tournament. */
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
