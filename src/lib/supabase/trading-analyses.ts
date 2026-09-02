import type { SupabaseClient } from "@supabase/supabase-js";

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
