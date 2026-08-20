/**
 * Client for Polymarket's official trader leaderboard.
 * Documented at https://docs.polymarket.com/api-reference/core/get-trader-leaderboard-rankings
 * (GET https://data-api.polymarket.com/v1/leaderboard).
 *
 * IMPORTANT — unverified against a live response: this sandbox's network
 * egress blocks both docs.polymarket.com and data-api.polymarket.com, so
 * none of this could be confirmed against the real docs page or an actual
 * API response. The endpoint path, `timePeriod`/`category` query
 * parameters, and response field names below come from two independent
 * web searches that converged on the same shape — the strongest
 * confirmation available from this sandbox, but still not a verified
 * live response. Parses defensively (tries multiple plausible field
 * names, never throws on an unrecognized shape) for the same reason
 * every function in polymarket-data.ts does. If a real run comes back
 * empty, start by re-checking this against an actual response.
 */

import { WALLET_ADDRESS_RE } from "./polymarket-data.ts";

const DATA_API_BASE = "https://data-api.polymarket.com";

export class LeaderboardUnavailableError extends Error {}

export type LeaderboardEntry = {
  /** Polymarket's own rank for this trader on the leaderboard — the
   * selection downstream trusts this ordering rather than re-deriving
   * one from vol/pnl itself. */
  rank: number;
  address: string;
  /** Polymarket display name, when the trader has set one — preferred
   * over a shortened address for the wallet's tracked_wallets label. */
  userName: string | null;
  volume: number;
  pnl: number;
};

/**
 * Top of the monthly, all-category trader leaderboard, in Polymarket's
 * own rank order. `limit` deliberately over-fetches beyond the final
 * tracked-wallet count so a recent-activity filter downstream still has
 * enough qualifying candidates left after rejecting anyone who ranks well
 * but isn't trading recently — the leaderboard response itself carries no
 * trade-count/frequency field to filter on directly.
 */
export async function fetchMonthlyLeaderboard(limit = 25): Promise<LeaderboardEntry[]> {
  let response: Response;
  try {
    response = await fetch(
      `${DATA_API_BASE}/v1/leaderboard?timePeriod=MONTH&category=OVERALL&limit=${limit}`,
      { headers: { Accept: "application/json" } }
    );
  } catch (error) {
    throw new LeaderboardUnavailableError(
      `Impossible de contacter le leaderboard Polymarket : ${(error as Error).message}`
    );
  }
  if (!response.ok) {
    throw new LeaderboardUnavailableError(
      `Le leaderboard Polymarket a répondu avec le statut ${response.status}`
    );
  }

  const raw = await response.json();
  const rows: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>)?.data)
      ? ((raw as Record<string, unknown>).data as unknown[])
      : [];

  return rows
    .map((r, i) => {
      const row = r as Record<string, unknown>;
      const address = String(row.proxyWallet ?? row.wallet ?? row.address ?? "").toLowerCase();
      const rank = Number(row.rank ?? i + 1);
      const userName =
        typeof row.userName === "string" && row.userName.trim() ? row.userName.trim() : null;
      const volume = Number(row.vol ?? row.volume ?? 0);
      const pnl = Number(row.pnl ?? 0);
      return {
        rank: Number.isFinite(rank) ? rank : i + 1,
        address,
        userName,
        volume: Number.isFinite(volume) ? volume : 0,
        pnl: Number.isFinite(pnl) ? pnl : 0,
      } satisfies LeaderboardEntry;
    })
    .filter((entry) => WALLET_ADDRESS_RE.test(entry.address))
    .slice(0, limit);
}
