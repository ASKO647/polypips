import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Per-plan quota numbers, shared by analyze-market, analyze-sport-match,
 * analyze-trading-chart and coach-chat — kept in sync BY HAND with
 * PLAN_METADATA in src/lib/data/pricing.ts, since these Edge Functions run
 * on Deno and can't import from the Next.js app's src tree. null means
 * unlimited.
 */
export const DAILY_ANALYSIS_LIMITS: Record<string, number | null> = {
  decouverte: 10,
  pro: 10,
  pro_plus: null,
  ultimate: null,
  pro_legacy: null,
};

export const WEEKLY_COACH_MESSAGE_LIMITS: Record<string, number | null> = {
  decouverte: 20,
  pro: 20,
  pro_plus: null,
  ultimate: null,
  pro_legacy: null,
};

/**
 * Standard (non-"deep") AI analyses share ONE combined daily quota across
 * all 3 universes for the Pro/decouverte tiers — 10/day total, not 10/day
 * per universe — per the confirmed 3-tier product spec. Each analyze-*
 * Edge Function calls this instead of counting only its own table, so a
 * user can't get 30/day by spreading requests across Polymarket, Sport
 * and Trading. Deep Analysis (credit-gated) never counts toward this,
 * same as before — callers only reach this when depth === "standard".
 *
 * Runs with the caller's own JWT (RLS-scoped to their own rows), same
 * posture as the rest of each Edge Function's own quota check.
 */
export async function countCombinedDailyAnalyses(
  authHeader: string,
  userId: string
): Promise<number> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [analyses, sportsBetAnalyses, tradingChartAnalyses] = await Promise.all([
    supabase
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since),
    supabase
      .from("sports_bet_analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since),
    supabase
      .from("trading_chart_analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since),
  ]);

  return (
    (analyses.count ?? 0) + (sportsBetAnalyses.count ?? 0) + (tradingChartAnalyses.count ?? 0)
  );
}
