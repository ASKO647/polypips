/** Shapes shared between sport-match-search's response and the frontend —
 * mirrors _shared/api-sports.ts's ScheduleItem, but only the fields the UI
 * actually renders (no external IDs beyond what's needed to key a list). */

export type Sport = "football" | "basketball" | "tennis";

export type SportFixture = {
  /** A real numeric ID for football/basketball (API-Sports' own fixture
   * id). Tennis (The Odds API) only has a string event id — never
   * fabricated into a fake number, just kept as the string it is; nothing
   * downstream does arithmetic on this, it's only ever used as a list
   * key. */
  externalFixtureId: number | string;
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
