/**
 * Shape returned by the analyze-market Edge Function (Gamma API + Claude),
 * and mirrored by the `analyses` Supabase table for history.
 */

export type AnalysisDecision = "YES" | "NO";
export type ConfidenceLevel = "Faible" | "Moyenne" | "Élevée";

export type AnalysisSource = {
  name: string;
  url: string;
};

export type MarketAnalysis = {
  id: string;
  question: string;
  category: string;
  analyzedAt: string;
  decision: AnalysisDecision;
  aiProbability: number;
  marketProbability: number;
  edge: number;
  opportunityScore: number;
  confidence: ConfidenceLevel;
  explanation: string;
  favorableFactors: string[];
  risks: string[];
  whatCouldChange: string;
  sources: AnalysisSource[];
};

export type AnalysisProgressStep =
  | "fetching_market"
  | "calling_ai"
  | "receiving_result";

export const ANALYSIS_LOADING_STEPS: Record<AnalysisProgressStep, string> = {
  fetching_market: "Récupération des données Polymarket...",
  calling_ai: "Envoi à l'IA pour analyse...",
  receiving_result: "Réception de l'analyse...",
};

export const ANALYSIS_STEP_ORDER: AnalysisProgressStep[] = [
  "fetching_market",
  "calling_ai",
  "receiving_result",
];

export type AnalysisErrorCode =
  | "invalid_input"
  | "unauthorized"
  | "market_not_found"
  | "market_not_identified"
  | "image_unreadable"
  | "gamma_unavailable"
  | "ai_error"
  | "network_error"
  | "unknown";

const ERROR_MESSAGES: Record<AnalysisErrorCode, string> = {
  invalid_input: "Le lien ou l'image fournie n'est pas valide.",
  unauthorized: "Votre session a expiré. Reconnectez-vous et réessayez.",
  market_not_found:
    "Ce marché est introuvable sur Polymarket. Vérifiez le lien et réessayez.",
  market_not_identified:
    "Le marché n'a pas pu être identifié automatiquement à partir de l'image. Collez le lien du marché à la place.",
  image_unreadable:
    "Impossible de lire cette image. Essayez une capture plus nette ou collez le lien du marché.",
  gamma_unavailable:
    "L'API Polymarket est momentanément indisponible. Réessayez dans quelques instants.",
  ai_error: "L'analyse IA a échoué. Réessayez dans quelques instants.",
  network_error: "Connexion impossible. Vérifiez votre connexion et réessayez.",
  unknown: "Une erreur inattendue est survenue. Réessayez.",
};

export function analysisErrorMessage(code: string): string {
  return ERROR_MESSAGES[code as AnalysisErrorCode] ?? ERROR_MESSAGES.unknown;
}
