import type { SupabaseClient } from "@supabase/supabase-js";
import type { MarketAnalysis } from "@/lib/data/analysis";
import { formatRelativeTime } from "@/lib/supabase/analyses";

type SelectedMarketRow = {
  id: string;
  question: string;
  category: string;
  scanned_at: string;
  decision: "YES" | "NO";
  ai_probability: number;
  market_probability: number;
  edge: number;
  opportunity_score: number;
  confidence: "Faible" | "Moyenne" | "Élevée";
  explanation: string;
  favorable_factors: string[];
  risks: string[];
  what_could_change: string;
  sources: { name: string; url: string }[];
};

function mapRow(row: SelectedMarketRow): MarketAnalysis {
  return {
    id: row.id,
    question: row.question,
    category: row.category,
    analyzedAt: formatRelativeTime(row.scanned_at),
    decision: row.decision,
    aiProbability: row.ai_probability,
    marketProbability: row.market_probability,
    edge: row.edge,
    opportunityScore: row.opportunity_score,
    confidence: row.confidence,
    explanation: row.explanation,
    favorableFactors: row.favorable_factors,
    risks: row.risks,
    whatCouldChange: row.what_could_change,
    sources: row.sources,
  };
}

/** Reads the AI's own periodically-scanned picks (see the scan-markets
 * Edge Function) — shared across all users, not filtered by user_id. */
export async function fetchSelectedMarkets(
  supabase: SupabaseClient,
  limit = 60
): Promise<MarketAnalysis[]> {
  const { data, error } = await supabase
    .from("selected_markets")
    .select(
      "id, question, category, scanned_at, decision, ai_probability, market_probability, edge, opportunity_score, confidence, explanation, favorable_factors, risks, what_could_change, sources"
    )
    .order("scanned_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as SelectedMarketRow[]).map(mapRow);
}

export async function countSelectedMarkets(supabase: SupabaseClient): Promise<number> {
  const { count } = await supabase
    .from("selected_markets")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}
