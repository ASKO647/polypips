import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskLevel, Strategy, Suggestion } from "@/lib/data/copy-trading";
import { formatRelativeTime } from "@/lib/supabase/analyses";

type FollowedWalletRow = {
  wallet_id: string;
  tracked_wallets: {
    id: string;
    address: string;
    label: string;
    total_value: number;
    win_rate: number | null;
    roi_percent: number | null;
  } | null;
};

type StrategyRow = {
  id: string;
  wallet_id: string;
  status: "active" | "paused";
  max_position_amount: number;
  max_exposure_percent: number;
  max_simultaneous_positions: number;
  max_budget: number;
  risk_level: RiskLevel;
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
      .select(
        "wallet_id, tracked_wallets ( id, address, label, total_value, win_rate, roi_percent )"
      )
      .eq("user_id", userId),
    supabase
      .from("copy_trading_strategies")
      .select(
        "id, wallet_id, status, max_position_amount, max_exposure_percent, max_simultaneous_positions, max_budget, risk_level"
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
        walletWinRate: wallet.win_rate === null ? null : Number(wallet.win_rate),
        walletRoiPercent: wallet.roi_percent === null ? null : Number(wallet.roi_percent),
        strategyId: strategy?.id ?? null,
        status: strategy?.status ?? null,
        riskParameters: strategy
          ? {
              maxBudget: Number(strategy.max_budget),
              maxPositionAmount: Number(strategy.max_position_amount),
              maxExposure: Number(strategy.max_exposure_percent),
              maxSimultaneousPositions: strategy.max_simultaneous_positions,
              riskLevel: strategy.risk_level,
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
    .select(
      "id, market_question, market_url, side, amount, original_amount, decision, ignore_reason, market_probability, ai_probability, edge, opportunity_score, confidence, status, created_at"
    )
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
    originalAmount: row.original_amount === null ? null : Number(row.original_amount),
    decision: row.decision as Suggestion["decision"],
    ignoreReason: row.ignore_reason as string | null,
    marketProbability: row.market_probability === null ? null : Number(row.market_probability),
    aiProbability: row.ai_probability === null ? null : Number(row.ai_probability),
    edge: row.edge === null ? null : Number(row.edge),
    opportunityScore: row.opportunity_score === null ? null : Number(row.opportunity_score),
    confidence: row.confidence as string | null,
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
