/**
 * Service layer for the Sports module — every Sports page/component reads
 * through here, never through mock-data.ts directly. Every function is
 * already async, even though the mock implementation resolves
 * synchronously, so swapping the body for a real sports-data API call
 * (and, for match analysis, a real Anthropic call mirroring
 * analyze-market's analyzeMarket) later is a body-only change — no
 * caller, and no component, needs to be touched.
 *
 * Not yet wired to a live source (see the Sports prompt's own
 * architecture requirement): match/team/odds data is mock-data.ts,
 * clearly isolated there. The AI-shaped fields on MatchAnalysis
 * (probabilities, verdict, opportunities, aiSummary) are equally mock for
 * now, not a real model call — labelled as such wherever the UI surfaces
 * them, exactly like the rest of this data.
 */
import { MOCK_COMPETITIONS, MOCK_MATCHES, MOCK_MATCH_ANALYSES, MOCK_TEAMS } from "./mock-data";
import type { Competition, Match, MatchAnalysis, Team } from "./types";

export async function listCompetitions(): Promise<Competition[]> {
  return MOCK_COMPETITIONS;
}

export async function listTeams(): Promise<Team[]> {
  return MOCK_TEAMS;
}

export async function listUpcomingMatches(filters?: {
  competitionId?: string;
  teamId?: string;
}): Promise<Match[]> {
  return MOCK_MATCHES.filter((m) => {
    if (filters?.competitionId && m.competition.id !== filters.competitionId) return false;
    if (
      filters?.teamId &&
      m.homeTeam.id !== filters.teamId &&
      m.awayTeam.id !== filters.teamId
    ) {
      return false;
    }
    return true;
  }).sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
}

export async function getMatchById(id: string): Promise<Match | null> {
  return MOCK_MATCHES.find((m) => m.id === id) ?? null;
}

export async function getMatchAnalysis(id: string): Promise<MatchAnalysis | null> {
  return MOCK_MATCH_ANALYSES[id] ?? null;
}
