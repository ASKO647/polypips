/**
 * Isolated mock dataset for the Sports module — never imported directly by
 * a component (go through service.ts instead).
 *
 * This file intentionally only contains FIXTURE-level demo data: which
 * teams exist, which competitions exist, which matches are scheduled and
 * when. That's scheduling scaffolding needed so the UI has something to
 * list and click into — it is not presented as a stat or a prediction.
 *
 * It deliberately contains NO analytical numbers (no probabilities, no
 * scores, no comparison stats, no H2H results, no lineups, no odds). Those
 * all come back null/empty from service.ts's emptyMatchAnalysis() until a
 * real data/AI source is connected — see types.ts's file-level comment.
 */
import type { Competition, Country, Match, Team } from "./types";

export const POPULAR_COUNTRIES: Country[] = [
  { code: "fr", name: "France" },
  { code: "gb", name: "Angleterre" },
  { code: "es", name: "Espagne" },
  { code: "it", name: "Italie" },
  { code: "de", name: "Allemagne" },
  { code: "eu", name: "Europe" },
];

const LIGUE_1: Competition = { id: "ligue-1", name: "Ligue 1", country: "France", sport: "football" };
const LIGUE_2: Competition = { id: "ligue-2", name: "Ligue 2", country: "France", sport: "football" };
const COUPE_DE_FRANCE: Competition = {
  id: "coupe-de-france",
  name: "Coupe de France",
  country: "France",
  sport: "football",
};
const PREMIER_LEAGUE: Competition = {
  id: "premier-league",
  name: "Premier League",
  country: "Angleterre",
  sport: "football",
};
const FA_CUP: Competition = { id: "fa-cup", name: "FA Cup", country: "Angleterre", sport: "football" };
const EFL_CHAMPIONSHIP: Competition = {
  id: "efl-championship",
  name: "EFL Championship",
  country: "Angleterre",
  sport: "football",
};
const LA_LIGA: Competition = { id: "la-liga", name: "La Liga", country: "Espagne", sport: "football" };
const COPA_DEL_REY: Competition = { id: "copa-del-rey", name: "Copa del Rey", country: "Espagne", sport: "football" };
const SERIE_A: Competition = { id: "serie-a", name: "Serie A", country: "Italie", sport: "football" };
const COPPA_ITALIA: Competition = { id: "coppa-italia", name: "Coppa Italia", country: "Italie", sport: "football" };
const BUNDESLIGA: Competition = { id: "bundesliga", name: "Bundesliga", country: "Allemagne", sport: "football" };
const DFB_POKAL: Competition = { id: "dfb-pokal", name: "DFB-Pokal", country: "Allemagne", sport: "football" };
const UCL: Competition = { id: "ucl", name: "UEFA Champions League", country: "Europe", sport: "football" };
const UEL: Competition = { id: "uel", name: "UEFA Europa League", country: "Europe", sport: "football" };

/** Ligue 2 and several cup/second-tier competitions deliberately have no
 * matches in MOCK_MATCHES below — that's the fixture used to demonstrate
 * the "Aucun match disponible" empty state on the competition-browser
 * screen, matching the reference mockup, and to keep this list realistic
 * (a country's full competition list without every single one having a
 * fixture this week). */
export const MOCK_COMPETITIONS: Competition[] = [
  LIGUE_1,
  LIGUE_2,
  COUPE_DE_FRANCE,
  PREMIER_LEAGUE,
  FA_CUP,
  EFL_CHAMPIONSHIP,
  LA_LIGA,
  COPA_DEL_REY,
  SERIE_A,
  COPPA_ITALIA,
  BUNDESLIGA,
  DFB_POKAL,
  UCL,
  UEL,
];

const PSG: Team = {
  id: "psg",
  name: "Paris Saint-Germain",
  shortName: "PSG",
  initials: "PSG",
  country: "France",
  accentColor: "#e52323",
};
const OM: Team = {
  id: "om",
  name: "Olympique de Marseille",
  shortName: "Marseille",
  initials: "OM",
  country: "France",
  accentColor: "#38bdf8",
};
const OL: Team = { id: "ol", name: "Olympique Lyonnais", shortName: "Lyon", initials: "OL", country: "France" };
const MONACO: Team = { id: "monaco", name: "AS Monaco", shortName: "Monaco", initials: "ASM", country: "France" };
const LILLE: Team = { id: "lille", name: "LOSC Lille", shortName: "Lille", initials: "LOSC", country: "France" };
const RENNES: Team = { id: "rennes", name: "Stade Rennais", shortName: "Rennes", initials: "SRFC", country: "France" };
const NICE: Team = { id: "nice", name: "OGC Nice", shortName: "Nice", initials: "OGCN", country: "France" };
const REIMS: Team = { id: "reims", name: "Stade de Reims", shortName: "Reims", initials: "SDR", country: "France" };
const ARSENAL: Team = { id: "arsenal", name: "Arsenal FC", shortName: "Arsenal", initials: "ARS", country: "Angleterre" };
const LIVERPOOL: Team = { id: "liverpool", name: "Liverpool FC", shortName: "Liverpool", initials: "LIV", country: "Angleterre" };
const NEWCASTLE: Team = { id: "newcastle", name: "Newcastle United", shortName: "Newcastle", initials: "NEW", country: "Angleterre" };
const MANCITY: Team = { id: "man-city", name: "Manchester City", shortName: "Man City", initials: "MCI", country: "Angleterre" };
const MANUTD: Team = { id: "man-utd", name: "Manchester United", shortName: "Man United", initials: "MUN", country: "Angleterre" };
const TOTTENHAM: Team = { id: "tottenham", name: "Tottenham Hotspur", shortName: "Tottenham", initials: "TOT", country: "Angleterre" };
const ASTONVILLA: Team = { id: "aston-villa", name: "Aston Villa", shortName: "Aston Villa", initials: "AVL", country: "Angleterre" };

export const MOCK_TEAMS: Team[] = [
  PSG,
  OM,
  OL,
  MONACO,
  LILLE,
  RENNES,
  NICE,
  REIMS,
  ARSENAL,
  LIVERPOOL,
  NEWCASTLE,
  MANCITY,
  MANUTD,
  TOTTENHAM,
  ASTONVILLA,
];

function daysFromNow(days: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const MOCK_MATCHES: Match[] = [
  {
    id: "psg-om-2026",
    sport: "football",
    competition: LIGUE_1,
    homeTeam: PSG,
    awayTeam: OM,
    kickoffAt: daysFromNow(2, 20, 45),
    status: "scheduled",
  },
  {
    id: "ol-monaco-2026",
    sport: "football",
    competition: LIGUE_1,
    homeTeam: OL,
    awayTeam: MONACO,
    kickoffAt: daysFromNow(2, 21),
    status: "scheduled",
  },
  {
    id: "lille-rennes-2026",
    sport: "football",
    competition: LIGUE_1,
    homeTeam: LILLE,
    awayTeam: RENNES,
    kickoffAt: daysFromNow(2, 17),
    status: "scheduled",
  },
  {
    id: "nice-reims-2026",
    sport: "football",
    competition: LIGUE_1,
    homeTeam: NICE,
    awayTeam: REIMS,
    kickoffAt: daysFromNow(3, 15),
    status: "scheduled",
  },
  {
    id: "arsenal-liverpool-2026",
    sport: "football",
    competition: PREMIER_LEAGUE,
    homeTeam: ARSENAL,
    awayTeam: LIVERPOOL,
    kickoffAt: daysFromNow(2, 18, 30),
    status: "scheduled",
  },
  {
    id: "liverpool-newcastle-2026",
    sport: "football",
    competition: PREMIER_LEAGUE,
    homeTeam: LIVERPOOL,
    awayTeam: NEWCASTLE,
    kickoffAt: daysFromNow(3, 21),
    status: "scheduled",
  },
  {
    id: "mancity-manutd-2026",
    sport: "football",
    competition: PREMIER_LEAGUE,
    homeTeam: MANCITY,
    awayTeam: MANUTD,
    kickoffAt: daysFromNow(3, 15),
    status: "scheduled",
  },
  {
    id: "tottenham-astonvilla-2026",
    sport: "football",
    competition: PREMIER_LEAGUE,
    homeTeam: TOTTENHAM,
    awayTeam: ASTONVILLA,
    kickoffAt: daysFromNow(4, 14),
    status: "scheduled",
  },
  {
    id: "monaco-nice-cdf-2026",
    sport: "football",
    competition: COUPE_DE_FRANCE,
    homeTeam: MONACO,
    awayTeam: NICE,
    kickoffAt: daysFromNow(5, 20, 45),
    status: "scheduled",
  },
  {
    id: "manutd-tottenham-facup-2026",
    sport: "football",
    competition: FA_CUP,
    homeTeam: MANUTD,
    awayTeam: TOTTENHAM,
    kickoffAt: daysFromNow(6, 16),
    status: "scheduled",
  },
];

/** Country display name -> ISO-ish code (see FlagIcon), keyed the same as
 * Competition.country / Team.country strings used throughout this file so
 * any component can resolve a <FlagIcon> from plain country text without a
 * second lookup table drifting out of sync with POPULAR_COUNTRIES. */
export function getCountryCode(countryName: string): string | null {
  return POPULAR_COUNTRIES.find((c) => c.name === countryName)?.code ?? null;
}
