/**
 * Real data: Copy Trading for the Smart Wallets (Fomo/Axiom) universe.
 * Same model as lib/data/copy-trading.ts (Polymarket's own Copy Trading):
 * a wallet trade run through an AI Engine + Risk Engine reaches one
 * decision (copié/ignoré) and one notification with a real external link
 * — never an executed or simulated position. See sync-signal-wallets for
 * the pipeline itself.
 */

/** Whether the USER has looked at / clicked through this suggestion —
 * never a trade's own execution state. Mirrors copy_trading_suggestions'
 * status column exactly. */
export type SignalCopyStatus = "nouvelle" | "vue" | "lien_cliquee";

export const SIGNAL_COPY_STATUS_LABELS: Record<SignalCopyStatus, string> = {
  nouvelle: "Nouvelle",
  vue: "Vue",
  lien_cliquee: "Lien cliqué",
};

export type SignalCopySettings = {
  id: string | null;
  walletId: string;
  enabled: boolean;
  maxPositionAmount: number;
  positionPercent: number;
  maxDailyAmount: number;
  maxSimultaneousPositions: number;
  maxSlippagePercent: number;
  excludedTokens: string[];
};

export const DEFAULT_SIGNAL_COPY_SETTINGS: Omit<SignalCopySettings, "id" | "walletId"> = {
  enabled: false,
  maxPositionAmount: 500,
  positionPercent: 2,
  maxDailyAmount: 1500,
  maxSimultaneousPositions: 3,
  maxSlippagePercent: 5,
  excludedTokens: [],
};

export type SignalRiskCheck = { rule: string; passed: boolean; detail: string };

/** One decision record — a wallet trade the AI/Risk Engine evaluated and
 * its COPY/IGNORE decision. sizedAmount/entryPrice are informational
 * context only (what a copy would look like), never an executed amount. */
export type SignalCopyTrade = {
  id: string;
  walletId: string;
  walletLabel: string;
  walletSource: "fomo" | "axiom";
  tokenSymbol: string;
  walletTradeSide: "BUY" | "SELL";
  walletTradeAmount: number;
  aiScore: number | null;
  aiSummary: string | null;
  aiPositives: string[];
  aiRisks: string[];
  riskChecks: SignalRiskCheck[];
  decision: "copie" | "ignore";
  ignoreReason: string | null;
  sizedAmount: number | null;
  entryPrice: number | null;
  status: SignalCopyStatus;
  createdAgo: string;
};
