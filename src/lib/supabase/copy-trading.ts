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

const SUGGESTION_SELECT =
  "id, wallet_id, market_question, market_url, side, amount, original_amount, decision, ignore_reason, market_probability, ai_probability, edge, opportunity_score, confidence, status, created_at, tracked_wallets ( label )";

type SuggestionRow = {
  id: string;
  wallet_id: string;
  market_question: string;
  market_url: string;
  side: "YES" | "NO";
  amount: number;
  original_amount: number | null;
  decision: Suggestion["decision"];
  ignore_reason: string | null;
  market_probability: number | null;
  ai_probability: number | null;
  edge: number | null;
  opportunity_score: number | null;
  confidence: string | null;
  status: Suggestion["status"];
  created_at: string;
  tracked_wallets: { label: string } | null;
};

function mapSuggestionRow(row: SuggestionRow): Suggestion {
  return {
    id: row.id,
    walletId: row.wallet_id,
    walletLabel: row.tracked_wallets?.label ?? "Wallet inconnu",
    marketQuestion: row.market_question,
    marketUrl: row.market_url,
    side: row.side,
    amount: Number(row.amount),
    originalAmount: row.original_amount === null ? null : Number(row.original_amount),
    decision: row.decision,
    ignoreReason: row.ignore_reason,
    marketProbability: row.market_probability === null ? null : Number(row.market_probability),
    aiProbability: row.ai_probability === null ? null : Number(row.ai_probability),
    edge: row.edge === null ? null : Number(row.edge),
    opportunityScore: row.opportunity_score === null ? null : Number(row.opportunity_score),
    confidence: row.confidence,
    status: row.status,
    createdAgo: formatRelativeTime(row.created_at),
  };
}

export async function fetchSuggestions(
  supabase: SupabaseClient,
  strategyId: string,
  limit = 30
): Promise<Suggestion[]> {
  const { data, error } = await supabase
    .from("copy_trading_suggestions")
    .select(SUGGESTION_SELECT)
    .eq("strategy_id", strategyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as unknown as SuggestionRow[]).map(mapSuggestionRow);
}

/** Every suggestion across every one of the user's strategies, newest
 * first — the "Mes trades copiés" list, unlike fetchSuggestions above
 * which scopes to a single strategy's own activity feed. Filters directly
 * on copy_trading_suggestions.user_id (present on the row itself, no join
 * through copy_trading_strategies needed) — same shape as
 * fetchSignalCopyTrades for the Fomo/Axiom universe. */
export async function fetchAllSuggestions(
  supabase: SupabaseClient,
  userId: string,
  limit = 60
): Promise<Suggestion[]> {
  const { data, error } = await supabase
    .from("copy_trading_suggestions")
    .select(SUGGESTION_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as unknown as SuggestionRow[]).map(mapSuggestionRow);
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
