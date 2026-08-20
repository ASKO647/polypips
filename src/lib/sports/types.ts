/**
 * Shared types for the Sports module. Mirrors the shape of
 * lib/data/analysis.ts (ConfidenceLevel, probabilistic-language verdicts)
 * so the same ConfidenceMeter component and "never a guarantee" copy
 * conventions apply here.
 *
 * Hard rule baked into this file: every field that would represent a real
 * prediction, stat, score, or odds is nullable (or an empty collection).
 * Nothing here is allowed to carry a plausible-looking hardcoded number
 * presented as real — until a real data/AI source is connected, callers
 * render an honest empty state, exactly like Statistiques' StatsEmptyState.
 * Only fixture-level fields (which two teams play, when, in which
 * competition) are non-nullable — that's demo scheduling data, not a
 * prediction or a stat.
 */

import type { ConfidenceLevel } from "@/lib/data/analysis";

export type SportKey =
  | "football"
  | "basketball"
  | "tennis"
  | "nfl"
  | "rugby"
  | "hockey"
  | "mma"
  | "boxe"
  | "baseball";

export type SportCategory = {
  key: SportKey;
  label: string;
  /** Only football has real navigation/data behind it today — the rest
   * render a clean "bientôt disponible" state rather than an empty shell
   * pretending to be functional. */
  active: boolean;
};

export type Team = {
  id: string;
  name: string;
  shortName: string;
  /** 2-3 letter fallback shown in a colored circle — no team logo image
   * pipeline exists yet (see TeamBadge), so this is the only visual
   * identity available until real crests are wired in. */
  initials: string;
  country: string;
  /** Hex accent used for this team's badge ring, probability bar, and
   * form indicators — falls back to the app's own brand red when a team
   * has no defined color. */
  accentColor?: string;
};

export type Country = {
  code: string;
  name: string;
  flagEmoji: string;
};

export type Competition = {
  id: string;
  name: string;
  country: string;
  sport: SportKey;
};

export type MatchStatus = "scheduled" | "live" | "finished";

export type Match = {
  id: string;
  sport: SportKey;
  competition: Competition;
  homeTeam: Team;
  awayTeam: Team;
  kickoffAt: string;
  status: MatchStatus;
};

/** Home/draw/away, expressed as whole percentages. Null as a whole until a
 * real prediction model is connected — never partially-filled with
 * invented numbers. */
export type MatchProbabilities = {
  home: number;
  draw: number;
  away: number;
} | null;

export type MatchVerdict = {
  /** e.g. "PSG gagnant" — always phrased as an estimate, never a promise. */
  outcome: string;
  confidenceScore: number;
  explanation: string;
} | null;

export type OpportunityTone = "brand" | "emerald" | "violet" | "amber" | "sky";

export type Opportunity = {
  id: string;
  /** e.g. "PSG gagnant", "+1.5 buts", "BTTS oui" */
  label: string;
  /** e.g. "Résultat 1X2", "Total de buts" */
  marketType: string;
  probabilityPercent: number;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  tone: OpportunityTone;
};

/** An opportunity plus the match it belongs to — the shape the global
 * Opportunités page (all matches, all sports) needs, vs. the per-match
 * Opportunity used inside a match's own analysis bundle. */
export type OpportunityWithMatch = Opportunity & { match: Match };

export type FormResult = "W" | "D" | "L";

export type TeamForm = {
  teamId: string;
  /** Most recent last. Empty when no results feed is connected. */
  lastFive: FormResult[];
  goalsPerMatch: number | null;
};

export type TeamComparisonStat = {
  label: string;
  homeValue: number | null;
  awayValue: number | null;
  /** % delta vs. the competition average — one of the mockup's "+18% /
   * -8%" annotations. Null with the rest until real stats are connected. */
  homeVsLeagueAvgPercent: number | null;
  awayVsLeagueAvgPercent: number | null;
  unit?: string;
};

export type H2HMatch = {
  id: string;
  playedAt: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
};

/**
 * Every field is independently nullable — a missing datum renders a clean
 * "non disponible" row, never an invented value.
 */
export type MatchInfo = {
  venue: string;
  weather: string | null;
  referee: string | null;
  attendanceEstimate: number | null;
};

export type BookmakerOdds = {
  bookmaker: string;
  home: number;
  draw: number;
  away: number;
};

export type PopularMarketKey = "1x2" | "totalGoals" | "btts" | "doubleChance" | "handicap";

export type PopularMarketOutcome = {
  label: string;
  /** Null until a real model is connected — rendered as "—". */
  probabilityPercent: number | null;
  /** Null when no odds source is connected — rendered as "—". */
  odds: number | null;
};

export type PopularMarket = {
  key: PopularMarketKey;
  label: string;
  outcomes: PopularMarketOutcome[];
};

/** A "meilleure opportunité" row on the Marchés tab — probability vs. market
 * odds vs. our fair odds, with the resulting edge. Every numeric field is
 * nullable together; there's no meaningful partial state. */
export type MarketEdgeRow = {
  marketLabel: string;
  probabilityPercent: number | null;
  marketOdds: number | null;
  fairOdds: number | null;
  edgePercent: number | null;
};

export type LineupStatus = "probable" | "confirmed";

export type LineupPlayer = {
  name: string;
  position: string;
};

export type ProbableLineup = {
  teamId: string;
  status: LineupStatus;
  formation: string;
  players: LineupPlayer[];
};

export type InjuryStatus = "out" | "doubtful" | "suspended";

export type InjuredPlayer = {
  teamId: string;
  name: string;
  status: InjuryStatus;
  reason: string;
};

/** The five components behind the composite "Polypips Score" gauge, plus
 * the overall score itself — each independently null until the real
 * scoring model is wired in. A partially-null breakdown (e.g. only "form"
 * populated) is a valid state; the overall score is null unless every
 * component that feeds it is available. */
export type PolypipsScoreBreakdown = {
  form: number | null;
  stats: number | null;
  h2h: number | null;
  lineups: number | null;
  market: number | null;
  overall: number | null;
};

/** One numbered explanation block on the "Analyse Polypips" card (the
 * mockup's 01 Forme offensive / 02 Défense adverse / 03 Confrontations /
 * 04 Modèle prédictif). Text is only ever real model output — never
 * templated boilerplate presented as an explanation. */
export type AnalysisFactor = {
  order: number;
  title: string;
  text: string;
};

/** Full analysis bundle for a single match — one call from the match
 * detail page's server component. Every analytical field here is nullable
 * or an empty collection by default; see the file-level comment. */
export type MatchAnalysis = {
  match: Match;
  polypipsScore: PolypipsScoreBreakdown | null;
  probabilities: MatchProbabilities;
  verdict: MatchVerdict;
  analysisFactors: AnalysisFactor[];
  opportunities: Opportunity[];
  form: { home: TeamForm; away: TeamForm };
  recentResults: { home: H2HMatch[]; away: H2HMatch[] };
  comparison: TeamComparisonStat[];
  h2h: H2HMatch[];
  aiSummary: string | null;
  info: MatchInfo;
  odds: BookmakerOdds[];
  popularMarkets: PopularMarket[];
  marketEdges: MarketEdgeRow[];
  lineups: { home: ProbableLineup; away: ProbableLineup } | null;
  injuries: InjuredPlayer[];
};

/** Model-accuracy tracking for the Overview page's "Précision modèle"
 * tile. Null until a real results-resolution pipeline exists for sports
 * (there is currently no live match-results feed to resolve predictions
 * against, unlike Polymarket/Gamma for resolve-markets) — see
 * getModelAccuracy() in service.ts. */
export type ModelAccuracyStats = {
  precisionPercent: number | null;
  sampleSize: number;
  windowDays: number;
};

export type SportsOverviewStats = {
  matchesAnalyzedToday: number;
  opportunitiesDetectedToday: number;
  /** Opportunities with confidenceScore >= HIGH_CONVICTION_THRESHOLD. */
  highConvictionCount: number;
  modelAccuracy: ModelAccuracyStats;
};

export const HIGH_CONVICTION_THRESHOLD = 60;

export type OpportunityFilters = {
  sport?: SportKey;
  minConfidencePercent?: number;
  competitionId?: string;
};

/** Shown next to every probability/verdict/opportunity in the UI. */
export const PROBABILISTIC_DISCLAIMER =
  "Estimation probabiliste, pas une garantie de résultat.";
