/** "x" stays in this union and in the DB enum (see the migration's own
 * comment) so a future paid X/Twitter integration needs no schema or type
 * change — but it is never written today (X has no free API tier as of
 * Feb 2026) and deliberately has no filter tab below. */
export type PipsTrackSource = "fomo" | "axiom" | "x" | "news";

export type PipsTrackEventType =
  | "trade_buy"
  | "trade_sell"
  | "signal_ia"
  | "wallet_active"
  | "news"
  | "x_post";

export type PipsTrackImpact = "eleve" | "moyen" | "faible";
export type PipsTrackDataSourceMode = "mock" | "live";

export type PipsTrackEvent = {
  id: string;
  source: PipsTrackSource;
  eventType: PipsTrackEventType;
  title: string;
  description: string;
  tokenSymbol: string | null;
  walletAddress: string | null;
  walletLabel: string | null;
  amountUsd: number | null;
  price: number | null;
  aiScore: number | null;
  aiWinRate: number | null;
  aiImpact: PipsTrackImpact | null;
  externalUrl: string | null;
  dataSourceMode: PipsTrackDataSourceMode;
  occurredAt: string;
};

export type PipsTrackSummary = {
  eventsToday: number;
  signalsToday: number;
  buysToday: number;
  sellsToday: number;
  activeWallets: number;
};

/** A token symbol's real mention count across the last 24h of the feed
 * (computed, never invented) — changePercent/logoUrl are an optional
 * Dexscreener enrichment that can legitimately come back null when the
 * symbol doesn't resolve to a real Solana pair (e.g. mock-data tokens). */
export type PipsTrackTopToken = {
  tokenSymbol: string;
  mentionCount: number;
  changePercent: number | null;
  logoUrl: string | null;
};

/** The filter bar's tab set — "signal_ia" filters by event_type, not by
 * the `source` column (a Signal IA row's source is still fomo/axiom), so
 * this is a distinct union from PipsTrackSource rather than reusing it. */
export type PipsTrackFilterValue = "all" | PipsTrackSource | "signal_ia";

export const PIPS_TRACK_FILTER_TABS: { value: PipsTrackFilterValue; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "fomo", label: "FOMO" },
  { value: "axiom", label: "AXIOM" },
  { value: "news", label: "News" },
  { value: "signal_ia", label: "Signal IA" },
];

export const PIPS_TRACK_SOURCE_LABELS: Record<PipsTrackSource, string> = {
  fomo: "FOMO",
  axiom: "AXIOM",
  x: "X (Twitter)",
  news: "NEWS",
};

export const PIPS_TRACK_IMPACT_LABELS: Record<PipsTrackImpact, string> = {
  eleve: "ÉLEVÉ",
  moyen: "MOYEN",
  faible: "FAIBLE",
};

export const PIPS_TRACK_EVENTS_PAGE_SIZE = 15;

export type PipsTrackAlert = {
  id: string;
  tokenSymbol: string | null;
  minAmountUsd: number | null;
  createdAt: string;
};
