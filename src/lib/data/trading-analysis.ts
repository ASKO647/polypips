/** Shape returned by the analyze-trading-chart Edge Function, and mirrored
 * by the `trading_chart_analyses` table.
 *
 * Display copy (labels, loading steps, error messages, disclaimer) lives in
 * the "Trading" message namespace (messages/{locale}/trading.json), never as
 * hardcoded strings here — the getX(t) helpers below merge it with the
 * language-neutral data below at render time. `t` must be scoped to the
 * "Trading" namespace, e.g. `useTranslations("Trading")` (client) or
 * `getTranslations("Trading")` (server). Recommendation/confidence values
 * ("Acheter", "Faible", ...) are the literal enum values returned by the AI
 * Edge Function and stored in the DB — they are data, not display text, so
 * they stay in French regardless of locale; only their rendered label is
 * translated. */

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

export const TRADING_STEP_ORDER: TradingProgressStep[] = ["calling_ai", "receiving_result"];

export type TradingErrorCode =
  | "invalid_input"
  | "unauthorized"
  | "ai_error"
  | "network_error"
  | "limit_reached"
  | "unknown";

const TRADING_ERROR_CODES: TradingErrorCode[] = [
  "invalid_input",
  "unauthorized",
  "ai_error",
  "network_error",
  "limit_reached",
  "unknown",
];

type TradingTranslator = {
  (key: string): string;
  raw: (key: string) => unknown;
};

/** Builds the locale-aware loading step labels — call with a translator
 * scoped to the "Trading" namespace. Never import a static step-label map
 * directly; call this at render time. */
export function getTradingLoadingSteps(t: TradingTranslator): Record<TradingProgressStep, string> {
  return {
    calling_ai: t("loading.calling_ai"),
    receiving_result: t("loading.receiving_result"),
  };
}

/** Fixed French fallback for the single-arg legacy overload below — never
 * shown by any component in this feature (every display path uses the
 * translated 2-arg overload instead). Exists solely so
 * src/lib/supabase/analyze-trading-chart-client.ts (Supabase/Edge Function
 * logic, out of this namespace's scope) keeps compiling: its pre-check
 * errors set an Error#message that the UI never renders — errorContentFor
 * in trading-analyse-ia-flow.tsx always re-derives the displayed text from
 * the error `code` through the translated overload. */
const LEGACY_ERROR_FALLBACK: Record<TradingErrorCode, string> = {
  invalid_input: "Merci de fournir une image de graphique valide.",
  unauthorized: "Votre session a expiré. Reconnectez-vous et réessayez.",
  ai_error:
    "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants.",
  network_error: "Connexion impossible. Vérifiez votre connexion et réessayez.",
  limit_reached:
    "Vous avez atteint votre limite d'analyses gratuites aujourd'hui. Débutez pour 0,99 € pour des analyses illimitées.",
  unknown: "Une erreur inattendue est survenue. Réessayez.",
};

/** Resolves an error code (from the Edge Function/client) to a locale-aware
 * message, scoped to the "Trading" namespace. Unknown codes fall back to
 * the generic "unknown" message. */
export function tradingErrorMessage(code: string): string;
export function tradingErrorMessage(t: TradingTranslator, code: string): string;
export function tradingErrorMessage(a: TradingTranslator | string, b?: string): string {
  if (typeof a === "string") {
    return LEGACY_ERROR_FALLBACK[a as TradingErrorCode] ?? LEGACY_ERROR_FALLBACK.unknown;
  }
  const resolved = TRADING_ERROR_CODES.includes(b as TradingErrorCode)
    ? (b as TradingErrorCode)
    : "unknown";
  return a(`errors.${resolved}`);
}

/** The mandatory, always-visible risk disclaimer (no outcome guarantee +
 * high risk of capital loss on leveraged trading) — scoped to the "Trading"
 * namespace. */
export function getTradingDisclaimer(t: TradingTranslator): string {
  return t("disclaimer");
}

export function getRecommendationLabel(
  t: TradingTranslator,
  recommendation: TradingRecommendation
): string {
  return t(`recommendation.${recommendation}`);
}

export function getConfidenceLabel(t: TradingTranslator, confidence: TradingConfidence): string {
  return t(`confidenceLevel.${confidence}`);
}

export function getKeyLevelTypeLabel(t: TradingTranslator, type: TradingKeyLevel["type"]): string {
  return t(`keyLevelType.${type}`);
}
