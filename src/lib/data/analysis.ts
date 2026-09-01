/**
 * Shape returned by the analyze-market Edge Function (Gamma API + Claude),
 * and mirrored by the `analyses` Supabase table for history.
 */

/** The market's own real outcome label the AI picked — e.g. "Yes", "Up",
 * a candidate's name. Most Polymarket markets really are Yes/No, but a
 * real minority (crypto price markets chief among them) use different
 * label pairs on the exact same binary market shape, so this is never a
 * hardcoded "YES"/"NO" union — see isPrimaryDecision below for how the UI
 * still gets consistent styling without knowing the labels in advance. */
export type AnalysisDecision = string;
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
  /** The market's two real outcome labels, in Gamma's order — decision is
   * always one of these two. Empty for analyses created before this field
   * existed; isPrimaryDecision degrades gracefully when it is. */
  outcomes: string[];
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
  /** Polymarket's own identifier for this market — null for analyses
   * created from a screenshot before market_slug existed, or where the
   * market genuinely didn't resolve to one. Never fall back to guessing a
   * URL when this is null; just don't render the Polymarket link. */
  marketSlug: string | null;
};

/** The real, canonical market page on Polymarket — same slug the
 * resolve-markets Edge Function already keys off of. */
export function polymarketEventUrl(slug: string): string {
  return `https://polymarket.com/event/${slug}`;
}

/** The link to actually send the user to for this analysis. Prefers
 * `sources[0].url` when it's a specific market link (the analyze-market
 * Edge Function fills this with the user's own pasted link, or — for a
 * multi-candidate event resolved from a screenshot — a URL it builds from
 * the event slug + the chosen candidate's own sub-market slug) over
 * reconstructing one from `marketSlug` alone: for a sub-market of a
 * multi-candidate event, `marketSlug` is just that candidate's own raw
 * Gamma slug (needed as-is for resolve-markets' lookups), which is NOT the
 * same as the event's URL slug — polymarketEventUrl(marketSlug) alone
 * would build a 404. Falls back to marketSlug-based construction only when
 * sources doesn't have a specific link (Edge Function couldn't build one). */
export function resolvedMarketUrl(analysis: Pick<MarketAnalysis, "marketSlug" | "sources">): string | null {
  const sourceUrl = analysis.sources[0]?.url;
  if (sourceUrl && sourceUrl.includes("/event/")) return sourceUrl;
  return analysis.marketSlug ? polymarketEventUrl(analysis.marketSlug) : null;
}

/**
 * Every UI surface that colors/positions a decision by "which of the two
 * real outcomes" (emerald for the first-listed one, rose for the second)
 * goes through this one function, so that convention can't drift between
 * components. Position-based rather than a "is this semantically
 * positive" guess — "Down" isn't inherently negative, it's just whichever
 * label Gamma happened to list second, and guessing sentiment per-market
 * would be both unreliable and unnecessary for a simple two-way style
 * split. Case-insensitive match (see resolve-markets' own labelsMatch for
 * why) and defaults to true (primary/emerald) when outcomes is empty —
 * pre-migration rows with no stored outcomes, or a decision that somehow
 * doesn't match either label, degrade to the old YES-like default rather
 * than rendering unstyled.
 */
export function isPrimaryDecision(decision: string, outcomes: string[]): boolean {
  // A multi-candidate decision (more than 2 real outcomes — see
  // analyze-market's MultiCandidateEvent) has no "opposite" outcome to
  // color as rose; it's just the AI's single pick among many, always
  // styled as the positive/primary color.
  if (outcomes.length !== 2) return true;
  return decision.trim().toLowerCase() !== outcomes[1].trim().toLowerCase();
}

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
  | "limit_reached"
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
  ai_error:
    "Le service d'analyse IA est temporairement indisponible. Réessayez dans quelques instants.",
  network_error: "Connexion impossible. Vérifiez votre connexion et réessayez.",
  limit_reached:
    "Vous avez atteint votre limite d'analyses gratuites aujourd'hui. Débutez pour 0,99 € pour des analyses illimitées.",
  unknown: "Une erreur inattendue est survenue. Réessayez.",
};

export function analysisErrorMessage(code: string): string {
  return ERROR_MESSAGES[code as AnalysisErrorCode] ?? ERROR_MESSAGES.unknown;
}
