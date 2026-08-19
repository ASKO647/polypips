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

export type WalletRiskLevel = "low" | "medium" | "high";

export type Wallet = {
  id: string;
  address: string;
  handle: string;
  source: WalletSource;
  totalValue: number;
  /** null when there isn't yet a second wallet_snapshots data point to
   * compare against — render as a neutral state, not as 0%. */
  changePercent: number | null;
  activePositionsCount: number;
  marketsTrackedCount: number;
  chart: number[];
  positions: WalletPosition[];
  recentMovements: WalletMovement[];
  history: WalletMovement[];
  lastSyncedAt: string | null;
  /** Quality profile computed by sync-smart-money on each refresh — all
   * null until the wallet has synced at least once. See that function's
   * computeWalletQuality() for the (documented, original) heuristics
   * behind riskLevel and consistencyScore. */
  winRate: number | null;
  roiPercent: number | null;
  consistencyScore: number | null;
  categoryDiversity: number | null;
  avgPositionSize: number | null;
  riskLevel: WalletRiskLevel | null;
  trackRecordDays: number | null;
};
