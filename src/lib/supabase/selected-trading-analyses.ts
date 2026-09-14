import type { SupabaseClient } from "@supabase/supabase-js";
import type { TradingChartAnalysis } from "@/lib/data/trading-analysis";
import { formatRelativeTime } from "@/lib/supabase/analyses";

type SelectedTradingRow = {
  id: string;
  display_symbol: string;
  instrument: string | null;
  timeframe: string | null;
  recommendation: TradingChartAnalysis["recommendation"];
  confidence: TradingChartAnalysis["confidence"];
  trend_analysis: string;
  key_levels: TradingChartAnalysis["keyLevels"];
  indicators_observed: string[];
  take_profit: string | null;
  stop_loss: string | null;
  explanation: string;
  risks: string[];
  scanned_at: string;
};

function mapRow(row: SelectedTradingRow): TradingChartAnalysis {
  return {
    id: row.id,
    analyzedAt: formatRelativeTime(row.scanned_at),
    instrument: row.instrument ?? row.display_symbol,
    timeframe: row.timeframe,
    recommendation: row.recommendation,
    confidence: row.confidence,
    trendAnalysis: row.trend_analysis,
    keyLevels: row.key_levels,
    indicatorsObserved: row.indicators_observed,
    takeProfit: row.take_profit,
    stopLoss: row.stop_loss,
    explanation: row.explanation,
    risks: row.risks,
  };
}

/** Reads the AI's own periodically-scanned Trading picks (see the
 * scan-trading-pairs Edge Function) — shared across all users, not
 * filtered by user_id. Mirrors fetchSelectedMarkets. */
export async function fetchSelectedTradingAnalyses(
  supabase: SupabaseClient,
  limit = 20
): Promise<TradingChartAnalysis[]> {
  const { data, error } = await supabase
    .from("selected_trading_analyses")
    .select(
      "id, display_symbol, instrument, timeframe, recommendation, confidence, trend_analysis, key_levels, indicators_observed, take_profit, stop_loss, explanation, risks, scanned_at"
    )
    .order("display_symbol", { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return (data as SelectedTradingRow[]).map(mapRow);
}

/** Raw ISO timestamp of the most recent scan-trading-pairs write, for the
 * "Prochaine sélection dans" countdown — null until the very first scan
 * has ever run. Mirrors fetchLastMarketsSyncedAt. */
export async function fetchLastTradingSyncedAt(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data } = await supabase
    .from("selected_trading_analyses")
    .select("scanned_at")
    .order("scanned_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.scanned_at ?? null;
}
