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
  /** On-chain condition ID — used by sync-smart-money to look up a
   * market's top holders via the Polymarket Data API's /holders
   * endpoint, which is keyed by condition ID rather than slug. */
  conditionId?: string;
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
    conditionId: typeof raw.conditionId === "string" ? raw.conditionId : undefined,
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

/** Extracts the event slug (and, when present, the specific sub-market
 * slug) from a Polymarket URL like https://polymarket.com/event/<slug> or
 * .../event/<slug>/<market-slug>. The second segment matters for
 * multi-outcome events (e.g. a Fed decision event with separate "25bps
 * cut" / "50bps cut" / "no change" markets) — without it,
 * fetchMarketBySlug has no way to know which specific outcome the pasted
 * link pointed to and silently falls back to the first one. */
export function extractSlugFromUrl(
  url: string
): { eventSlug: string; marketSlug: string | null } | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("polymarket.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const eventIdx = parts.indexOf("event");
    if (eventIdx === -1 || !parts[eventIdx + 1]) return null;
    return {
      eventSlug: parts[eventIdx + 1],
      marketSlug: parts[eventIdx + 2] ?? null,
    };
  } catch {
    return null;
  }
}

export async function fetchMarketBySlug(
  eventSlug: string,
  marketSlug: string | null
): Promise<GammaMarket> {
  const events = (await gammaFetch(
    `/events?slug=${encodeURIComponent(eventSlug)}`
  )) as Array<Record<string, unknown>>;

  if (Array.isArray(events) && events.length > 0) {
    const event = events[0];
    const markets = (event.markets as Array<Record<string, unknown>>) ?? [];
    if (markets.length > 0) {
      // A URL that names a specific sub-market (multi-outcome event) picks
      // that exact one; otherwise (or if it isn't found) fall back to the
      // first market, same as before.
      const targeted = marketSlug
        ? markets.find((m) => m.slug === marketSlug)
        : undefined;
      if (marketSlug && !targeted) {
        console.warn(
          `[gamma:fetchMarketBySlug] sous-marché "${marketSlug}" introuvable dans l'événement "${eventSlug}" (${markets.length} marché(s) disponible(s)) — repli sur le premier`
        );
      }
      const market = toGammaMarket(targeted ?? markets[0]);
      if (!market.category && typeof event.category === "string") {
        market.category = event.category;
      }
      return market;
    }
  }

  const marketsDirect = (await gammaFetch(
    `/markets?slug=${encodeURIComponent(marketSlug ?? eventSlug)}`
  )) as Array<Record<string, unknown>>;

  if (Array.isArray(marketsDirect) && marketsDirect.length > 0) {
    return toGammaMarket(marketsDirect[0]);
  }

  throw new MarketNotFoundError(
    `Aucun marché Polymarket trouvé pour le slug "${eventSlug}"${marketSlug ? ` (sous-marché "${marketSlug}")` : ""}.`
  );
}

/** Splits into lowercase alphanumeric tokens, stripping punctuation stuck to
 * words ("2026?", "$150k", "Fed's") so a word only fails to match because
 * of genuine wording differences — not because a "?" or "$" happened to be
 * attached on one side but not the other. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
}

/** Best-effort keyword search against Polymarket's public search endpoint,
 * used only when an image was provided instead of a link. Returns null when
 * no confident match is found rather than guessing.
 *
 * The search endpoint's own relevance ranking is the real bottleneck here:
 * this can only score whatever it returns, so a larger limit_per_type gives
 * a real (if imperfect) vision-read question more chances of surfacing the
 * right event among the candidates in the first place — the scoring below
 * was already reasonably tolerant of imprecise wording. */
export async function searchMarketByText(
  query: string
): Promise<GammaMarket | null> {
  let results: unknown;
  try {
    results = await gammaFetch(
      `/public-search?q=${encodeURIComponent(query)}&events_status=active&limit_per_type=15`
    );
  } catch (error) {
    console.error(
      `[gamma:searchMarketByText] échec de la requête public-search pour "${query}": ${(error as Error).message}`
    );
    return null;
  }

  const events =
    (results as { events?: Array<Record<string, unknown>> })?.events ?? [];
  if (!Array.isArray(events) || events.length === 0) {
    console.warn(
      `[gamma:searchMarketByText] aucun événement retourné par public-search pour "${query}"`
    );
    return null;
  }

  const queryWords = tokenize(query);

  let best: { event: Record<string, unknown>; score: number; title: string } | null =
    null;
  for (const event of events) {
    const title = String(event.title ?? event.question ?? "");
    if (!title) continue;
    const titleWords = tokenize(title);
    const score = queryWords.filter((w) => titleWords.includes(w)).length;
    if (!best || score > best.score) best = { event, score, title };
  }

  const minConfidentMatches = Math.max(2, Math.ceil(queryWords.length * 0.4));
  if (!best || best.score < minConfidentMatches) {
    console.warn(
      `[gamma:searchMarketByText] aucune correspondance confiante pour "${query}" — meilleur candidat: "${best?.title ?? "aucun"}" (score ${best?.score ?? 0}/${minConfidentMatches} requis, ${events.length} candidat(s) examiné(s))`
    );
    return null;
  }

  const markets = (best.event.markets as Array<Record<string, unknown>>) ?? [];
  if (markets.length === 0) {
    console.warn(
      `[gamma:searchMarketByText] événement correspondant trouvé ("${best.title}") mais sans marché associé`
    );
    return null;
  }

  console.log(
    `[gamma:searchMarketByText] correspondance retenue pour "${query}": "${best.title}" (score ${best.score}/${minConfidentMatches})`
  );

  const market = toGammaMarket(markets[0]);
  if (!market.category && typeof best.event.category === "string") {
    market.category = best.event.category as string;
  }
  return market;
}

/** Floor below which a market is considered too thin/obscure to bother
 * scanning — keeps scan-markets focused on markets with real trading
 * activity instead of burning Anthropic calls on noise. */
const MIN_CANDIDATE_VOLUME_USD = 5000;
const MIN_CANDIDATE_LIQUIDITY_USD = 1000;

/**
 * Lists active, open markets for scan-markets to consider, sorted by
 * volume (highest first). Requests the Gamma API's own volume ordering as
 * a hint, but also sorts client-side afterward — the exact set of
 * supported `order` values isn't something this function can verify
 * against live docs from every environment, so the client-side sort is
 * the actual guarantee, not just an optimization.
 */
export async function listCandidateMarkets(fetchLimit: number): Promise<GammaMarket[]> {
  let raw: unknown;
  try {
    raw = await gammaFetch(
      `/markets?active=true&closed=false&order=volume24hr&ascending=false&limit=${fetchLimit}`
    );
  } catch (error) {
    if (error instanceof GammaUnavailableError) throw error;
    throw new GammaUnavailableError(
      `Impossible de lister les marchés Polymarket : ${(error as Error).message}`
    );
  }

  if (!Array.isArray(raw)) return [];

  return (raw as Array<Record<string, unknown>>)
    .map(toGammaMarket)
    .filter(
      (m) =>
        m.active &&
        !m.closed &&
        m.question &&
        m.slug &&
        m.volume >= MIN_CANDIDATE_VOLUME_USD &&
        m.liquidity >= MIN_CANDIDATE_LIQUIDITY_USD
    )
    .sort((a, b) => b.volume - a.volume);
}
