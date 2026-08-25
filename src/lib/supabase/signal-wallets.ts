import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SignalSource,
  SignalWallet,
  SignalWalletPosition,
  SignalWalletTrade,
} from "@/lib/data/signal-wallets";
import { shortenSolanaAddress } from "@/lib/data/signal-wallets";
import { formatRelativeTime } from "@/lib/supabase/analyses";

type SignalWalletRow = {
  id: string;
  address: string;
  chain: string;
  source: SignalSource;
  label: string;
  data_source_mode: "mock" | "live";
  win_rate: number | null;
  pnl_24h: number | null;
  pnl_7d: number | null;
  pnl_30d: number | null;
  trades_count: number | null;
  polypips_score: number | null;
  risk_level: "low" | "medium" | "high" | null;
  avg_hold_time_minutes: number | null;
  drawdown_percent: number | null;
  tags: string[];
  positions: SignalWalletPosition[];
  recent_trades: Array<{ tokenSymbol: string; side: "BUY" | "SELL"; amountUsd: number; tradedAt: string }>;
  discovered_at: string;
  last_synced_at: string | null;
};

function mapWalletRow(row: SignalWalletRow): SignalWallet {
  return {
    id: row.id,
    address: row.address,
    shortAddress: shortenSolanaAddress(row.address),
    chain: row.chain,
    source: row.source,
    label: row.label,
    dataSourceMode: row.data_source_mode,
    winRate: row.win_rate === null ? null : Number(row.win_rate),
    pnl24h: row.pnl_24h === null ? null : Number(row.pnl_24h),
    pnl7d: row.pnl_7d === null ? null : Number(row.pnl_7d),
    pnl30d: row.pnl_30d === null ? null : Number(row.pnl_30d),
    tradesCount: row.trades_count,
    polypipsScore: row.polypips_score,
    riskLevel: row.risk_level,
    avgHoldTimeMinutes: row.avg_hold_time_minutes,
    drawdownPercent: row.drawdown_percent === null ? null : Number(row.drawdown_percent),
    tags: row.tags ?? [],
    positions: row.positions ?? [],
    recentTrades: (row.recent_trades ?? []).map((t, i) => ({
      id: `${row.id}-recent-${i}`,
      tokenSymbol: t.tokenSymbol,
      side: t.side,
      amountUsd: Number(t.amountUsd),
      price: null,
      marketCap: null,
      liquidity: null,
      volume24h: null,
      pnl: null,
      tradedAgo: formatRelativeTime(t.tradedAt),
    })),
    discoveredAgo: formatRelativeTime(row.discovered_at),
    lastSyncedAt: row.last_synced_at,
  };
}

const WALLET_SELECT =
  "id, address, chain, source, label, data_source_mode, win_rate, pnl_24h, pnl_7d, pnl_30d, trades_count, polypips_score, risk_level, avg_hold_time_minutes, drawdown_percent, tags, positions, recent_trades, discovered_at, last_synced_at";

export async function fetchSignalWallets(supabase: SupabaseClient): Promise<SignalWallet[]> {
  const { data, error } = await supabase
    .from("signal_wallets")
    .select(WALLET_SELECT)
    .order("polypips_score", { ascending: false, nullsFirst: false })
    .limit(100);

  if (error || !data) {
    if (error) console.error("[signal-wallets] fetchSignalWallets failed", error);
    return [];
  }

  return (data as unknown as SignalWalletRow[]).map(mapWalletRow);
}

export async function fetchSignalWalletById(
  supabase: SupabaseClient,
  walletId: string
): Promise<SignalWallet | null> {
  const { data, error } = await supabase
    .from("signal_wallets")
    .select(WALLET_SELECT)
    .eq("id", walletId)
    .maybeSingle();

  if (error || !data) return null;
  return mapWalletRow(data as unknown as SignalWalletRow);
}

export async function fetchSignalWalletTrades(
  supabase: SupabaseClient,
  walletId: string,
  limit = 40
): Promise<SignalWalletTrade[]> {
  const { data, error } = await supabase
    .from("signal_wallet_trades")
    .select("id, token_symbol, side, amount_usd, price, market_cap, liquidity, volume_24h, pnl, traded_at")
    .eq("wallet_id", walletId)
    .order("traded_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    tokenSymbol: row.token_symbol as string,
    side: row.side as "BUY" | "SELL",
    amountUsd: Number(row.amount_usd),
    price: row.price === null ? null : Number(row.price),
    marketCap: row.market_cap === null ? null : Number(row.market_cap),
    liquidity: row.liquidity === null ? null : Number(row.liquidity),
    volume24h: row.volume_24h === null ? null : Number(row.volume_24h),
    pnl: row.pnl === null ? null : Number(row.pnl),
    tradedAgo: formatRelativeTime(row.traded_at as string),
  }));
}

export async function fetchUserFollowedSignalWalletIds(
  supabase: SupabaseClient,
  userId: string | null
): Promise<Set<string>> {
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from("user_signal_wallet_follows")
    .select("wallet_id")
    .eq("user_id", userId);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.wallet_id as string));
}
