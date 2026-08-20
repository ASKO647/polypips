/**
 * Server-only client for Vercel's public Web Analytics API (launched
 * 2026, confirmed via web search — https://vercel.com/changelog/web-analytics-api
 * and https://vercel.com/docs/analytics/web-analytics-api). vercel.com
 * itself is unreachable from this environment (network egress blocks it),
 * so none of this could be checked against the real docs page or a live
 * response — the endpoint paths, query params, and response shape below
 * come from search-engine-indexed snippets of that docs page that
 * converged on the same shape across multiple independent queries, the
 * strongest confirmation available here, but still not a verified live
 * response. Parses defensively for that reason (never throws on an
 * unrecognized field, falls back to 0) — if a real call comes back with
 * unexpected data, start by re-checking this against an actual response
 * or the docs page from a machine that can reach vercel.com.
 *
 * Requires three env vars (server-only, never NEXT_PUBLIC_*):
 * VERCEL_API_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID.
 */

const VERCEL_API_BASE = "https://api.vercel.com";

export class VercelAnalyticsNotConfiguredError extends Error {}
export class VercelAnalyticsUnavailableError extends Error {}

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}

function credentials(): { token: string; projectId: string; teamId: string } {
  const token = requiredEnv("VERCEL_API_TOKEN");
  const projectId = requiredEnv("VERCEL_PROJECT_ID");
  const teamId = requiredEnv("VERCEL_TEAM_ID");
  if (!token || !projectId || !teamId) {
    throw new VercelAnalyticsNotConfiguredError(
      "VERCEL_API_TOKEN, VERCEL_PROJECT_ID et/ou VERCEL_TEAM_ID ne sont pas configurés."
    );
  }
  return { token, projectId, teamId };
}

/** True as soon as all three env vars are present — lets a page decide
 * "show the empty state" vs. "try the real call" without triggering the
 * NotConfigured throw path just to check. */
export function isVercelAnalyticsConfigured(): boolean {
  return !!(
    requiredEnv("VERCEL_API_TOKEN") &&
    requiredEnv("VERCEL_PROJECT_ID") &&
    requiredEnv("VERCEL_TEAM_ID")
  );
}

async function queryVercelAnalytics<T>(
  path: string,
  params: Record<string, string>
): Promise<T> {
  const { token, projectId, teamId } = credentials();

  const url = new URL(`${VERCEL_API_BASE}${path}`);
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("teamId", teamId);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      // Owner console pages read this on every request — never serve a
      // stale cached response for what's meant to be near-live data.
      cache: "no-store",
    });
  } catch (error) {
    throw new VercelAnalyticsUnavailableError(
      `Impossible de contacter l'API Vercel Web Analytics : ${(error as Error).message}`
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new VercelAnalyticsUnavailableError(
      `L'API Vercel Web Analytics a répondu avec le statut ${response.status}` +
        (body?.error?.message ? ` (${body.error.message})` : "")
    );
  }

  return response.json() as Promise<T>;
}

export type VisitsTotals = { pageviews: number; visitors: number };

function parseVisitsTotals(raw: unknown): VisitsTotals {
  const data = (raw as { data?: Record<string, unknown> })?.data ?? {};
  const pageviews = Number(data.pageviews ?? 0);
  const visitors = Number(data.visitors ?? 0);
  return {
    pageviews: Number.isFinite(pageviews) ? pageviews : 0,
    visitors: Number.isFinite(visitors) ? visitors : 0,
  };
}

/** Total pageviews + unique visitors for [since, until). Vercel Web
 * Analytics doesn't report a distinct "sessions" metric — "visitors"
 * (unique visitor count) is the closest equivalent it exposes. */
export async function fetchVisitsTotals(since: Date, until: Date): Promise<VisitsTotals> {
  const raw = await queryVercelAnalytics("/v1/query/web-analytics/visits/count", {
    since: since.toISOString(),
    until: until.toISOString(),
  });
  return parseVisitsTotals(raw);
}

export type DailyVisits = { date: string; pageviews: number; visitors: number };

function parseDailyVisits(raw: unknown): DailyVisits[] {
  const rows = (raw as { data?: unknown[] })?.data;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => {
      const row = r as Record<string, unknown>;
      const timestamp = String(row.timestamp ?? row.date ?? "");
      const pageviews = Number(row.pageviews ?? 0);
      const visitors = Number(row.visitors ?? 0);
      return {
        date: timestamp,
        pageviews: Number.isFinite(pageviews) ? pageviews : 0,
        visitors: Number.isFinite(visitors) ? visitors : 0,
      };
    })
    .filter((r) => r.date);
}

/** Pageviews + visitors grouped by day, for the Analytics page's chart. */
export async function fetchDailyVisits(since: Date, until: Date): Promise<DailyVisits[]> {
  const raw = await queryVercelAnalytics("/v1/query/web-analytics/visits/aggregate", {
    since: since.toISOString(),
    until: until.toISOString(),
    by: "day",
  });
  return parseDailyVisits(raw);
}

/**
 * "Real-Time" here means "visitors active in the last RECENT_WINDOW_MINUTES
 * minutes", refreshed on each page load/interval — not a live push stream.
 * Vercel's own Web Analytics dashboard can itself take a few minutes (up
 * to ~30 in the worst case, per Vercel's own troubleshooting guidance
 * found via search) to surface a just-happened visit, so even this
 * "recent" window is not instantaneous — the console page says so
 * explicitly rather than implying true real-time.
 */
export const RECENT_WINDOW_MINUTES = 30;

export async function fetchRecentVisitors(): Promise<VisitsTotals> {
  const until = new Date();
  const since = new Date(until.getTime() - RECENT_WINDOW_MINUTES * 60 * 1000);
  return fetchVisitsTotals(since, until);
}
