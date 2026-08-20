/**
 * Shared types for the Sports module. Deliberately mirrors the shape of
 * lib/data/analysis.ts (ConfidenceLevel, probabilistic-language verdicts)
 * so the same ConfidenceMeter component and the same "never a guarantee"
 * copy conventions apply here. Nothing in this file is sport-specific
 * beyond the football-only fields noted below — extending to another
 * sport later means adding fields, not restructuring.
 */

import type { ConfidenceLevel } from "@/lib/data/analysis";

export type Sport = "football";

export type Team = {
  id: string;
  name: string;
  shortName: string;
  /** 2-3 letter fallback shown in a colored circle — no team logo image
   * pipeline exists yet (see MatchTeamBadge), so this is the only visual
   * identity available until real crests are wired in. */
  initials: string;
  country: string;
  /** Hex accent used for this team's badge ring, probability bar, and
   * form indicators — falls back to the app's own brand red when a team
   * has no defined color. */
  accentColor?: string;
};

export type Competition = {
  id: string;
  name: string;
  country: string;
};

export type MatchStatus = "scheduled" | "live" | "finished";

export type Match = {
  id: string;
  sport: Sport;
  competition: Competition;
  homeTeam: Team;
  awayTeam: Team;
  kickoffAt: string;
  status: MatchStatus;
};

/** Home/draw/away, expressed as whole percentages. Not guaranteed to sum
 * to exactly 100 once a real model is behind this — callers should treat
 * it as three independent estimates, not a strict partition. */
export type MatchProbabilities = {
  home: number;
  draw: number;
  away: number;
};

export type MatchVerdict = {
  /** e.g. "PSG gagnant" — always phrased as an estimate, never a promise;
   * see MATCH_VERDICT_DISCLAIMER for the copy shown alongside every
   * verdict card. */
  outcome: string;
  confidenceScore: number;
  explanation: string;
};

export type OpportunityTone = "brand" | "emerald" | "violet" | "amber" | "sky";

export type Opportunity = {
  id: string;
  /** e.g. "PSG gagnant", "+1.5 buts", "BTTS oui" */
  label: string;
  /** e.g. "Résultat 1X2", "Total de buts" — the market family this
   * opportunity belongs to, shown as a small subtitle under the label. */
  marketType: string;
  probabilityPercent: number;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  tone: OpportunityTone;
};

export type FormResult = "W" | "D" | "L";

export type TeamForm = {
  teamId: string;
  /** Most recent last — index 0 is the oldest of the 5. */
  lastFive: FormResult[];
};

export type TeamComparisonStat = {
  label: string;
  homeValue: number;
  awayValue: number;
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
 * Every field is independently nullable — the point of this type is that
 * a missing datum renders a clean "non disponible" row, never an invented
 * value (venue is the one field a match can't reasonably lack).
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
  probabilityPercent: number;
  /** null when no odds source is connected — rendered as "—", never a
   * fabricated number (see OddsComparator's own empty state for the full
   * "no bookmaker source" case). */
  odds: number | null;
};

export type PopularMarket = {
  key: PopularMarketKey;
  label: string;
  outcomes: PopularMarketOutcome[];
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

export type InjuryStatus = "out" | "doubtful";

export type InjuredPlayer = {
  teamId: string;
  name: string;
  status: InjuryStatus;
  reason: string;
};

/** Full analysis bundle for a single match — one call from the match
 * detail page's server component, mirroring how analyze-market bundles
 * everything a market detail view needs into one AiVerdict-shaped
 * response instead of many small round-trips. */
export type MatchAnalysis = {
  match: Match;
  probabilities: MatchProbabilities;
  verdict: MatchVerdict;
  opportunities: Opportunity[];
  form: { home: TeamForm; away: TeamForm };
  comparison: TeamComparisonStat[];
  h2h: H2HMatch[];
  aiSummary: string;
  info: MatchInfo;
  odds: BookmakerOdds[];
  popularMarkets: PopularMarket[];
  lineups: { home: ProbableLineup; away: ProbableLineup } | null;
  injuries: InjuredPlayer[];
};

/** Shown next to every probability/verdict/opportunity in the UI — the
 * one piece of copy every section in this module must carry somewhere
 * visible, per the product requirement that this never reads as a
 * guarantee. */
export const PROBABILISTIC_DISCLAIMER =
  "Estimation probabiliste, pas une garantie de résultat.";
