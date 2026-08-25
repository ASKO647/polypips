/**
 * Shape returned by the analyze-sports-bet Edge Function, and mirrored by
 * the `sports_bet_analyses` Supabase table for history. This is the Sport
 * universe's own "Analyse IA" — a real-world sports bet at any bookmaker,
 * never a Polymarket market. Deliberately not sharing types with
 * lib/data/analysis.ts (Polymarket's own Analyse IA) beyond the plain
 * ConfidenceLevel value type, which carries no Polymarket-specific
 * meaning.
 */
import type { ConfidenceLevel } from "@/lib/data/analysis";

export type { ConfidenceLevel };

export type SportBetAnalysis = {
  id: string;
  analyzedAt: string;
  sport: string;
  participants: string;
  betType: string;
  selection: string;
  bookmakerOdds: string;
  aiProbability: number;
  bookmakerImpliedProbability: number;
  edge: number;
  confidence: ConfidenceLevel;
  explanation: string;
  favorableFactors: string[];
  risks: string[];
  whatCouldChange: string;
};

export type SportsBetInput = {
  sport: string;
  participants: string;
  betType: string;
  selection: string;
  bookmakerOdds: string;
};

export type SportsAnalysisProgressStep = "reading_bet" | "calling_ai" | "receiving_result";

export const SPORTS_ANALYSIS_LOADING_STEPS: Record<SportsAnalysisProgressStep, string> = {
  reading_bet: "Lecture des informations du pari...",
  calling_ai: "Envoi à l'IA pour analyse...",
  receiving_result: "Réception de l'analyse...",
};

export const SPORTS_ANALYSIS_STEP_ORDER: SportsAnalysisProgressStep[] = [
  "reading_bet",
  "calling_ai",
  "receiving_result",
];

export type SportsAnalysisErrorCode =
  | "invalid_input"
  | "unauthorized"
  | "image_unreadable"
  | "ai_error"
  | "network_error"
  | "limit_reached"
  | "unknown";

const ERROR_MESSAGES: Record<SportsAnalysisErrorCode, string> = {
  invalid_input: "Merci de renseigner toutes les informations du pari.",
  unauthorized: "Votre session a expiré. Reconnectez-vous et réessayez.",
  image_unreadable:
    "Impossible d'identifier un pari sportif dans cette image. Essayez une capture plus nette ou saisissez les informations manuellement.",
  ai_error: "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants.",
  network_error: "Connexion impossible. Vérifiez votre connexion et réessayez.",
  limit_reached:
    "Vous avez atteint votre limite d'analyses gratuites aujourd'hui. Débutez pour 0,99 € pour des analyses illimitées.",
  unknown: "Une erreur inattendue est survenue. Réessayez.",
};

export function sportsAnalysisErrorMessage(code: string): string {
  return ERROR_MESSAGES[code as SportsAnalysisErrorCode] ?? ERROR_MESSAGES.unknown;
}

/** Shown on every result — the responsibility rule already enforced
 * everywhere else on Polypips, restated here since this is the one
 * surface that touches real-money sports betting directly. */
export const RESPONSIBLE_BETTING_DISCLAIMER =
  "Cette analyse est une estimation, pas une garantie de résultat. Les paris sportifs comportent des risques.";
