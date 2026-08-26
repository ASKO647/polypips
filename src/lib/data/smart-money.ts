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

/** One point of the day-by-day gains/losses chart on Copy Trading's
 * on-demand wallet lookup — net cash flow for that calendar day (sells
 * minus buys, from the live activity feed), not a portfolio-value
 * snapshot. `label` is a pre-formatted date ("DD/MM") for the chart's
 * hover tooltip. */
export type WalletDailyFlowPoint = {
  label: string;
  value: number;
};

/** Result of an on-demand "paste an address" lookup on Copy Trading —
 * always built from a live Polymarket Data API call (see
 * lib/polymarket-data.ts), unlike Wallet above which is a periodically
 * refreshed row from tracked_wallets. Quality-profile fields
 * (winRate/roiPercent/...) are the one exception: those are
 * sync-smart-money's own heuristics computed from historical
 * wallet_snapshots, so they can only be non-null when this address happens
 * to already be a tracked wallet — never computed live. */
export type WalletLookupResult = {
  address: string;
  handle: string;
  totalValue: number;
  positions: WalletPosition[];
  recentMovements: WalletMovement[];
  history: WalletMovement[];
  dailyFlow: WalletDailyFlowPoint[];
  /** The tracked_wallets id, when this address is already tracked — needed
   * so the "Suivre ce wallet" toggle can reflect/act on the real row
   * instead of always behaving as "not yet followed". null for an address
   * nobody has looked up or added before. */
  walletId: string | null;
  isFollowed: boolean;
  winRate: number | null;
  roiPercent: number | null;
  consistencyScore: number | null;
  categoryDiversity: number | null;
  avgPositionSize: number | null;
  riskLevel: WalletRiskLevel | null;
  trackRecordDays: number | null;
};
