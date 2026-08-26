/**
 * Client for Polymarket's public Data API (https://data-api.polymarket.com).
 * This is a *different* service from the Gamma API used in analyze-market/
 * gamma.ts — Gamma serves market metadata/pricing, Data API serves
 * wallet-centric data (positions, activity, value, holders).
 *
 * This is a Next.js-side port of supabase/functions/sync-smart-money/
 * polymarket-data.ts — kept in sync deliberately rather than imported,
 * since Edge Functions run on Deno and this runs in the Next.js server
 * runtime; the module itself is plain fetch-based TypeScript with no
 * runtime-specific API, so the two copies are identical in substance. Used
 * by /api/copy-trading/wallet-lookup for an on-demand, single-address
 * lookup (Copy Trading's "coller une adresse" search) — sync-smart-money's
 * own copy stays the batch-refresh path for already-tracked wallets.
 *
 * IMPORTANT — unverified against live docs: this sandbox's network egress
 * blocks data-api.polymarket.com, so none of the field names or response
 * shapes below could be confirmed against a live response. They're the
 * best available understanding of this API. Every function here parses
 * defensively (tries several plausible field names, coerces types, never
 * throws on a shape it doesn't recognize) so a drift in the real API
 * degrades a single lookup instead of crashing the request.
 */

const DATA_API_BASE = "https://data-api.polymarket.com";

export class DataApiUnavailableError extends Error {}

export const WALLET_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export type WalletPosition = {
  id: string;
  market: string;
  side: "YES" | "NO";
  amount: number;
  pnl: number;
};

export type WalletMovement = {
  id: string;
  type: "Achat" | "Vente";
  market: string;
  marketSlug: string | null;
  amount: number;
  side: "YES" | "NO";
  txHash: string;
  timestamp: string;
  /** Price paid for the outcome share, 0-1 (e.g. 0.43 = 43¢) — same
   * unverified-shape caveat as the rest of this file. null when absent or
   * unparseable. */
  entryPrice: number | null;
};

async function dataApiFetch(path: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${DATA_API_BASE}${path}`, {
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    throw new DataApiUnavailableError(
      `Impossible de contacter l'API Data Polymarket : ${(error as Error).message}`
    );
  }
  if (!response.ok) {
    throw new DataApiUnavailableError(
      `L'API Data Polymarket a répondu avec le statut ${response.status}`
    );
  }
  return response.json();
}

function toSide(raw: unknown): "YES" | "NO" {
  const s = String(raw ?? "").toUpperCase();
  return s === "NO" ? "NO" : "YES";
}

/** Current open positions for a wallet, largest first. Returns [] (rather
 * than throwing) on any failure so one bad address doesn't break the whole
 * lookup. Assumed endpoint: GET /positions?user=<address> */
export async function fetchWalletPositions(address: string): Promise<WalletPosition[]> {
  try {
    const raw = await dataApiFetch(
      `/positions?user=${address}&sizeThreshold=1&limit=50`
    );
    if (!Array.isArray(raw)) return [];

    return (raw as Array<Record<string, unknown>>)
      .map((p, i) => {
        const amount = Number(p.currentValue ?? p.initialValue ?? p.size ?? 0);
        const pnl = Number(p.cashPnl ?? p.realizedPnl ?? p.pnl ?? 0);
        const market = String(p.title ?? p.question ?? p.market ?? "Marché inconnu");
        return {
          id: String(p.asset ?? p.conditionId ?? `${address}-pos-${i}`),
          market,
          side: toSide(p.outcome),
          amount: Number.isFinite(amount) ? amount : 0,
          pnl: Number.isFinite(pnl) ? pnl : 0,
        } satisfies WalletPosition;
      })
      .sort((a, b) => b.amount - a.amount);
  } catch (error) {
    console.error(`[polymarket-data] fetchWalletPositions failed for ${address}`, error);
    return [];
  }
}

/** Recent trade activity for a wallet, most recent first. Assumed
 * endpoint: GET /activity?user=<address>&type=TRADE&limit=<limit> */
export async function fetchWalletActivity(
  address: string,
  limit = 50
): Promise<WalletMovement[]> {
  try {
    const raw = await dataApiFetch(
      `/activity?user=${address}&limit=${limit}&type=TRADE`
    );
    if (!Array.isArray(raw)) return [];

    return (raw as Array<Record<string, unknown>>)
      .filter((a) => typeof a.transactionHash === "string" && a.transactionHash)
      .map((a) => {
        const amount = Number(a.usdcSize ?? a.size ?? a.amount ?? 0);
        const sideRaw = String(a.side ?? "").toUpperCase();
        const rawPrice = a.price;
        const parsedPrice =
          typeof rawPrice === "number"
            ? rawPrice
            : typeof rawPrice === "string"
              ? Number(rawPrice)
              : NaN;
        return {
          id: String(a.transactionHash),
          type: sideRaw === "SELL" ? "Vente" : "Achat",
          market: String(a.title ?? a.question ?? "Marché inconnu"),
          marketSlug:
            typeof a.eventSlug === "string"
              ? a.eventSlug
              : typeof a.slug === "string"
                ? a.slug
                : null,
          amount: Number.isFinite(amount) ? amount : 0,
          side: toSide(a.outcome),
          txHash: String(a.transactionHash),
          timestamp: String(
            a.timestamp
              ? new Date(Number(a.timestamp) * 1000 || Date.parse(String(a.timestamp))).toISOString()
              : new Date().toISOString()
          ),
          entryPrice: Number.isFinite(parsedPrice) && parsedPrice >= 0 && parsedPrice <= 1
            ? parsedPrice
            : null,
        } satisfies WalletMovement;
      });
  } catch (error) {
    console.error(`[polymarket-data] fetchWalletActivity failed for ${address}`, error);
    return [];
  }
}

/** Total current portfolio value for a wallet, in USD. Assumed endpoint:
 * GET /value?user=<address> — response shape is unconfirmed, so this
 * handles both a single object and an array-of-objects response. */
export async function fetchWalletValue(address: string): Promise<number> {
  try {
    const raw = await dataApiFetch(`/value?user=${address}`);
    const entry = Array.isArray(raw) ? raw[0] : raw;
    if (!entry || typeof entry !== "object") return 0;
    const value = Number(
      (entry as Record<string, unknown>).value ??
        (entry as Record<string, unknown>).totalValue ??
        0
    );
    return Number.isFinite(value) ? value : 0;
  } catch (error) {
    console.error(`[polymarket-data] fetchWalletValue failed for ${address}`, error);
    return 0;
  }
}
