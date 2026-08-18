/**
 * Real data: a "strategy" is a user-configured risk envelope tied to one
 * followed Smart Money wallet. Copy trading here means suggestion + alert,
 * never automatic execution — see src/lib/supabase/copy-trading.ts and the
 * sync-smart-money Edge Function's Smart Copy decision pipeline.
 */

export type RiskLevel = "low" | "medium" | "high";

export type RiskParameters = {
  maxBudget: number;
  maxPositionAmount: number;
  maxExposure: number;
  maxSimultaneousPositions: number;
  riskLevel: RiskLevel;
};

export type StrategyStatus = "active" | "paused";

/** One followed wallet the user can turn into a copy-trading strategy.
 * `strategyId`/`status`/`riskParameters` are null until the user has
 * actually configured and activated it at least once. Quality fields come
 * from tracked_wallets and are null until sync-smart-money has computed
 * them at least once for this wallet. */
export type Strategy = {
  walletId: string;
  walletLabel: string;
  walletAddress: string;
  walletTotalValue: number;
  walletWinRate: number | null;
  walletRoiPercent: number | null;
  strategyId: string | null;
  status: StrategyStatus | null;
  riskParameters: RiskParameters | null;
};

export type SuggestionStatus = "nouvelle" | "vue" | "lien_cliquee";
export type SuggestionDecision = "copied" | "ignored";

/** A system-generated log entry for one fresh movement of a followed
 * wallet — copied (sized down to the strategy's own limits) or ignored
 * (with a specific reason), but never an executed trade. */
export type Suggestion = {
  id: string;
  marketQuestion: string;
  marketUrl: string;
  side: "YES" | "NO";
  decision: SuggestionDecision;
  /** Sized amount actually suggested (for 'copied'); the original wallet
   * amount, unsized, for 'ignored' rows. */
  amount: number;
  originalAmount: number | null;
  ignoreReason: string | null;
  marketProbability: number | null;
  aiProbability: number | null;
  edge: number | null;
  opportunityScore: number | null;
  confidence: string | null;
  status: SuggestionStatus;
  createdAgo: string;
};
