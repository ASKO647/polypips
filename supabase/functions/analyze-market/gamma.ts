const GAMMA_BASE = "https://gamma-api.polymarket.com";

export type GammaMarket = {
  question: string;
  description?: string;
  outcomes: string[];
  outcomePrices: number[];
  volume: number;
  liquidity: number;
  endDate?: string;
  closed?: boolean;
  active?: boolean;
  category?: string;
  slug: string;
};

export class MarketNotFoundError extends Error {}
export class GammaUnavailableError extends Error {}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toGammaMarket(raw: Record<string, unknown>): GammaMarket {
  const outcomes = parseJsonArray(raw.outcomes);
  const outcomePrices = parseJsonArray(raw.outcomePrices).map((p) => Number(p));

  return {
    question: String(raw.question ?? ""),
    description: typeof raw.description === "string" ? raw.description : undefined,
    outcomes,
    outcomePrices,
    volume: Number(raw.volumeNum ?? raw.volume ?? 0),
    liquidity: Number(raw.liquidityNum ?? raw.liquidity ?? 0),
    endDate: typeof raw.endDate === "string" ? raw.endDate : undefined,
    closed: Boolean(raw.closed),
    active: raw.active === undefined ? true : Boolean(raw.active),
    category: typeof raw.category === "string" ? raw.category : undefined,
    slug: String(raw.slug ?? ""),
  };
}

async function gammaFetch(path: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${GAMMA_BASE}${path}`, {
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    throw new GammaUnavailableError(
      `Impossible de contacter l'API Polymarket : ${(error as Error).message}`
    );
  }
  if (!response.ok) {
    throw new GammaUnavailableError(
      `L'API Polymarket a répondu avec le statut ${response.status}`
    );
  }
  return response.json();
}

/** Extracts the event slug from a Polymarket URL like
 * https://polymarket.com/event/<slug> or .../event/<slug>/<market-slug> */
export function extractSlugFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("polymarket.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const eventIdx = parts.indexOf("event");
    if (eventIdx === -1 || !parts[eventIdx + 1]) return null;
    return parts[eventIdx + 1];
  } catch {
    return null;
  }
}

export async function fetchMarketBySlug(slug: string): Promise<GammaMarket> {
  const events = (await gammaFetch(
    `/events?slug=${encodeURIComponent(slug)}`
  )) as Array<Record<string, unknown>>;

  if (Array.isArray(events) && events.length > 0) {
    const event = events[0];
    const markets = (event.markets as Array<Record<string, unknown>>) ?? [];
    if (markets.length > 0) {
      const market = toGammaMarket(markets[0]);
      if (!market.category && typeof event.category === "string") {
        market.category = event.category;
      }
      return market;
    }
  }

  const marketsDirect = (await gammaFetch(
    `/markets?slug=${encodeURIComponent(slug)}`
  )) as Array<Record<string, unknown>>;

  if (Array.isArray(marketsDirect) && marketsDirect.length > 0) {
    return toGammaMarket(marketsDirect[0]);
  }

  throw new MarketNotFoundError(
    `Aucun marché Polymarket trouvé pour le slug "${slug}".`
  );
}

/** Best-effort keyword search against Polymarket's public search endpoint,
 * used only when an image was provided instead of a link. Returns null when
 * no confident match is found rather than guessing. */
export async function searchMarketByText(
  query: string
): Promise<GammaMarket | null> {
  let results: unknown;
  try {
    results = await gammaFetch(
      `/public-search?q=${encodeURIComponent(query)}&events_status=active&limit_per_type=5`
    );
  } catch {
    return null;
  }

  const events =
    (results as { events?: Array<Record<string, unknown>> })?.events ?? [];
  if (!Array.isArray(events) || events.length === 0) return null;

  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  let best: { event: Record<string, unknown>; score: number } | null = null;
  for (const event of events) {
    const title = String(event.title ?? event.question ?? "").toLowerCase();
    if (!title) continue;
    const score = queryWords.filter((w) => title.includes(w)).length;
    if (!best || score > best.score) best = { event, score };
  }

  const minConfidentMatches = Math.max(2, Math.ceil(queryWords.length * 0.4));
  if (!best || best.score < minConfidentMatches) return null;

  const markets = (best.event.markets as Array<Record<string, unknown>>) ?? [];
  if (markets.length === 0) return null;

  const market = toGammaMarket(markets[0]);
  if (!market.category && typeof best.event.category === "string") {
    market.category = best.event.category as string;
  }
  return market;
}
