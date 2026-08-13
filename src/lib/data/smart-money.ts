/**
 * Real data: rows come from the tracked_wallets / wallet_snapshots tables,
 * refreshed periodically by the sync-smart-money Edge Function from
 * Polymarket's public Data API. See src/lib/supabase/wallets.ts for the
 * row → type mapping.
 */

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
  amount: number;
  timeAgo: string;
};

export type WalletSource = "discovered" | "user_added";

export type Wallet = {
  id: string;
  address: string;
  handle: string;
  source: WalletSource;
  totalValue: number;
  changePercent: number;
  activePositionsCount: number;
  marketsTrackedCount: number;
  chart: number[];
  positions: WalletPosition[];
  recentMovements: WalletMovement[];
  history: WalletMovement[];
  lastSyncedAt: string | null;
};
