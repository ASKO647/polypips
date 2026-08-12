/**
 * Aggregates are hand-picked to stay internally consistent with the
 * per-market mocks already used on Analyse IA / Marchés sélectionnés
 * (lib/data/analysis.ts, lib/data/markets.ts) and with the "Performance
 * globale" phone mockup on the landing page (186 analyses, 92.2%
 * précision) - same categories, same confidence-to-accuracy direction,
 * category counts sum to the headline total.
 */

export type KeyStats = {
  totalAnalyses: number;
  precision: number;
  averageEdge: number;
  averageOpportunityScore: number;
};

export const KEY_STATS: KeyStats = {
  totalAnalyses: 186,
  precision: 92.2,
  averageEdge: 9.6,
  averageOpportunityScore: 61,
};

export type DecisionSplitData = {
  yesCount: number;
  noCount: number;
  yesAccuracy: number;
  noAccuracy: number;
};

export const DECISION_SPLIT: DecisionSplitData = {
  yesCount: 102,
  noCount: 84,
  yesAccuracy: 93.1,
  noAccuracy: 91.1,
};

export type CategoryStat = {
  category: string;
  analysesCount: number;
  accuracy: number;
  averageEdge: number;
};

export const CATEGORY_STATS: CategoryStat[] = [
  { category: "Crypto", analysesCount: 41, accuracy: 88, averageEdge: 8.4 },
  { category: "LaLiga", analysesCount: 34, accuracy: 95, averageEdge: 11.2 },
  { category: "Économie", analysesCount: 28, accuracy: 94, averageEdge: 10.8 },
  { category: "Tennis", analysesCount: 24, accuracy: 83, averageEdge: 6.5 },
  { category: "NBA", analysesCount: 22, accuracy: 91, averageEdge: 9.6 },
  { category: "Politique US", analysesCount: 19, accuracy: 86, averageEdge: 7.1 },
  { category: "Tech", analysesCount: 18, accuracy: 90, averageEdge: 8.9 },
];

export type EvolutionPeriod = "7j" | "30j" | "tout";

export const ACCURACY_EVOLUTION: Record<EvolutionPeriod, number[]> = {
  "7j": [90, 88, 91, 93, 92, 94, 96],
  "30j": [85, 87, 86, 88, 90, 89, 91, 90, 92, 91, 93, 92, 94, 93],
  tout: [78, 80, 82, 81, 84, 86, 85, 87, 89, 88, 90, 91, 92, 92.2],
};

export type AnalysisOutcome = "Correct" | "Incorrect";

export type ResolvedAnalysis = {
  id: string;
  question: string;
  category: string;
  decision: "YES" | "NO";
  outcome: AnalysisOutcome;
  date: string;
};

export const RESOLVED_ANALYSES: ResolvedAnalysis[] = [
  {
    id: "ra1",
    question: "Le Real Madrid a-t-il battu le FC Barcelone (clasico précédent) ?",
    category: "LaLiga",
    decision: "YES",
    outcome: "Correct",
    date: "3 août",
  },
  {
    id: "ra2",
    question: "Les Lakers se sont-ils qualifiés pour le play-in ?",
    category: "NBA",
    decision: "YES",
    outcome: "Correct",
    date: "1er août",
  },
  {
    id: "ra3",
    question: "Le Bitcoin a-t-il dépassé 95 000 $ en juillet ?",
    category: "Crypto",
    decision: "NO",
    outcome: "Incorrect",
    date: "28 juillet",
  },
  {
    id: "ra4",
    question: "La Fed a-t-elle baissé ses taux en juillet ?",
    category: "Économie",
    decision: "NO",
    outcome: "Correct",
    date: "31 juillet",
  },
  {
    id: "ra5",
    question: "Djokovic s'est-il qualifié pour les quarts à Wimbledon ?",
    category: "Tennis",
    decision: "YES",
    outcome: "Correct",
    date: "10 juillet",
  },
  {
    id: "ra6",
    question: "Apple a-t-elle annoncé un nouveau MacBook en juin ?",
    category: "Tech",
    decision: "NO",
    outcome: "Correct",
    date: "30 juin",
  },
  {
    id: "ra7",
    question: "Le Sénat a-t-il confirmé la nomination contestée en juin ?",
    category: "Politique US",
    decision: "NO",
    outcome: "Incorrect",
    date: "15 juin",
  },
];
