/**
 * Shape returned by the analyze-signal-bet Edge Function, and mirrored by
 * the signal_ai_analyses table. This is the Smart Wallets universe's own
 * "Analyse IA" (Fomo/Axiom) — deliberately not sharing types with either
 * lib/data/analysis.ts (Polymarket) or lib/data/sports-analysis.ts (Sport)
 * beyond the plain shape below.
 */

export type SignalAnalysis = {
  id: string;
  analyzedAt: string;
  source: "fomo" | "axiom";
  walletAddress: string | null;
  tokenSymbol: string;
  side: "BUY" | "SELL";
  amountUsd: number | null;
  price: number | null;
  marketCap: number | null;
  liquidity: number | null;
  volume24h: number | null;
  polypipsScore: number;
  summary: string;
  positives: string[];
  risks: string[];
  conclusion: string;
  decision: "copie" | "ignore";
};

export type SignalBetFormInput = {
  walletAddress: string;
  tokenSymbol: string;
  side: "BUY" | "SELL";
  amountUsd: string;
  price: string;
  marketCap: string;
  liquidity: string;
  volume24h: string;
};

export type SignalAnalysisProgressStep = "reading_trade" | "calling_ai" | "receiving_result";

export const SIGNAL_ANALYSIS_LOADING_STEPS: Record<SignalAnalysisProgressStep, string> = {
  reading_trade: "Lecture des informations du trade...",
  calling_ai: "Envoi à l'IA pour analyse...",
  receiving_result: "Réception de l'analyse...",
};

export const SIGNAL_ANALYSIS_STEP_ORDER: SignalAnalysisProgressStep[] = [
  "reading_trade",
  "calling_ai",
  "receiving_result",
];

export type SignalAnalysisErrorCode =
  | "invalid_input"
  | "unauthorized"
  | "image_unreadable"
  | "link_unavailable"
  | "ai_error"
  | "network_error"
  | "limit_reached"
  | "unknown";

const ERROR_MESSAGES: Record<SignalAnalysisErrorCode, string> = {
  invalid_input: "Merci de renseigner au minimum le token, le sens et le montant.",
  unauthorized: "Votre session a expiré. Reconnectez-vous et réessayez.",
  image_unreadable:
    "Impossible d'identifier un trade dans cette image. Essayez une capture plus nette ou saisissez les informations manuellement.",
  link_unavailable:
    "Polypips ne peut pas encore récupérer automatiquement les données d'un lien Fomo/Axiom. Déposez une capture d'écran, ou saisissez les informations manuellement.",
  ai_error: "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants.",
  network_error: "Connexion impossible. Vérifiez votre connexion et réessayez.",
  limit_reached:
    "Vous avez atteint votre limite d'analyses gratuites aujourd'hui. Débutez pour 0,99 € pour des analyses illimitées.",
  unknown: "Une erreur inattendue est survenue. Réessayez.",
};

export function signalAnalysisErrorMessage(code: string): string {
  return ERROR_MESSAGES[code as SignalAnalysisErrorCode] ?? ERROR_MESSAGES.unknown;
}

/** Shown on every result — the same responsible-use posture enforced
 * everywhere else on Polypips, tuned to memecoin-specific risk (extreme
 * volatility, possible total loss) rather than sports betting's wording. */
export const SIGNAL_RISK_DISCLAIMER =
  "Cette analyse est une estimation basée sur les données fournies, pas une garantie de résultat. Les memecoins sont des actifs très volatils et spéculatifs : vous pouvez perdre tout ou partie du capital investi.";
