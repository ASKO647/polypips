import type { SupabaseClient } from "@supabase/supabase-js";
import type { MarketAnalysis } from "@/lib/data/analysis";

type AnalysisRow = {
  id: string;
  question: string;
  category: string;
  created_at: string;
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

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("fr-FR", {
  numeric: "auto",
});

function formatRelativeTime(isoDate: string): string {
  const diffMs = new Date(isoDate).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 1) return "À l'instant";
  if (Math.abs(diffMinutes) < 60) {
    return RELATIVE_TIME_FORMATTER.format(diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return RELATIVE_TIME_FORMATTER.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  return RELATIVE_TIME_FORMATTER.format(diffDays, "day");
}

function mapRow(row: AnalysisRow): MarketAnalysis {
  return {
    id: row.id,
    question: row.question,
    category: row.category,
    analyzedAt: formatRelativeTime(row.created_at),
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

export async function fetchRecentAnalyses(
  supabase: SupabaseClient,
  limit = 5
): Promise<MarketAnalysis[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select(
      "id, question, category, created_at, decision, ai_probability, market_probability, edge, opportunity_score, confidence, explanation, favorable_factors, risks, what_could_change, sources"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as AnalysisRow[]).map(mapRow);
}
