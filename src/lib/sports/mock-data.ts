/**
 * Isolated mock dataset for the Sports module — never imported directly
 * by a component (go through service.ts instead), so swapping this file
 * out for a real sports-data API later never touches UI code. See
 * service.ts's own top-of-file comment for the swap plan.
 */
import type {
  BookmakerOdds,
  Competition,
  H2HMatch,
  InjuredPlayer,
  Match,
  MatchAnalysis,
  MatchInfo,
  Opportunity,
  PopularMarket,
  ProbableLineup,
  Team,
  TeamComparisonStat,
  TeamForm,
} from "./types";

const LIGUE_1: Competition = { id: "ligue-1", name: "Ligue 1", country: "France" };
const PREMIER_LEAGUE: Competition = { id: "premier-league", name: "Premier League", country: "Angleterre" };

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
const ARSENAL: Team = { id: "arsenal", name: "Arsenal FC", shortName: "Arsenal", initials: "ARS", country: "Angleterre" };
const LIVERPOOL: Team = { id: "liverpool", name: "Liverpool FC", shortName: "Liverpool", initials: "LIV", country: "Angleterre" };

export const MOCK_TEAMS: Team[] = [PSG, OM, OL, MONACO, ARSENAL, LIVERPOOL];
export const MOCK_COMPETITIONS: Competition[] = [LIGUE_1, PREMIER_LEAGUE];

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
    kickoffAt: daysFromNow(2, 21),
    status: "scheduled",
  },
  {
    id: "ol-monaco-2026",
    sport: "football",
    competition: LIGUE_1,
    homeTeam: OL,
    awayTeam: MONACO,
    kickoffAt: daysFromNow(3, 17),
    status: "scheduled",
  },
  {
    id: "arsenal-liverpool-2026",
    sport: "football",
    competition: PREMIER_LEAGUE,
    homeTeam: ARSENAL,
    awayTeam: LIVERPOOL,
    kickoffAt: daysFromNow(4, 18, 30),
    status: "scheduled",
  },
];

const PSG_OM_OPPORTUNITIES: Opportunity[] = [
  {
    id: "psg-win",
    label: "PSG gagne",
    marketType: "Résultat 1X2",
    probabilityPercent: 64,
    confidence: "Élevée",
    confidenceScore: 82,
    tone: "brand",
  },
  {
    id: "over-1-5",
    label: "+1.5 buts",
    marketType: "Total de buts",
    probabilityPercent: 78,
    confidence: "Élevée",
    confidenceScore: 89,
    tone: "emerald",
  },
  {
    id: "btts-yes",
    label: "BTTS - Oui",
    marketType: "Les deux équipes marquent",
    probabilityPercent: 61,
    confidence: "Moyenne",
    confidenceScore: 72,
    tone: "violet",
  },
  {
    id: "over-2-5",
    label: "+2.5 buts",
    marketType: "Total de buts",
    probabilityPercent: 61,
    confidence: "Moyenne",
    confidenceScore: 68,
    tone: "amber",
  },
  {
    id: "under-4-5-cards",
    label: "Moins de 4.5 cartons",
    marketType: "Total de cartons",
    probabilityPercent: 77,
    confidence: "Élevée",
    confidenceScore: 71,
    tone: "sky",
  },
];

const PSG_FORM: TeamForm = { teamId: "psg", lastFive: ["W", "W", "D", "W", "W"] };
const OM_FORM: TeamForm = { teamId: "om", lastFive: ["W", "L", "W", "D", "W"] };

const PSG_OM_COMPARISON: TeamComparisonStat[] = [
  { label: "Buts marqués / match", homeValue: 2.4, awayValue: 1.8 },
  { label: "Buts encaissés / match", homeValue: 0.9, awayValue: 1.2 },
  { label: "xG / match", homeValue: 2.1, awayValue: 1.6 },
  { label: "Tirs / match", homeValue: 15.2, awayValue: 12.4 },
  { label: "Tirs cadrés / match", homeValue: 6.8, awayValue: 5.1 },
  { label: "Possession", homeValue: 58, awayValue: 47, unit: "%" },
  { label: "Corners / match", homeValue: 6.3, awayValue: 4.9 },
];

const PSG_OM_H2H: H2HMatch[] = [
  { id: "h2h-1", playedAt: "2025-10-26", competition: "Ligue 1", homeTeam: "Marseille", awayTeam: "PSG", homeScore: 0, awayScore: 3 },
  { id: "h2h-2", playedAt: "2025-02-16", competition: "Ligue 1", homeTeam: "PSG", awayTeam: "Marseille", homeScore: 3, awayScore: 1 },
  { id: "h2h-3", playedAt: "2024-10-27", competition: "Ligue 1", homeTeam: "Marseille", awayTeam: "PSG", homeScore: 0, awayScore: 3 },
  { id: "h2h-4", playedAt: "2024-02-25", competition: "Coupe de France", homeTeam: "PSG", awayTeam: "Marseille", homeScore: 2, awayScore: 1 },
];

const PSG_OM_INFO: MatchInfo = {
  venue: "Parc des Princes, Paris",
  weather: null,
  referee: null,
  attendanceEstimate: null,
};

const PSG_OM_ODDS: BookmakerOdds[] = [];

const PSG_OM_POPULAR_MARKETS: PopularMarket[] = [
  {
    key: "1x2",
    label: "1X2",
    outcomes: [
      { label: "PSG", probabilityPercent: 58, odds: null },
      { label: "Nul", probabilityPercent: 24, odds: null },
      { label: "Marseille", probabilityPercent: 18, odds: null },
    ],
  },
  {
    key: "totalGoals",
    label: "Total de buts",
    outcomes: [
      { label: "+2.5", probabilityPercent: 52, odds: null },
      { label: "-2.5", probabilityPercent: 48, odds: null },
    ],
  },
  {
    key: "btts",
    label: "BTTS",
    outcomes: [
      { label: "Oui", probabilityPercent: 64, odds: null },
      { label: "Non", probabilityPercent: 36, odds: null },
    ],
  },
  {
    key: "doubleChance",
    label: "Double chance",
    outcomes: [
      { label: "PSG ou Nul", probabilityPercent: 82, odds: null },
      { label: "Marseille ou Nul", probabilityPercent: 42, odds: null },
    ],
  },
  {
    key: "handicap",
    label: "Handicap",
    outcomes: [
      { label: "PSG -1", probabilityPercent: 39, odds: null },
      { label: "Marseille +1", probabilityPercent: 61, odds: null },
    ],
  },
];

const PSG_OM_LINEUPS: { home: ProbableLineup; away: ProbableLineup } = {
  home: {
    teamId: "psg",
    status: "probable",
    formation: "4-3-3",
    players: [
      { name: "Gianluigi Donnarumma", position: "G" },
      { name: "Achraf Hakimi", position: "DD" },
      { name: "Marquinhos", position: "DC" },
      { name: "Lucas Hernandez", position: "DC" },
      { name: "Nuno Mendes", position: "DG" },
      { name: "Vitinha", position: "MC" },
      { name: "João Neves", position: "MC" },
      { name: "Fabián Ruiz", position: "MC" },
      { name: "Ousmane Dembélé", position: "AD" },
      { name: "Bradley Barcola", position: "AG" },
      { name: "Gonçalo Ramos", position: "BU" },
    ],
  },
  away: {
    teamId: "om",
    status: "probable",
    formation: "4-2-3-1",
    players: [
      { name: "Geronimo Rulli", position: "G" },
      { name: "Pol Lirola", position: "DD" },
      { name: "Leonardo Balerdi", position: "DC" },
      { name: "Derek Cornelius", position: "DC" },
      { name: "Ulisses Garcia", position: "DG" },
      { name: "Geoffrey Kondogbia", position: "MDC" },
      { name: "Angel Gomes", position: "MDC" },
      { name: "Amine Harit", position: "MOC" },
      { name: "Luis Henrique", position: "AD" },
      { name: "Mason Greenwood", position: "AG" },
      { name: "Ionuț Radu", position: "BU" },
    ],
  },
};

const PSG_OM_INJURIES: InjuredPlayer[] = [
  { teamId: "psg", name: "Presnel Kimpembe", status: "out", reason: "Blessure au genou" },
  { teamId: "om", name: "Pierre-Emerick Aubameyang", status: "doubtful", reason: "Gêne musculaire" },
];

const PSG_OM_SUMMARY =
  "PSG aborde ce match sur une dynamique solide à domicile et une meilleure production offensive cette saison. Marseille reste dangereux en contre mais concède davantage de tirs cadrés à l'extérieur. L'historique récent des confrontations directes penche nettement en faveur de PSG.";

export const MOCK_MATCH_ANALYSES: Record<string, MatchAnalysis> = {
  "psg-om-2026": {
    match: MOCK_MATCHES[0]!,
    probabilities: { home: 64, draw: 21, away: 15 },
    verdict: {
      outcome: "PSG gagnant",
      confidenceScore: 82,
      explanation:
        "PSG affiche une meilleure forme récente, un avantage à domicile marqué et une production offensive supérieure (xG, tirs cadrés). L'historique des confrontations directes renforce ce scénario, sans pour autant le garantir.",
    },
    opportunities: PSG_OM_OPPORTUNITIES,
    form: { home: PSG_FORM, away: OM_FORM },
    comparison: PSG_OM_COMPARISON,
    h2h: PSG_OM_H2H,
    aiSummary: PSG_OM_SUMMARY,
    info: PSG_OM_INFO,
    odds: PSG_OM_ODDS,
    popularMarkets: PSG_OM_POPULAR_MARKETS,
    lineups: PSG_OM_LINEUPS,
    injuries: PSG_OM_INJURIES,
  },
};
