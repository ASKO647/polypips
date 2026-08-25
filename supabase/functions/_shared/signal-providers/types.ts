/**
 * Shared shape every Smart Wallets data source (Fomo, Axiom, a future
 * on-chain indexer, or the Mock provider used until one of those is
 * actually connected) must produce. The rest of the Smart Wallets feature
 * — sync-signal-wallets, the AI Engine, the Risk Engine, the frontend —
 * depends only on this interface, never on a specific source, so plugging
 * in a real provider later is a matter of implementing SignalProvider, not
 * rewriting the pipeline. See index.ts for how a provider is selected.
 */

export type SignalSource = "fomo" | "axiom";

export type RawSignalWallet = {
  /** On-chain address, base58 for Solana — never a Polymarket-style
   * '0x...' address (see the migration's file comment for why this is a
   * separate table family from tracked_wallets). */
  address: string;
  chain: string;
  source: SignalSource;
  label: string;
  winRate: number | null;
  pnl24h: number | null;
  pnl7d: number | null;
  pnl30d: number | null;
  tradesCount: number | null;
  riskLevel: "low" | "medium" | "high" | null;
  avgHoldTimeMinutes: number | null;
  drawdownPercent: number | null;
  tags: string[];
  positions: Array<{
    tokenSymbol: string;
    side: "BUY" | "SELL";
    amountUsd: number;
    pnl: number | null;
  }>;
};

export type RawSignalTrade = {
  walletAddress: string;
  tokenSymbol: string;
  tokenAddress: string | null;
  side: "BUY" | "SELL";
  amountUsd: number;
  price: number | null;
  marketCap: number | null;
  liquidity: number | null;
  volume24h: number | null;
  pnl: number | null;
  txHash: string;
  tradedAt: string;
};

/** Thrown by a provider stub that has no real integration yet — never
 * caught silently: sync-signal-wallets logs it and falls back to leaving
 * that source's data untouched rather than inventing a substitute. */
export class ProviderNotImplementedError extends Error {}

export interface SignalProvider {
  readonly mode: "mock" | "live";
  /** Discover/refresh the top wallets for this source. */
  fetchWallets(source: SignalSource): Promise<RawSignalWallet[]>;
  /** Fresh trades for the given wallet addresses since their last sync —
   * this is the "détection de nouveaux trades" step the Copy Trading
   * pipeline reacts to. */
  fetchNewTrades(source: SignalSource, walletAddresses: string[]): Promise<RawSignalTrade[]>;
}
