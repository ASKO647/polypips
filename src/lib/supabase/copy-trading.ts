import type { SupabaseClient } from "@supabase/supabase-js";
import type { Strategy, Suggestion } from "@/lib/data/copy-trading";
import { formatRelativeTime } from "@/lib/supabase/analyses";

type FollowedWalletRow = {
  wallet_id: string;
  tracked_wallets: { id: string; address: string; label: string; total_value: number } | null;
};

type StrategyRow = {
  id: string;
  wallet_id: string;
  status: "active" | "paused";
  max_position_amount: number;
  max_exposure_percent: number;
  max_simultaneous_positions: number;
};

/** One card per wallet the user follows — some have a configured
 * strategy, some don't yet (strategyId/status/riskParameters stay null
 * until the user configures and activates one). */
export async function fetchStrategies(
  supabase: SupabaseClient,
  userId: string
): Promise<Strategy[]> {
  const [{ data: followedRows }, { data: strategyRows }] = await Promise.all([
    supabase
      .from("user_wallet_follows")
      .select("wallet_id, tracked_wallets ( id, address, label, total_value )")
      .eq("user_id", userId),
    supabase
      .from("copy_trading_strategies")
      .select(
        "id, wallet_id, status, max_position_amount, max_exposure_percent, max_simultaneous_positions"
      )
      .eq("user_id", userId),
  ]);

  const strategyByWallet = new Map(
    ((strategyRows ?? []) as StrategyRow[]).map((s) => [s.wallet_id, s])
  );

  return ((followedRows ?? []) as unknown as FollowedWalletRow[])
    .filter((row) => row.tracked_wallets !== null)
    .map((row) => {
      const wallet = row.tracked_wallets!;
      const strategy = strategyByWallet.get(wallet.id);
      return {
        walletId: wallet.id,
        walletLabel: wallet.label,
        walletAddress: wallet.address,
        walletTotalValue: Number(wallet.total_value ?? 0),
        strategyId: strategy?.id ?? null,
        status: strategy?.status ?? null,
        riskParameters: strategy
          ? {
              maxPositionAmount: Number(strategy.max_position_amount),
              maxExposure: Number(strategy.max_exposure_percent),
              maxSimultaneousPositions: strategy.max_simultaneous_positions,
            }
          : null,
      } satisfies Strategy;
    });
}

export async function fetchSuggestions(
  supabase: SupabaseClient,
  strategyId: string,
  limit = 30
): Promise<Suggestion[]> {
  const { data, error } = await supabase
    .from("copy_trading_suggestions")
    .select("id, market_question, market_url, side, amount, status, created_at")
    .eq("strategy_id", strategyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    marketQuestion: row.market_question as string,
    marketUrl: row.market_url as string,
    side: row.side as "YES" | "NO",
    amount: Number(row.amount),
    status: row.status as Suggestion["status"],
    createdAgo: formatRelativeTime(row.created_at as string),
  }));
}

export async function countActiveStrategies(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("copy_trading_strategies")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");
  return count ?? 0;
}
