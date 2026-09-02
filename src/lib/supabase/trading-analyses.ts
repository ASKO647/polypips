import type { SupabaseClient } from "@supabase/supabase-js";
import { formatRelativeTime } from "@/lib/supabase/analyses";
import type { TradingChartAnalysis, TradingKeyLevel } from "@/lib/data/trading-analysis";

type TradingChartAnalysisRow = {
  id: string;
  created_at: string;
  instrument: string | null;
  timeframe: string | null;
  recommendation: TradingChartAnalysis["recommendation"];
  take_profit: string | null;
  stop_loss: string | null;
  confidence: TradingChartAnalysis["confidence"];
  trend_analysis: string;
  key_levels: TradingKeyLevel[] | null;
  indicators_observed: string[] | null;
  explanation: string;
  risks: string[] | null;
};

const SELECT_COLUMNS =
  "id, created_at, instrument, timeframe, recommendation, take_profit, stop_loss, confidence, trend_analysis, key_levels, indicators_observed, explanation, risks";

function mapRow(row: TradingChartAnalysisRow): TradingChartAnalysis {
  return {
    id: row.id,
    analyzedAt: formatRelativeTime(row.created_at),
    instrument: row.instrument,
    timeframe: row.timeframe,
    recommendation: row.recommendation,
    confidence: row.confidence,
    trendAnalysis: row.trend_analysis,
    keyLevels: row.key_levels ?? [],
    indicatorsObserved: row.indicators_observed ?? [],
    takeProfit: row.take_profit,
    stopLoss: row.stop_loss,
    explanation: row.explanation,
    risks: row.risks ?? [],
  };
}

/** Same role as fetchRecentSportAnalyses — the full history behind
 * "Trading — Mes analyses", newest first. */
export async function fetchRecentTradingAnalyses(
  supabase: SupabaseClient,
  limit = 50
): Promise<TradingChartAnalysis[]> {
  const { data, error } = await supabase
    .from("trading_chart_analyses")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as TradingChartAnalysisRow[]).map(mapRow);
}

/** Same three-helper pattern as analyses.ts / sports-analyses.ts, for the
 * "Trading — Analyse IA" universe's own table (trading_chart_analyses) —
 * its own quota pool, never shared with Polymarket or Sport analyses. */
export async function countTradingAnalysesToday(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("trading_chart_analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) return 0;
  return count ?? 0;
}

export async function fetchTradingAnalysisTimestamps(
  supabase: SupabaseClient,
  userId: string,
  days: number
): Promise<string[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("trading_chart_analyses")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error || !data) return [];
  return data.map((row) => row.created_at as string);
}

export async function countTradingAnalysesAllTime(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("trading_chart_analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) return 0;
  return count ?? 0;
}
