import type { SupabaseClient } from "@supabase/supabase-js";
import { isPrimaryDecision } from "@/lib/data/analysis";
import { formatRelativeTime } from "@/lib/supabase/analyses";
import type {
  CategoryStat,
  DecisionSplitData,
  EvolutionPeriod,
  KeyStats,
  ResolvedAnalysis,
} from "@/lib/data/stats";

/**
 * Real performance tracking, filled in by the resolve-markets Edge
 * Function once a market genuinely closes — never fabricated. Every
 * derived metric here measures the AI's own decision accuracy, not
 * whether the user placed a real bet: "correct" means decision ===
 * resolved_outcome (case-insensitively — see resolve-markets' own
 * labelsMatch), full stop. decision/resolvedOutcome are the market's own
 * real outcome labels (often "Yes"/"No", not always — see
 * lib/data/analysis.ts's isPrimaryDecision), never a hardcoded pair.
 */
export type ResolvedAnalysisRow = {
  id: string;
  question: string;
  category: string;
  decision: string;
  outcomes: string[];
  edge: number;
  opportunityScore: number;
  marketProbability: number;
  resolvedOutcome: string;
  resolvedCorrect: boolean;
  resolvedAt: string;
};

type RawRow = {
  id: string;
  question: string;
  category: string;
  decision: string;
  outcomes: string[] | null;
  edge: number;
  opportunity_score: number;
  market_probability: number;
  resolved_outcome: string;
  resolved_correct: boolean;
  resolved_at: string;
};

export async function fetchResolvedAnalyses(
  supabase: SupabaseClient,
  userId: string
): Promise<ResolvedAnalysisRow[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select(
      "id, question, category, decision, outcomes, edge, opportunity_score, market_probability, resolved_outcome, resolved_correct, resolved_at"
    )
    .eq("user_id", userId)
    .eq("resolved", true)
    .order("resolved_at", { ascending: true });

  if (error || !data) return [];
  return (data as RawRow[]).map((row) => ({
    id: row.id,
    question: row.question,
    category: row.category,
    decision: row.decision,
    outcomes: row.outcomes ?? [],
    edge: Number(row.edge),
    opportunityScore: Number(row.opportunity_score),
    marketProbability: Number(row.market_probability),
    resolvedOutcome: row.resolved_outcome,
    resolvedCorrect: row.resolved_correct,
    resolvedAt: row.resolved_at,
  }));
}

export async function countUnresolvedAnalyses(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("resolved", false);
  if (error) return 0;
  return count ?? 0;
}

/** Theoretical fixed stake used only to illustrate what following every AI
 * decision would have generated — never a real amount the user staked.
 * Every UI surface showing simulatedPnl/simulatedRoi must label them as a
 * simulation based on the AI's own decisions, never as the user's real
 * gains. */
const SIMULATED_STAKE_EUR = 100;

/** Keeps the payout math finite at the extremes — a stored probability of
 * exactly 0% or 100% would otherwise divide by zero. Real Gamma prices
 * essentially never land there, but this is a genuine input from an
 * external API, not internal code, so it's worth guarding explicitly. */
function clampProbabilityFraction(pct: number): number {
  return Math.min(99, Math.max(1, pct)) / 100;
}

/**
 * Real prediction-market payout math (fees/slippage ignored, as befits a
 * "simulation"): buying the decision's side at the market's implied price
 * and holding to resolution. Betting the market's first-listed outcome at
 * price q with stake S buys S/q shares, worth S/q at resolution if right
 * (profit S·(1−q)/q) or 0 if wrong (loss of the full stake S) — symmetric
 * for the second-listed outcome at price (1−q). marketProbability is
 * always the price of the *first-listed* outcome specifically (see
 * anthropic-analysis.ts's SYSTEM_PROMPT — aiProbability, and by extension
 * this stored price, is always about that same reference outcome
 * regardless of which one "decision" ends up picking), at analysis time
 * not at resolution: it's "what it would have cost to act on this call
 * when the AI made it."
 */
export function simulatedPnlForResolvedAnalysis(row: {
  decision: string;
  outcomes: string[];
  marketProbability: number;
  resolvedCorrect: boolean;
}): number {
  const q = clampProbabilityFraction(row.marketProbability);
  if (isPrimaryDecision(row.decision, row.outcomes)) {
    return row.resolvedCorrect
      ? (SIMULATED_STAKE_EUR * (1 - q)) / q
      : -SIMULATED_STAKE_EUR;
  }
  const secondaryPrice = 1 - q;
  return row.resolvedCorrect
    ? (SIMULATED_STAKE_EUR * q) / secondaryPrice
    : -SIMULATED_STAKE_EUR;
}

export type PerformanceStats = {
  resolvedCount: number;
  winRate: number;
  simulatedPnl: number;
  simulatedRoi: number;
};

export function computePerformanceStats(rows: ResolvedAnalysisRow[]): PerformanceStats {
  if (rows.length === 0) {
    return { resolvedCount: 0, winRate: 0, simulatedPnl: 0, simulatedRoi: 0 };
  }
  const correct = rows.filter((r) => r.resolvedCorrect).length;
  const pnl = rows.reduce((sum, r) => sum + simulatedPnlForResolvedAnalysis(r), 0);
  const staked = rows.length * SIMULATED_STAKE_EUR;
  return {
    resolvedCount: rows.length,
    winRate: (correct / rows.length) * 100,
    simulatedPnl: pnl,
    simulatedRoi: (pnl / staked) * 100,
  };
}

/**
 * Cumulative win rate, one point per resolution, in chronological order —
 * the natural x-axis given resolutions land at irregular real-world
 * moments (whenever a market actually closes), not on a fixed daily grid.
 * Filtering `rows` to a period before calling this makes each period's
 * curve start fresh from its own first resolution in that window.
 */
export function computeAccuracyEvolution(rows: ResolvedAnalysisRow[]): number[] {
  let correct = 0;
  return rows.map((row, i) => {
    if (row.resolvedCorrect) correct++;
    return (correct / (i + 1)) * 100;
  });
}

export function computeAccuracyEvolutionPeriods(
  rows: ResolvedAnalysisRow[]
): Record<EvolutionPeriod, number[]> {
  const now = Date.now();
  const within = (days: number) =>
    rows.filter((r) => now - new Date(r.resolvedAt).getTime() <= days * 24 * 60 * 60 * 1000);

  return {
    "7j": computeAccuracyEvolution(within(7)),
    "30j": computeAccuracyEvolution(within(30)),
    tout: computeAccuracyEvolution(rows),
  };
}

export function computeKeyStats(rows: ResolvedAnalysisRow[]): KeyStats {
  if (rows.length === 0) {
    return { totalAnalyses: 0, precision: 0, averageEdge: 0, averageOpportunityScore: 0 };
  }
  const correct = rows.filter((r) => r.resolvedCorrect).length;
  return {
    totalAnalyses: rows.length,
    precision: Math.round((correct / rows.length) * 1000) / 10,
    averageEdge:
      Math.round((rows.reduce((sum, r) => sum + r.edge, 0) / rows.length) * 10) / 10,
    averageOpportunityScore: Math.round(
      rows.reduce((sum, r) => sum + r.opportunityScore, 0) / rows.length
    ),
  };
}

/** "Primary"/"secondary" here means "the market's first-listed outcome" vs
 * "second-listed" (see isPrimaryDecision) — not a semantic yes/no split,
 * since across a mix of markets with different label pairs ("Yes"/"No",
 * "Up"/"Down"...) there's no single meaningful "yes bucket" to pool them
 * into. Position is the one thing every row has in common. */
export function computeDecisionSplit(rows: ResolvedAnalysisRow[]): DecisionSplitData | null {
  const primary = rows.filter((r) => isPrimaryDecision(r.decision, r.outcomes));
  const secondary = rows.filter((r) => !isPrimaryDecision(r.decision, r.outcomes));
  if (primary.length === 0 && secondary.length === 0) return null;
  return {
    primaryCount: primary.length,
    secondaryCount: secondary.length,
    primaryAccuracy:
      primary.length > 0
        ? Math.round((primary.filter((r) => r.resolvedCorrect).length / primary.length) * 100)
        : 0,
    secondaryAccuracy:
      secondary.length > 0
        ? Math.round((secondary.filter((r) => r.resolvedCorrect).length / secondary.length) * 100)
        : 0,
  };
}

export function computeCategoryStats(rows: ResolvedAnalysisRow[]): CategoryStat[] {
  const byCategory = new Map<string, ResolvedAnalysisRow[]>();
  for (const row of rows) {
    const list = byCategory.get(row.category) ?? [];
    list.push(row);
    byCategory.set(row.category, list);
  }

  return Array.from(byCategory.entries())
    .map(([category, categoryRows]) => ({
      category,
      analysesCount: categoryRows.length,
      accuracy: Math.round(
        (categoryRows.filter((r) => r.resolvedCorrect).length / categoryRows.length) * 100
      ),
      averageEdge:
        Math.round(
          (categoryRows.reduce((sum, r) => sum + r.edge, 0) / categoryRows.length) * 10
        ) / 10,
    }))
    .sort((a, b) => b.analysesCount - a.analysesCount);
}

export function toResolvedAnalysisHistory(rows: ResolvedAnalysisRow[]): ResolvedAnalysis[] {
  return [...rows]
    .sort((a, b) => new Date(b.resolvedAt).getTime() - new Date(a.resolvedAt).getTime())
    .map((row) => ({
      id: row.id,
      question: row.question,
      category: row.category,
      decision: row.decision,
      outcome: row.resolvedCorrect ? "Correct" : "Incorrect",
      date: formatRelativeTime(row.resolvedAt),
    }));
}
