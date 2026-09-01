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
  /** Present when this market is one option inside a grouped multi-outcome
   * event (e.g. "Donald Trump" inside the "Presidential Election Winner"
   * event's per-candidate Yes/No sub-markets) — Gamma's own clean label for
   * that option, distinct from the sub-market's own Yes/No question text.
   * Absent for a plain standalone (or true binary, e.g. Up/Down) market. */
  groupItemTitle?: string;
  /** The parent event's own slug, from the market object's own `events`
   * array (every Gamma market belongs to exactly one event, even a
   * standalone one). Needed to build a real, always-resolving Polymarket
   * URL: for a sub-market of a multi-outcome event, market.slug is the
   * CANDIDATE's own slug, not the event's — `/event/{market.slug}` alone
   * 404s for that case (see marketPageUrl). Falls back to market.slug
   * itself when Gamma didn't return an events array (the same page either
   * way for a standalone market, where the two slugs are equal). */
  eventSlug: string;
};

/** A single market resolved to one specific, analyzable outcome pair (the
 * existing, still-default case: Yes/No, Up/Down, or one explicitly-named
 * sub-market of a grouped event). */
export type ResolvedMarket = { kind: "single"; market: GammaMarket };

/** A grouped event with more than two real options (e.g. "who wins the
 * election") where no single option was targeted — pasting the event's own
 * link, or a screenshot of its overview rather than one candidate's row.
 * Silently picking markets[0] here (the previous behavior) produces a
 * nonsensical Yes/No verdict about an arbitrary candidate; this case must
 * be handed to the dedicated multi-candidate analysis path instead. */
export type MultiCandidateEvent = {
  kind: "multi";
  eventSlug: string;
  eventTitle: string;
  candidates: GammaMarket[];
};

export type MarketResolution = ResolvedMarket | MultiCandidateEvent;

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

/** Best-effort read of a market's own parent-event slug from its `events`
 * array (present on results from the flat /markets listing, which — unlike
 * fetchMarketBySlug/searchMarketByText — has no already-known event to pull
 * from). Falls back to the market's own slug when absent, matching how a
 * standalone market's two slugs are the same page anyway. */
function eventSlugFromRawMarket(raw: Record<string, unknown>): string {
  const events = raw.events;
  if (Array.isArray(events) && events.length > 0) {
    const first = events[0] as Record<string, unknown>;
    if (typeof first.slug === "string" && first.slug) return first.slug;
  }
  return String(raw.slug ?? "");
}

function toGammaMarket(raw: Record<string, unknown>, eventSlugHint?: string): GammaMarket {
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
    groupItemTitle: typeof raw.groupItemTitle === "string" && raw.groupItemTitle ? raw.groupItemTitle : undefined,
    eventSlug: eventSlugHint ?? eventSlugFromRawMarket(raw),
  };
}

/** The real, always-resolving Polymarket page for a market: the parent
 * event's own URL, with the market's own slug appended only when it's a
 * distinct sub-market (a grouped multi-outcome event's specific
 * candidate) — appending it for a standalone market, where the two slugs
 * are identical, would just duplicate the segment. */
export function marketPageUrl(market: GammaMarket): string {
  const base = market.eventSlug || market.slug;
  return market.slug && market.slug !== base
    ? `https://polymarket.com/event/${base}/${market.slug}`
    : `https://polymarket.com/event/${base}`;
}

/** More than 2 sub-markets, each with its own real groupItemTitle, is
 * Polymarket's own signal for "this is a multi-candidate/multi-option
 * event" (a true binary event — even an unusually-worded one — is always
 * exactly 2 markets). Fewer than 3 labeled markets is treated as the
 * regular single-market case rather than risk misclassifying a genuine
 * binary market as "multi" over a data quirk. */
function isMultiCandidateEvent(markets: Array<Record<string, unknown>>): boolean {
  if (markets.length <= 2) return false;
  return markets.every((m) => typeof m.groupItemTitle === "string" && m.groupItemTitle);
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
): Promise<MarketResolution> {
  const events = (await gammaFetch(
    `/events?slug=${encodeURIComponent(eventSlug)}`
  )) as Array<Record<string, unknown>>;

  if (Array.isArray(events) && events.length > 0) {
    const event = events[0];
    const markets = (event.markets as Array<Record<string, unknown>>) ?? [];
    if (markets.length > 0) {
      // A URL that names a specific sub-market (multi-outcome event) picks
      // that exact one — analyzable on its own regardless of how many
      // other candidates the event has.
      const targeted = marketSlug ? markets.find((m) => m.slug === marketSlug) : undefined;
      if (marketSlug && !targeted) {
        console.warn(
          `[gamma:fetchMarketBySlug] sous-marché "${marketSlug}" introuvable dans l'événement "${eventSlug}" (${markets.length} marché(s) disponible(s))`
        );
      }
      if (targeted) {
        const market = toGammaMarket(targeted, eventSlug);
        if (!market.category && typeof event.category === "string") {
          market.category = event.category;
        }
        return { kind: "single", market };
      }
      // No specific sub-market named (a link to the event's own overview
      // page, or an unresolved sub-market slug): a genuine multi-candidate
      // event (>2 labeled options) must go to the dedicated flow instead of
      // silently defaulting to an arbitrary candidate — see
      // isMultiCandidateEvent's comment.
      if (isMultiCandidateEvent(markets)) {
        return {
          kind: "multi",
          eventSlug,
          eventTitle: String(event.title ?? event.question ?? eventSlug),
          candidates: markets.map((m) => toGammaMarket(m, eventSlug)),
        };
      }
      const market = toGammaMarket(markets[0], eventSlug);
      if (!market.category && typeof event.category === "string") {
        market.category = event.category;
      }
      return { kind: "single", market };
    }
  }

  const marketsDirect = (await gammaFetch(
    `/markets?slug=${encodeURIComponent(marketSlug ?? eventSlug)}`
  )) as Array<Record<string, unknown>>;

  if (Array.isArray(marketsDirect) && marketsDirect.length > 0) {
    return { kind: "single", market: toGammaMarket(marketsDirect[0]) };
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
): Promise<MarketResolution | null> {
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

  const eventSlug = String(best.event.slug ?? "");
  const eventCategory = typeof best.event.category === "string" ? best.event.category : undefined;

  // A screenshot naming one specific candidate (its own row, own price) —
  // e.g. "Will Donald Trump win the presidency?" — must resolve to THAT
  // candidate, not an arbitrary one, so score the extracted text against
  // each sub-market's own question/groupItemTitle before falling back to
  // "this is a general multi-candidate query" (see isMultiCandidateEvent's
  // comment for why silently defaulting to markets[0] instead produces a
  // nonsensical Yes/No verdict about the wrong candidate).
  if (markets.length > 1) {
    let bestSub: { market: Record<string, unknown>; score: number } | null = null;
    for (const m of markets) {
      const label = String(m.groupItemTitle ?? m.question ?? "");
      if (!label) continue;
      const labelWords = tokenize(label);
      const score = queryWords.filter((w) => labelWords.includes(w)).length;
      if (!bestSub || score > bestSub.score) bestSub = { market: m, score };
    }
    const minSubMatches = Math.max(1, Math.ceil(queryWords.length * 0.3));
    if (bestSub && bestSub.score >= minSubMatches) {
      const market = toGammaMarket(bestSub.market, eventSlug);
      if (!market.category && eventCategory) market.category = eventCategory;
      console.log(
        `[gamma:searchMarketByText] correspondance retenue pour "${query}": candidat "${market.groupItemTitle ?? market.question}" de l'événement "${best.title}" (score ${bestSub.score}/${minSubMatches})`
      );
      return { kind: "single", market };
    }
  }

  if (isMultiCandidateEvent(markets)) {
    console.log(
      `[gamma:searchMarketByText] correspondance retenue pour "${query}": événement multi-candidats "${best.title}" (aucun candidat spécifique identifié, ${markets.length} candidats)`
    );
    return {
      kind: "multi",
      eventSlug,
      eventTitle: best.title,
      candidates: markets.map((m) => toGammaMarket(m, eventSlug)),
    };
  }

  console.log(
    `[gamma:searchMarketByText] correspondance retenue pour "${query}": "${best.title}" (score ${best.score}/${minConfidentMatches})`
  );

  const market = toGammaMarket(markets[0], eventSlug);
  if (!market.category && eventCategory) {
    market.category = eventCategory;
  }
  return { kind: "single", market };
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
 *
 * `maxEndDate`, when given, is passed to Gamma as an `end_date_max` hint
 * (server-side narrowing, so a short-horizon request doesn't have to hope
 * enough near-term markets happen to land in the top-`fetchLimit`-by-volume
 * sample) — but same as the ordering, the caller must still filter the
 * result on the real endDate itself; this is a hint to fetch a more useful
 * sample, not a guarantee every returned market qualifies.
 */
export async function listCandidateMarkets(
  fetchLimit: number,
  maxEndDate?: Date
): Promise<GammaMarket[]> {
  let raw: unknown;
  try {
    const endDateParam = maxEndDate
      ? `&end_date_max=${encodeURIComponent(maxEndDate.toISOString())}`
      : "";
    raw = await gammaFetch(
      `/markets?active=true&closed=false&order=volume24hr&ascending=false&limit=${fetchLimit}${endDateParam}`
    );
  } catch (error) {
    if (error instanceof GammaUnavailableError) throw error;
    throw new GammaUnavailableError(
      `Impossible de lister les marchés Polymarket : ${(error as Error).message}`
    );
  }

  if (!Array.isArray(raw)) return [];

  return (raw as Array<Record<string, unknown>>)
    .map((m) => toGammaMarket(m))
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
