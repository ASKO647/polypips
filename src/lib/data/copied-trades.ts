/**
 * Shared shape for the "Mes trades copiés" list — one per universe
 * (Polymarket's copy_trading_suggestions, Fomo/Axiom's
 * signal_copy_trades). Each universe's own domain type (Suggestion,
 * SignalCopyTrade) keeps its own field names/decision-string values since
 * they come from genuinely different tables; a thin per-universe mapper
 * normalizes into this shape so the row UI, filtering, and empty state are
 * written once in CopiedTradesList instead of duplicated per universe.
 */

export type CopiedTradeStatus = "nouvelle" | "vue" | "lien_cliquee";

export const COPIED_TRADE_STATUS_LABELS: Record<CopiedTradeStatus, string> = {
  nouvelle: "Nouvelle",
  vue: "Vue",
  lien_cliquee: "Lien cliqué",
};

export type CopiedTradeItem = {
  id: string;
  /** The wallet whose movement triggered this suggestion. */
  walletLabel: string;
  /** Short pill next to the wallet label (e.g. "Fomo"/"Axiom") — null when
   * the universe has only one source and the badge would be redundant
   * (Polymarket). */
  walletBadge: string | null;
  /** One line of context under the wallet label — the market/token/side/
   * amount detail specific to this universe. */
  subtitle: string;
  decision: "copie" | "ignore";
  score: number | null;
  scoreLabel: string;
  amountLabel: string;
  amountValue: string;
  status: CopiedTradeStatus;
  ignoreReason: string | null;
  createdAgo: string;
  /** e.g. "Voir sur Polymarket" / "Voir sur Fomo". */
  linkLabel: string;
};
