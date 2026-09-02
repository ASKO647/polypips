/** Shape returned by the analyze-trading-chart Edge Function, and mirrored
 * by the `trading_chart_analyses` table. */

export type TradingRecommendation = "Acheter" | "Vendre" | "Attendre";
export type TradingConfidence = "Faible" | "Moyenne" | "Élevée";

export type TradingKeyLevel = {
  type: "support" | "resistance";
  level: string;
};

export type TradingChartAnalysis = {
  id: string;
  analyzedAt: string;
  /** Best-effort read from the chart, or null when it couldn't be
   * confidently identified from the image. */
  instrument: string | null;
  timeframe: string | null;
  recommendation: TradingRecommendation;
  confidence: TradingConfidence;
  trendAnalysis: string;
  keyLevels: TradingKeyLevel[];
  indicatorsObserved: string[];
  /** A price level or a percentage from entry — NEVER a money amount or a
   * lot/position size (enforced by the AI schema itself, not just prompt
   * instruction — see anthropic-trading-analysis.ts). Null when
   * recommendation is "Attendre" and nothing concrete applies yet. */
  takeProfit: string | null;
  stopLoss: string | null;
  explanation: string;
  risks: string[];
};

export type TradingProgressStep = "calling_ai" | "receiving_result";

export const TRADING_LOADING_STEPS: Record<TradingProgressStep, string> = {
  calling_ai: "Envoi du graphique à l'IA...",
  receiving_result: "Réception de l'analyse...",
};

export const TRADING_STEP_ORDER: TradingProgressStep[] = ["calling_ai", "receiving_result"];

export type TradingErrorCode =
  | "invalid_input"
  | "unauthorized"
  | "ai_error"
  | "network_error"
  | "limit_reached"
  | "unknown";

const ERROR_MESSAGES: Record<TradingErrorCode, string> = {
  invalid_input: "Merci de fournir une image de graphique valide.",
  unauthorized: "Votre session a expiré. Reconnectez-vous et réessayez.",
  ai_error:
    "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants.",
  network_error: "Connexion impossible. Vérifiez votre connexion et réessayez.",
  limit_reached:
    "Vous avez atteint votre limite d'analyses gratuites aujourd'hui. Débutez pour 0,99 € pour des analyses illimitées.",
  unknown: "Une erreur inattendue est survenue. Réessayez.",
};

export function tradingErrorMessage(code: string): string {
  return ERROR_MESSAGES[code as TradingErrorCode] ?? ERROR_MESSAGES.unknown;
}

export const TRADING_DISCLAIMER =
  "Cette analyse est une estimation basée sur l'image fournie, pas une garantie de résultat. Le trading avec effet de levier comporte des risques élevés de perte en capital.";
