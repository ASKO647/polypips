/**
 * Types only — real values come from lib/supabase/performance.ts, computed
 * from resolved analyses (see resolve-markets). There is deliberately no
 * mock data left in this file: /dashboard/stats shows an honest empty
 * state until a user has at least one resolved analysis, never a
 * plausible-looking fabricated number.
 */

export type KeyStats = {
  totalAnalyses: number;
  precision: number;
  averageEdge: number;
  averageOpportunityScore: number;
};

export type DecisionSplitData = {
  yesCount: number;
  noCount: number;
  yesAccuracy: number;
  noAccuracy: number;
};

export type CategoryStat = {
  category: string;
  analysesCount: number;
  accuracy: number;
  averageEdge: number;
};

export type EvolutionPeriod = "7j" | "30j" | "tout";

export type AnalysisOutcome = "Correct" | "Incorrect";

export type ResolvedAnalysis = {
  id: string;
  question: string;
  category: string;
  decision: "YES" | "NO";
  outcome: AnalysisOutcome;
  date: string;
};
