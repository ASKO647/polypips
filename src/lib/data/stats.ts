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

/** "Primary"/"secondary" = the market's first-/second-listed real outcome
 * label (see lib/data/analysis.ts's isPrimaryDecision) — not "yes"/"no":
 * across a mix of markets with different label pairs ("Yes"/"No",
 * "Up"/"Down"...) there's no single meaningful "yes bucket" to count. */
export type DecisionSplitData = {
  primaryCount: number;
  secondaryCount: number;
  primaryAccuracy: number;
  secondaryAccuracy: number;
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
  decision: string;
  outcome: AnalysisOutcome;
  date: string;
};
