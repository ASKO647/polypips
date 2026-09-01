import type { ConfidenceLevel } from "@/lib/data/analysis";
import type { Sport } from "@/lib/sports/types";

/** Shape returned by the analyze-sport-match Edge Function, and mirrored by
 * the `sports_bet_analyses` table (new-era columns — see that table's
 * fixture-prediction migration) for "Mes analyses" history. */

export type SecondaryMarket = {
  market: string;
  suggestion: string;
  rationale: string;
};

export type SportMatchAnalysis = {
  id: string;
  analyzedAt: string;
  sport: Sport;
  /** "Équipe A vs Équipe B", ready to display. */
  participants: string;
  competition: string | null;
  /** ISO kickoff time of the real fixture that was analyzed. */
  matchDate: string;
  /** Exactly one of the two team names, or "Match nul" for football. */
  predictedWinner: string;
  aiProbability: number;
  confidence: ConfidenceLevel;
  explanation: string;
  favorableFactors: string[];
  risks: string[];
  whatCouldChange: string;
  secondaryMarkets: SecondaryMarket[];
};

export type SportMatchProgressStep = "calling_ai" | "receiving_result";

export const SPORT_MATCH_LOADING_STEPS: Record<SportMatchProgressStep, string> = {
  calling_ai: "Envoi à l'IA pour pronostic...",
  receiving_result: "Réception du pronostic...",
};

export const SPORT_MATCH_STEP_ORDER: SportMatchProgressStep[] = ["calling_ai", "receiving_result"];

export type SportMatchErrorCode =
  | "invalid_input"
  | "unauthorized"
  | "team_not_found"
  | "sports_api_unavailable"
  | "ai_error"
  | "network_error"
  | "limit_reached"
  | "unknown";

const ERROR_MESSAGES: Record<SportMatchErrorCode, string> = {
  invalid_input: "Merci de renseigner les deux équipes.",
  unauthorized: "Votre session a expiré. Reconnectez-vous et réessayez.",
  team_not_found: "Équipe introuvable. Vérifiez l'orthographe et réessayez.",
  sports_api_unavailable:
    "La source de données sportives est momentanément indisponible. Réessayez dans quelques instants.",
  ai_error:
    "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants.",
  network_error: "Connexion impossible. Vérifiez votre connexion et réessayez.",
  limit_reached:
    "Vous avez atteint votre limite d'analyses gratuites aujourd'hui. Débutez pour 0,99 € pour des analyses illimitées.",
  unknown: "Une erreur inattendue est survenue. Réessayez.",
};

export function sportMatchErrorMessage(code: string): string {
  return ERROR_MESSAGES[code as SportMatchErrorCode] ?? ERROR_MESSAGES.unknown;
}
