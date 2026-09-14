import type { SupabaseClient } from "@supabase/supabase-js";
import type { SportMatchAnalysis } from "@/lib/data/sports-analysis";
import type { Sport } from "@/lib/sports/types";
import { formatRelativeTime } from "@/lib/supabase/analyses";

type SelectedSportMatchRow = {
  id: string;
  sport: Sport;
  home_team_name: string;
  away_team_name: string;
  competition: string | null;
  kickoff_at: string;
  predicted_winner: string;
  ai_probability: number;
  confidence: "Faible" | "Moyenne" | "Élevée";
  explanation: string;
  favorable_factors: string[];
  risks: string[];
  what_could_change: string;
  secondary_markets: SportMatchAnalysis["secondaryMarkets"];
  scanned_at: string;
};

function mapRow(row: SelectedSportMatchRow): SportMatchAnalysis {
  return {
    id: row.id,
    analyzedAt: formatRelativeTime(row.scanned_at),
    sport: row.sport,
    participants: `${row.home_team_name} vs ${row.away_team_name}`,
    competition: row.competition,
    matchDate: row.kickoff_at,
    predictedWinner: row.predicted_winner,
    aiProbability: row.ai_probability,
    confidence: row.confidence,
    explanation: row.explanation,
    favorableFactors: row.favorable_factors,
    risks: row.risks,
    whatCouldChange: row.what_could_change,
    secondaryMarkets: row.secondary_markets,
  };
}

/** Reads the AI's own periodically-scanned Sport picks (see the
 * scan-sport-matches Edge Function) — shared across all users, not
 * filtered by user_id. Mirrors fetchSelectedMarkets. */
export async function fetchSelectedSportMatches(
  supabase: SupabaseClient,
  limit = 30
): Promise<SportMatchAnalysis[]> {
  const { data, error } = await supabase
    .from("selected_sport_matches")
    .select(
      "id, sport, home_team_name, away_team_name, competition, kickoff_at, predicted_winner, ai_probability, confidence, explanation, favorable_factors, risks, what_could_change, secondary_markets, scanned_at"
    )
    .order("kickoff_at", { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return (data as SelectedSportMatchRow[]).map(mapRow);
}

/** Raw ISO timestamp of the most recent scan-sport-matches write, for the
 * "Prochaine sélection dans" countdown — null until the very first scan
 * has ever run. Mirrors fetchLastMarketsSyncedAt. */
export async function fetchLastSportMatchesSyncedAt(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data } = await supabase
    .from("selected_sport_matches")
    .select("scanned_at")
    .order("scanned_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.scanned_at ?? null;
}
