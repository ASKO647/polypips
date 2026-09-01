/** Shapes shared between sport-match-search's response and the frontend —
 * mirrors _shared/api-sports.ts's ScheduleItem, but only the fields the UI
 * actually renders (no external IDs beyond what's needed to key a list). */

export type Sport = "football" | "basketball";

export const SPORT_LABELS: Record<Sport, string> = {
  football: "Football",
  basketball: "Basketball",
};

export type SportFixture = {
  externalFixtureId: number;
  kickoffAt: string;
  competitionName: string | null;
  homeTeamName: string;
  homeTeamLogoUrl: string | null;
  awayTeamName: string;
  awayTeamLogoUrl: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type SportTeamSummary = {
  name: string;
  logoUrl: string | null;
};

export type SportSearchResult = {
  team1: SportTeamSummary;
  team2: SportTeamSummary;
  upcomingFixtures: SportFixture[];
  recentMeetings: SportFixture[];
};
