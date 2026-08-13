/**
 * Real data: a "strategy" is a user-configured risk envelope tied to one
 * followed Smart Money wallet. Copy trading here means suggestion + alert,
 * never automatic execution — see src/lib/supabase/copy-trading.ts and the
 * sync-smart-money Edge Function's suggestion-generation logic.
 */

export type RiskParameters = {
  maxPositionAmount: number;
  maxExposure: number;
  maxSimultaneousPositions: number;
};

export type StrategyStatus = "active" | "paused";

/** One followed wallet the user can turn into a copy-trading strategy.
 * `strategyId`/`status`/`riskParameters` are null until the user has
 * actually configured and activated it at least once. */
export type Strategy = {
  walletId: string;
  walletLabel: string;
  walletAddress: string;
  walletTotalValue: number;
  strategyId: string | null;
  status: StrategyStatus | null;
  riskParameters: RiskParameters | null;
};

export type SuggestionStatus = "nouvelle" | "vue" | "lien_cliquee";

/** A system-generated alert — "this wallet made a move matching your risk
 * parameters" — never an executed trade. */
export type Suggestion = {
  id: string;
  marketQuestion: string;
  marketUrl: string;
  side: "YES" | "NO";
  amount: number;
  status: SuggestionStatus;
  createdAgo: string;
};
