/**
 * Real data: Copy Trading for the Smart Wallets (Fomo/Axiom) universe.
 * Separate from lib/data/copy-trading.ts (Polymarket's own Copy Trading —
 * suggestion + alert only). Here, Copy Trading additionally runs a
 * Risk Engine + Execution Engine pipeline (see sync-signal-wallets), but
 * execution is ALWAYS in demo mode — see SignalCopyTrade.executionMode.
 */

export type SignalCopyStatus =
  | "detection"
  | "analyse"
  | "en_attente"
  | "copie"
  | "ignore"
  | "en_cours"
  | "ferme"
  | "echec";

export const SIGNAL_COPY_STATUS_LABELS: Record<SignalCopyStatus, string> = {
  detection: "Détection",
  analyse: "Analyse",
  en_attente: "En attente",
  copie: "Copié",
  ignore: "Ignoré",
  en_cours: "En cours",
  ferme: "Fermé",
  echec: "Échec",
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
  maxLossAmount: number | null;
  autoStop: boolean;
};

export const DEFAULT_SIGNAL_COPY_SETTINGS: Omit<SignalCopySettings, "id" | "walletId"> = {
  enabled: false,
  maxPositionAmount: 500,
  positionPercent: 2,
  maxDailyAmount: 1500,
  maxSimultaneousPositions: 3,
  maxSlippagePercent: 5,
  excludedTokens: [],
  maxLossAmount: null,
  autoStop: true,
};

export type SignalRiskCheck = { rule: string; passed: boolean; detail: string };

/** One decision + lifecycle record — a wallet trade the Risk/AI Engine
 * evaluated, its COPY/IGNORE decision, and (for a copied BUY) the
 * simulated position's state through to close. */
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
  executionMode: "demo" | "live";
  closedPnl: number | null;
  createdAgo: string;
};
