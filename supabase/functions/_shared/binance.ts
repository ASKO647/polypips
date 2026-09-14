/**
 * Client for Binance's public Market Data REST API
 * (https://developers.binance.com/docs/binance-spot-api-docs/rest-api) —
 * used by scan-trading-pairs to feed the Trading universe's automated
 * "Sélection du jour" with real OHLC candle data instead of a
 * user-uploaded screenshot. Deliberately the /api/v3/klines endpoint only:
 * it's public (no API key, no signature), free, and has no documented
 * per-IP rate limit tight enough to matter at this scan's volume (a
 * handful of pairs, twice a day).
 *
 * IMPORTANT — unverified against a live response: this sandbox's network
 * egress blocks api.binance.com outright (403 at the proxy layer), so
 * nothing in this file could be exercised against a real request here.
 * The shape below matches Binance's own published API docs (a stable,
 * widely-used public format, not guessed) — but confirm with one manual
 * curl against a real deploy before relying on it, same caution this
 * codebase already applies to _shared/api-sports.ts and
 * _shared/odds-api.ts for the same reason.
 */

export class BinanceUnavailableError extends Error {}

const HOST = "api.binance.com";

/** Binance's supported kline intervals — only the ones this app actually
 * requests are listed, not the full enum, so a typo elsewhere is a type
 * error rather than a silent 400 from the API. */
export type BinanceInterval = "1h" | "4h" | "1d";

export type Candle = {
  openTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: string;
};

/** GET /api/v3/klines — up to `limit` most recent candles for `symbol`
 * (e.g. "BTCUSDT") at the given interval, oldest first (Binance's own
 * order). Each raw row is a 12-element array
 * `[openTime, open, high, low, close, volume, closeTime, quoteAssetVolume,
 * numberOfTrades, takerBuyBaseVolume, takerBuyQuoteVolume, ignore]` with
 * every numeric OHLCV field returned as a string — parsed to number here
 * so callers never have to think about that. A row that doesn't parse
 * cleanly is skipped rather than fabricated, same defensive posture as
 * _shared/api-sports.ts's parseScheduleItems. */
export async function fetchKlines(
  symbol: string,
  interval: BinanceInterval,
  limit: number
): Promise<Candle[]> {
  let response: Response;
  try {
    response = await fetch(
      `https://${HOST}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`
    );
  } catch (error) {
    throw new BinanceUnavailableError(
      `Impossible de contacter ${HOST} pour ${symbol} : ${(error as Error).message}`
    );
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new BinanceUnavailableError(
      `Binance a répondu avec le statut ${response.status} pour ${symbol}${body ? ` : ${body}` : ""}`
    );
  }

  const json = (await response.json()) as unknown;
  if (!Array.isArray(json)) {
    throw new BinanceUnavailableError(`Réponse Binance inattendue pour ${symbol} (pas un tableau).`);
  }

  const candles: Candle[] = [];
  for (const raw of json) {
    if (!Array.isArray(raw) || raw.length < 7) continue;
    const [openTimeMs, open, high, low, close, volume, closeTimeMs] = raw as unknown[];
    const openNum = Number(open);
    const highNum = Number(high);
    const lowNum = Number(low);
    const closeNum = Number(close);
    const volumeNum = Number(volume);
    if (![openNum, highNum, lowNum, closeNum, volumeNum].every(Number.isFinite)) continue;
    candles.push({
      openTime: new Date(Number(openTimeMs)).toISOString(),
      open: openNum,
      high: highNum,
      low: lowNum,
      close: closeNum,
      volume: volumeNum,
      closeTime: new Date(Number(closeTimeMs)).toISOString(),
    });
  }
  return candles;
}
