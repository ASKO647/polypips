/**
 * Real data: rows come from the tracked_wallets / wallet_snapshots tables,
 * refreshed periodically by the sync-smart-money Edge Function from
 * Polymarket's public Data API. See src/lib/supabase/wallets.ts for the
 * row → type mapping.
 */

/**
 * How often sync-smart-money actually runs. There is no committed
 * cron.schedule() call for it (see the pg_cron migration's own comment —
 * it needs the project's service role key, which can't live in a checked-in
 * migration), so this number can't be read back from the database: it's a
 * plain constant that must be kept in sync by hand with whatever interval
 * was configured for the sync-smart-money cron job in the Supabase
 * dashboard/SQL editor — currently `* * * * *` (every minute). Only used
 * to drive the "Prochains marchés dans" countdown on /dashboard/smart-money
 * — purely cosmetic, doesn't affect when the Edge Function itself actually
 * runs.
 */
export const SYNC_SMART_MONEY_INTERVAL_MINUTES = 1;

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
};
