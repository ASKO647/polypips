/**
 * Real data: rows come from the signal_wallets / signal_wallet_trades
 * tables, refreshed by the sync-signal-wallets Edge Function. This is the
 * Smart Wallets universe — Fomo/Axiom-sourced Solana memecoin wallets —
 * and is deliberately separate from lib/data/smart-money.ts (Polymarket
 * wallets): different chain, different asset class (SPL tokens vs
 * prediction-market positions), different trade shape (BUY/SELL a token
 * vs YES/NO a market). See the 20260827090000 migration's file comment.
 *
 * dataSourceMode is not cosmetic: every wallet returned by
 * sync-signal-wallets today is 'mock' because neither Fomo nor Axiom
 * expose a documented public/commercial API — the frontend must always
 * show a demonstration-data banner when it is, and never let a viewer
 * mistake this for real trading history.
 */

export type SignalSource = "fomo" | "axiom";
export type SignalDataSourceMode = "mock" | "live";
export type SignalRiskLevel = "low" | "medium" | "high";

export type SignalWalletTrade = {
  id: string;
  tokenSymbol: string;
  side: "BUY" | "SELL";
  amountUsd: number;
  price: number | null;
  marketCap: number | null;
  liquidity: number | null;
  volume24h: number | null;
  pnl: number | null;
  tradedAgo: string;
};

export type SignalWalletPosition = {
  tokenSymbol: string;
  side: "BUY" | "SELL";
  amountUsd: number;
  pnl: number | null;
};

export type SignalWallet = {
  id: string;
  address: string;
  shortAddress: string;
  chain: string;
  source: SignalSource;
  label: string;
  dataSourceMode: SignalDataSourceMode;
  winRate: number | null;
  pnl24h: number | null;
  pnl7d: number | null;
  pnl30d: number | null;
  tradesCount: number | null;
  polypipsScore: number | null;
  riskLevel: SignalRiskLevel | null;
  avgHoldTimeMinutes: number | null;
  drawdownPercent: number | null;
  tags: string[];
  positions: SignalWalletPosition[];
  recentTrades: SignalWalletTrade[];
  discoveredAgo: string;
  lastSyncedAt: string | null;
};

export type SignalWinRateFilter = "all" | 45 | 50 | 70 | 85 | 100;

export const SIGNAL_WIN_RATE_FILTERS: { value: SignalWinRateFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: 45, label: "+45 %" },
  { value: 50, label: "+50 %" },
  { value: 70, label: "+70 %" },
  { value: 85, label: "+85 %" },
  { value: 100, label: "100 %" },
];

export const SIGNAL_SOURCE_LABELS: Record<SignalSource, string> = {
  fomo: "Fomo",
  axiom: "Axiom",
};

export type SignalWalletSort = "winRate" | "pnl" | "score" | "activity";

export function shortenSolanaAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
