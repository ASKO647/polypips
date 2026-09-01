import type { SupabaseClient } from "@supabase/supabase-js";
import { formatRelativeTime } from "@/lib/supabase/analyses";
import type { SportMatchAnalysis } from "@/lib/data/sports-analysis";

type SportsBetAnalysisRow = {
  id: string;
  created_at: string;
  sport: string;
  participants: string;
  competition: string | null;
  match_date: string | null;
  predicted_winner: string | null;
  ai_probability: number;
  confidence: "Faible" | "Moyenne" | "Élevée";
  explanation: string;
  favorable_factors: string[];
  risks: string[];
  what_could_change: string;
  secondary_markets: SportMatchAnalysis["secondaryMarkets"] | null;
};

const SELECT_COLUMNS =
  "id, created_at, sport, participants, competition, match_date, predicted_winner, ai_probability, confidence, explanation, favorable_factors, risks, what_could_change, secondary_markets";

function mapRow(row: SportsBetAnalysisRow): SportMatchAnalysis {
  return {
    id: row.id,
    analyzedAt: formatRelativeTime(row.created_at),
    sport: row.sport as SportMatchAnalysis["sport"],
    participants: row.participants,
    competition: row.competition,
    matchDate: row.match_date ?? row.created_at,
    predictedWinner: row.predicted_winner ?? "",
    aiProbability: row.ai_probability,
    confidence: row.confidence,
    explanation: row.explanation,
    favorableFactors: row.favorable_factors,
    risks: row.risks,
    whatCouldChange: row.what_could_change,
    secondaryMarkets: row.secondary_markets ?? [],
  };
}

/** Only rows from the fixture-prediction era (predicted_winner is set) —
 * an old-era bookmaker-odds row (predicted_winner null) has no fixture
 * behind it and can't be rendered by SportMatchResult, so it's excluded
 * from "Mes analyses" rather than shown broken. */
export async function fetchRecentSportAnalyses(
  supabase: SupabaseClient,
  limit = 20
): Promise<SportMatchAnalysis[]> {
  const { data, error } = await supabase
    .from("sports_bet_analyses")
    .select(SELECT_COLUMNS)
    .not("predicted_winner", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as SportsBetAnalysisRow[]).map(mapRow);
}

export async function countSportAnalysesToday(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("sports_bet_analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) return 0;
  return count ?? 0;
}
