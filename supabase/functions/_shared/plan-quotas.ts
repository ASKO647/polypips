import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Per-plan quota numbers, shared by analyze-market, analyze-sport-match
 * and analyze-trading-chart — kept in sync BY HAND with
 * PLAN_METADATA in src/lib/data/pricing.ts, since these Edge Functions run
 * on Deno and can't import from the Next.js app's src tree. No plan is
 * "null" (unlimited) anymore — every tier has a real, generous cap so the
 * guaranteed-margin AI budget below can never be blown by raw volume
 * alone. See pricing.ts's own comment on MONTHLY_AI_BUDGET_EUR_BY_PLAN
 * for why "unlimited" was removed.
 */
export const DAILY_ANALYSIS_LIMITS: Record<string, number | null> = {
  decouverte: 3,
  pro: 10,
  pro_plus: 40,
  ultimate: 80,
  pro_legacy: 40,
};

/**
 * Margin protection — kept in sync BY HAND with
 * MONTHLY_AI_BUDGET_EUR_BY_PLAN in src/lib/data/pricing.ts (same
 * Deno-can't-import-the-Next.js-tree reason as above). null means "no
 * monthly AI spend-cap check for this plan" (decouverte only — its 3/day
 * cap over a 3-day trial already bounds its AI cost to a few cents, see
 * pricing.ts's comment).
 */
export const MONTHLY_AI_BUDGET_EUR_BY_PLAN: Record<string, number | null> = {
  decouverte: null,
  pro: 9.0,
  pro_plus: 15.0,
  ultimate: 24.0,
  pro_legacy: 9.0,
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
