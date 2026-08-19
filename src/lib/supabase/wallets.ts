import type { SupabaseClient } from "@supabase/supabase-js";
import type { Wallet, WalletMovement, WalletPosition } from "@/lib/data/smart-money";
import { formatRelativeTime } from "@/lib/supabase/analyses";

export const WALLET_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

type TrackedWalletRow = {
  id: string;
  address: string;
  label: string;
  source: "discovered" | "user_added";
  total_value: number;
  change_percent: number | null;
  active_positions_count: number;
  markets_tracked_count: number;
  positions: WalletPosition[];
  recent_movements: Array<{
    id: string;
    type: "Achat" | "Vente";
    market: string;
    amount: number;
    timestamp: string;
  }>;
  last_synced_at: string | null;
  win_rate: number | null;
  roi_percent: number | null;
  consistency_score: number | null;
  category_diversity: number | null;
  avg_position_size: number | null;
  risk_level: "low" | "medium" | "high" | null;
  track_record_days: number | null;
};

/** How many of a wallet's fetched movements show under "Mouvements
 * récents" before the rest fall into "Historique" — both sections read
 * from the same underlying activity feed, there's no separate real
 * "history" source. */
const RECENT_MOVEMENTS_SPLIT = 6;

function mapMovement(raw: TrackedWalletRow["recent_movements"][number]): WalletMovement {
  return {
    id: raw.id,
    type: raw.type,
    market: raw.market,
    amount: raw.amount,
    timeAgo: formatRelativeTime(raw.timestamp),
  };
}

function mapWalletRow(row: TrackedWalletRow, chart: number[]): Wallet {
  const movements = (row.recent_movements ?? []).map(mapMovement);
  return {
    id: row.id,
    address: row.address,
    handle: row.label,
    source: row.source,
    totalValue: Number(row.total_value ?? 0),
    changePercent: row.change_percent === null ? null : Number(row.change_percent),
    activePositionsCount: row.active_positions_count ?? 0,
    marketsTrackedCount: row.markets_tracked_count ?? 0,
    chart,
    positions: row.positions ?? [],
    recentMovements: movements.slice(0, RECENT_MOVEMENTS_SPLIT),
    history: movements.slice(RECENT_MOVEMENTS_SPLIT),
    lastSyncedAt: row.last_synced_at,
    winRate: row.win_rate === null ? null : Number(row.win_rate),
    roiPercent: row.roi_percent === null ? null : Number(row.roi_percent),
    consistencyScore: row.consistency_score,
    categoryDiversity: row.category_diversity,
    avgPositionSize: row.avg_position_size === null ? null : Number(row.avg_position_size),
    riskLevel: row.risk_level,
    trackRecordDays: row.track_record_days,
  };
}

/** Fetches the full shared pool of tracked wallets plus which of them the
 * given user follows, sorted by value (highest first). Wallets with no
 * snapshot history yet (not synced) get a flat 2-point chart from their
 * current value rather than an empty/crashing sparkline. */
export async function fetchSmartMoneyData(
  supabase: SupabaseClient,
  userId: string | null
): Promise<{ wallets: Wallet[]; followedWalletIds: Set<string> }> {
  const { data: walletRows, error } = await supabase
    .from("tracked_wallets")
    .select(
      "id, address, label, source, total_value, change_percent, active_positions_count, markets_tracked_count, positions, recent_movements, last_synced_at, win_rate, roi_percent, consistency_score, category_diversity, avg_position_size, risk_level, track_record_days"
    )
    .order("total_value", { ascending: false })
    .limit(60);

  if (error || !walletRows) return { wallets: [], followedWalletIds: new Set() };

  const walletIds = (walletRows as TrackedWalletRow[]).map((w) => w.id);

  const [{ data: snapshotRows }, followedIds] = await Promise.all([
    walletIds.length > 0
      ? supabase
          .from("wallet_snapshots")
          .select("wallet_id, total_value, snapshotted_at")
          .in("wallet_id", walletIds)
          .order("snapshotted_at", { ascending: true })
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    fetchUserFollowedWalletIds(supabase, userId),
  ]);

  const chartsByWallet = new Map<string, number[]>();
  for (const row of (snapshotRows ?? []) as Array<{
    wallet_id: string;
    total_value: number;
  }>) {
    const list = chartsByWallet.get(row.wallet_id) ?? [];
    list.push(Number(row.total_value));
    chartsByWallet.set(row.wallet_id, list);
  }

  const wallets = (walletRows as TrackedWalletRow[]).map((row) => {
    const chart = chartsByWallet.get(row.id) ?? [];
    const safeChart = chart.length >= 2 ? chart : [row.total_value, row.total_value];
    return mapWalletRow(row, safeChart);
  });

  return { wallets, followedWalletIds: followedIds };
}

export async function fetchUserFollowedWalletIds(
  supabase: SupabaseClient,
  userId: string | null
): Promise<Set<string>> {
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from("user_wallet_follows")
    .select("wallet_id")
    .eq("user_id", userId);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.wallet_id as string));
}

/** Real follow timestamps for this user in the last `days` days — powers
 * the "Smart Money" dashboard sparkline the same way analysis timestamps
 * do, and windowed activity counts for the activity donut. */
export async function fetchWalletFollowTimestamps(
  supabase: SupabaseClient,
  userId: string,
  days: number
): Promise<string[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("user_wallet_follows")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error || !data) return [];
  return data.map((row) => row.created_at as string);
}

export async function countFollowedWallets(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("user_wallet_follows")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}
