/** Dexscreener's public search endpoint — free, keyless, used only to
 * enrich the "Top tokens mentionnés" panel with a real 24h price change
 * for tokens PolyPips has actually seen mentioned (never to invent a
 * mention count itself, which always comes from pips_track_events).
 * Isolated in its own module so it can be swapped for Birdeye or dropped
 * entirely without touching the rest of the feature. */
const DEXSCREENER_SEARCH_URL = "https://api.dexscreener.com/latest/dex/search";

type DexscreenerPair = {
  chainId?: string;
  baseToken?: { symbol?: string };
  priceChange?: { h24?: number };
  info?: { imageUrl?: string };
};

export type TokenEnrichment = { changePercent: number | null; logoUrl: string | null };

const NO_MATCH: TokenEnrichment = { changePercent: null, logoUrl: null };

/** Returns null fields when the symbol has no resolvable Solana pair —
 * expected and normal for demo/mock token symbols, never treated as an
 * error worth surfacing to the user. */
export async function enrichTokenWithDexscreener(tokenSymbol: string): Promise<TokenEnrichment> {
  try {
    const response = await fetch(`${DEXSCREENER_SEARCH_URL}?q=${encodeURIComponent(tokenSymbol)}`, {
      next: { revalidate: 30 },
    });
    if (!response.ok) return NO_MATCH;
    const data = (await response.json()) as { pairs?: DexscreenerPair[] };
    const pair = (data.pairs ?? []).find(
      (p) => p.chainId === "solana" && p.baseToken?.symbol?.toUpperCase() === tokenSymbol.toUpperCase()
    );
    if (!pair) return NO_MATCH;
    return {
      changePercent: typeof pair.priceChange?.h24 === "number" ? pair.priceChange.h24 : null,
      logoUrl: pair.info?.imageUrl ?? null,
    };
  } catch {
    return NO_MATCH;
  }
}
