import type { SupabaseClient } from "@supabase/supabase-js";
import type { MarketAnalysis } from "@/lib/data/analysis";

type AnalysisRow = {
  id: string;
  question: string;
  category: string;
  created_at: string;
  market_slug: string | null;
  decision: string;
  outcomes: string[] | null;
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

export function formatRelativeTime(isoDate: string): string {
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
    outcomes: row.outcomes ?? [],
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
    marketSlug: row.market_slug,
  };
}

export async function countAnalysesToday(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) return 0;
  return count ?? 0;
}

/** Real timestamps for this user's analyses in the last `days` days — the
 * raw material for the dashboard's "Analyses IA" sparkline (bucketed by
 * bucketCountsByDay) and for windowed activity counts, never a fabricated
 * trend. */
export async function fetchAnalysisTimestamps(
  supabase: SupabaseClient,
  userId: string,
  days: number
): Promise<string[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("analyses")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error || !data) return [];
  return data.map((row) => row.created_at as string);
}

export async function countAnalysesAllTime(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) return 0;
  return count ?? 0;
}

export async function fetchAnalysisById(
  supabase: SupabaseClient,
  id: string
): Promise<MarketAnalysis | null> {
  const { data, error } = await supabase
    .from("analyses")
    .select(
      "id, question, category, created_at, market_slug, decision, outcomes, ai_probability, market_probability, edge, opportunity_score, confidence, explanation, favorable_factors, risks, what_could_change, sources"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as AnalysisRow);
}

export async function fetchRecentAnalyses(
  supabase: SupabaseClient,
  limit = 5
): Promise<MarketAnalysis[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select(
      "id, question, category, created_at, market_slug, decision, outcomes, ai_probability, market_probability, edge, opportunity_score, confidence, explanation, favorable_factors, risks, what_could_change, sources"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as AnalysisRow[]).map(mapRow);
}
